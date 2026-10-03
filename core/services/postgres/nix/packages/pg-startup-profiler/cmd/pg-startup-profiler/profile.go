package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/spf13/cobra"
	"github.com/supabase/pg-startup-profiler/internal/docker"
	"github.com/supabase/pg-startup-profiler/internal/logger"
	"github.com/supabase/pg-startup-profiler/internal/logs"
	"github.com/supabase/pg-startup-profiler/internal/report"
	"github.com/supabase/pg-startup-profiler/internal/rules"
)

var (
	flagImage      string
	flagDockerfile string
	flagJSON       bool
	flagVerbose    bool
	flagRulesFile  string
	flagTimeout    time.Duration
)

func init() {
	profileCmd.Flags().StringVar(&flagImage, "image", "", "Docker image to profile")
	profileCmd.Flags().StringVar(&flagDockerfile, "dockerfile", "", "Dockerfile to build and profile")
	profileCmd.Flags().BoolVar(&flagJSON, "json", false, "Output as JSON")
	profileCmd.Flags().BoolVar(&flagVerbose, "verbose", false, "Include full event timeline")
	profileCmd.Flags().StringVar(&flagRulesFile, "rules", "", "Custom rules YAML file")
	profileCmd.Flags().DurationVar(&flagTimeout, "timeout", 5*time.Minute, "Timeout for container startup")

	rootCmd.AddCommand(profileCmd)
}

var profileCmd = &cobra.Command{
	Use:   "profile",
	Short: "Profile container startup time",
	Long:  "Profile a PostgreSQL container's startup time and show breakdown",
	RunE:  runProfile,
}

func runProfile(cmd *cobra.Command, args []string) error {
	log := logger.Setup(flagVerbose, false)

	if flagImage == "" && flagDockerfile == "" {
		return fmt.Errorf("either --image or --dockerfile is required")
	}

	// Load rules
	var rulesData []byte
	if flagRulesFile != "" {
		data, err := os.ReadFile(flagRulesFile)
		if err != nil {
			return fmt.Errorf("failed to read rules file: %w", err)
		}
		rulesData = data
	} else {
		rulesData = rules.DefaultRulesYAML
	}

	r, err := rules.LoadFromYAML(rulesData)
	if err != nil {
		return fmt.Errorf("failed to load rules: %w", err)
	}

	// Create Docker client
	dockerClient, err := docker.NewClient()
	if err != nil {
		return fmt.Errorf("failed to create docker client: %w", err)
	}
	defer dockerClient.Close()

	ctx, cancel := context.WithTimeout(context.Background(), flagTimeout)
	defer cancel()

	// Handle signals
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigCh
		cancel()
	}()

	imageName := flagImage
	if flagDockerfile != "" {
		// Build image
		log.Info("Building image from Dockerfile", "dockerfile", flagDockerfile)
		imageName = fmt.Sprintf("pg-startup-profiler-test:%d", time.Now().Unix())
		// For now, shell out to docker build
		return fmt.Errorf("--dockerfile not yet implemented, please build image first and use --image")
	}

	// Check image exists
	exists, err := dockerClient.ImageExists(ctx, imageName)
	if err != nil {
		return fmt.Errorf("failed to check image: %w", err)
	}
	if !exists {
		return fmt.Errorf("image not found: %s", imageName)
	}

	log.Info("Profiling container startup", "image", imageName)

	// Create timeline
	timeline := report.NewTimeline()
	parser := logs.NewParser(r)

	// Create container
	env := []string{"POSTGRES_PASSWORD=postgres"}
	container, err := dockerClient.CreateContainer(ctx, imageName, env)
	if err != nil {
		return fmt.Errorf("failed to create container: %w", err)
	}
	defer func() {
		dockerClient.StopContainer(context.Background(), container.ID)
		dockerClient.RemoveContainer(context.Background(), container.ID)
	}()

	// Start log streaming
	logEvents := make(chan logs.Event, 100)
	logDone := make(chan error, 1)
	go func() {
		err := dockerClient.StreamLogs(ctx, container.ID, func(line string, ts time.Time) {
			parser.ParseLine(line, ts, logEvents)
		})
		logDone <- err
	}()

	// Start container and record time
	startTime, err := dockerClient.StartContainer(ctx, container.ID)
	if err != nil {
		return fmt.Errorf("failed to start container: %w", err)
	}

	timeline.AddEvent(report.Event{
		Type:      report.EventTypeDocker,
		Name:      "container_start",
		Timestamp: startTime,
	})

	// Wait for ready or timeout
	ready := false
	for !ready {
		select {
		case event := <-logEvents:
			timeline.AddEvent(report.Event{
				Type:       report.EventTypeLog,
				Name:       event.Name,
				Timestamp:  event.Timestamp,
				Captures:   event.Captures,
				MarksReady: event.MarksReady,
			})
			if event.MarksReady {
				ready = true
			}
		case <-ctx.Done():
			return fmt.Errorf("timeout waiting for container to be ready")
		case err := <-logDone:
			if err != nil && !ready {
				return fmt.Errorf("log streaming error: %w", err)
			}
		}
	}

	// Finalize timeline
	timeline.Finalize()

	// Output results
	if flagJSON {
		return report.PrintJSON(os.Stdout, imageName, timeline, flagVerbose)
	}
	if flagVerbose {
		report.PrintTableVerbose(os.Stdout, imageName, timeline)
	} else {
		report.PrintTable(os.Stdout, imageName, timeline)
	}
	return nil
}
