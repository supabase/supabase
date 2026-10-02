package main

import (
	"os"

	"github.com/spf13/cobra"
)

var (
	version = "dev"
)

var rootCmd = &cobra.Command{
	Use:   "pg-startup-profiler",
	Short: "PostgreSQL container startup profiler",
	Long: `pg-startup-profiler - Profile PostgreSQL container startup time

A tool for measuring and analyzing PostgreSQL container startup performance
using eBPF tracing and log parsing.

Commands:
  profile   Profile a container's startup time
  compare   Compare startup times between two images

Examples:
  # Profile a Dockerfile
  pg-startup-profiler profile --dockerfile Dockerfile-17

  # Profile existing image
  pg-startup-profiler profile --image pg-docker-test:17

  # JSON output
  pg-startup-profiler profile --image pg-docker-test:17 --json

  # Compare two images
  pg-startup-profiler compare --baseline img:v1 --candidate img:v2
`,
	Version: version,
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
