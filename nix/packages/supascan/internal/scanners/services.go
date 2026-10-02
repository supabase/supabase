package scanners

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"

	"github.com/supabase/supascan/internal/spec"
)

// ServiceScanner scans all systemd services using systemctl.
type ServiceScanner struct {
	stats ScanStats
}

func (s *ServiceScanner) Name() string {
	return "services"
}

func (s *ServiceScanner) IsDynamic() bool {
	return false // Service configuration is relatively static
}

func (s *ServiceScanner) Scan(ctx context.Context, opts ScanOptions) (ScanStats, error) {
	opts.Logger.Info("Starting service scan")

	// Get writer interface
	writer, ok := opts.Writer.(Writer)
	if !ok {
		return s.stats, fmt.Errorf("writer does not implement Writer interface")
	}

	if err := writer.StartResource("service"); err != nil {
		return s.stats, err
	}

	// Get services
	services, err := s.getServices(ctx, opts)
	if err != nil {
		return s.stats, err
	}

	// Add each service to writer
	for name, svc := range services {
		if err := writer.Add(svc); err != nil {
			return s.stats, fmt.Errorf("failed to write service spec for %s: %w", name, err)
		}
		s.stats.ServicesScanned++
	}

	opts.Logger.Info("Service scan complete", "services_found", len(services))

	return s.stats, nil
}

// systemdUnit represents a systemd unit from JSON output
type systemdUnit struct {
	Unit        string `json:"unit"`
	Load        string `json:"load"`
	Active      string `json:"active"`
	Sub         string `json:"sub"`
	Description string `json:"description"`
}

// getServices retrieves all systemd services
func (s *ServiceScanner) getServices(ctx context.Context, opts ScanOptions) (map[string]spec.ServiceSpec, error) {
	// Check if systemctl is available
	systemctlPath, err := exec.LookPath("systemctl")
	if err != nil {
		opts.Logger.Warn("systemctl not found, skipping service scan (not a systemd system?)")
		return make(map[string]spec.ServiceSpec), nil
	}

	// Run systemctl to list all services
	cmd := exec.CommandContext(ctx, systemctlPath, "list-units", "--type=service", "--all", "--no-pager", "--output=json")

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create stdout pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start systemctl: %w", err)
	}

	// Parse JSON output
	var units []systemdUnit
	if err := json.NewDecoder(stdout).Decode(&units); err != nil {
		// If JSON parsing fails, systemctl might not support JSON output
		// Fall back to simple list parsing
		if waitErr := cmd.Wait(); waitErr != nil {
			opts.Logger.Warn("systemctl JSON output not supported, trying fallback method")
		}
		return s.getServicesFallback(ctx, opts)
	}

	if err := cmd.Wait(); err != nil {
		return nil, fmt.Errorf("systemctl command failed: %w", err)
	}

	// Convert units to service specs
	services := make(map[string]spec.ServiceSpec)
	for _, unit := range units {
		if !strings.HasSuffix(unit.Unit, ".service") {
			continue
		}

		serviceName := strings.TrimSuffix(unit.Unit, ".service")

		// Get enabled status for this service
		enabled := s.isServiceEnabled(ctx, serviceName, opts)

		services[serviceName] = spec.ServiceSpec{
			Name:    serviceName,
			Enabled: enabled,
			Running: unit.Active == "active",
		}
	}

	return services, nil
}

// getServicesFallback uses simple text parsing when JSON output is not available
func (s *ServiceScanner) getServicesFallback(ctx context.Context, opts ScanOptions) (map[string]spec.ServiceSpec, error) {
	systemctlPath, _ := exec.LookPath("systemctl")

	// List all service units
	cmd := exec.CommandContext(ctx, systemctlPath, "list-units", "--type=service", "--all", "--no-pager", "--no-legend")

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create stdout pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start systemctl: %w", err)
	}

	services := make(map[string]spec.ServiceSpec)
	scanner := bufio.NewScanner(stdout)

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		// Parse line format: UNIT LOAD ACTIVE SUB DESCRIPTION
		fields := strings.Fields(line)
		if len(fields) < 4 {
			continue
		}

		unitName := fields[0]
		if !strings.HasSuffix(unitName, ".service") {
			continue
		}

		serviceName := strings.TrimSuffix(unitName, ".service")
		activeState := fields[2]

		// Get enabled status
		enabled := s.isServiceEnabled(ctx, serviceName, opts)

		services[serviceName] = spec.ServiceSpec{
			Name:    serviceName,
			Enabled: enabled,
			Running: activeState == "active",
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading systemctl output: %w", err)
	}

	if err := cmd.Wait(); err != nil {
		return nil, fmt.Errorf("systemctl command failed: %w", err)
	}

	return services, nil
}

// isServiceEnabled checks if a service is enabled
func (s *ServiceScanner) isServiceEnabled(ctx context.Context, serviceName string, opts ScanOptions) bool {
	systemctlPath, _ := exec.LookPath("systemctl")

	cmd := exec.CommandContext(ctx, systemctlPath, "is-enabled", serviceName)
	output, err := cmd.Output()

	if err != nil {
		// Service might not be enabled or doesn't exist
		return false
	}

	status := strings.TrimSpace(string(output))
	return status == "enabled"
}
