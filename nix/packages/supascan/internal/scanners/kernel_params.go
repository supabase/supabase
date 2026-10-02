package scanners

import (
	"bufio"
	"context"
	"fmt"
	"os/exec"
	"strings"

	"github.com/supabase/supascan/internal/config"
	"github.com/supabase/supascan/internal/spec"
)

// KernelParamScanner scans all kernel parameters using sysctl.
type KernelParamScanner struct {
	mockSysctlOutput string // For testing
	stats            ScanStats
}

func (s *KernelParamScanner) Name() string {
	return "kernel-params"
}

func (s *KernelParamScanner) IsDynamic() bool {
	return false // With proper exclusions, kernel params are relatively static
}

func (s *KernelParamScanner) Scan(ctx context.Context, opts ScanOptions) (ScanStats, error) {
	opts.Logger.Info("Starting kernel parameter scan")

	// Get writer interface
	writer, ok := opts.Writer.(Writer)
	if !ok {
		return s.stats, fmt.Errorf("writer does not implement Writer interface")
	}

	if err := writer.StartResource("kernel-param"); err != nil {
		return s.stats, err
	}

	// Get config for exclusions
	cfg, ok := opts.Config.(*config.Config)
	if !ok && opts.Config != nil {
		return s.stats, fmt.Errorf("config is not of type *config.Config")
	}
	if cfg == nil {
		cfg = &config.Config{} // Empty config if none provided
	}

	// Get kernel params
	params, err := s.getKernelParams(ctx, opts, cfg)
	if err != nil {
		return s.stats, err
	}

	// Add each param to writer
	for key, param := range params {
		if err := writer.Add(param); err != nil {
			return s.stats, fmt.Errorf("failed to write kernel param spec for %s: %w", key, err)
		}
	}

	opts.Logger.Info("Kernel parameter scan complete", "params_found", len(params))

	return s.stats, nil
}

// getKernelParams retrieves all kernel parameters using sysctl
func (s *KernelParamScanner) getKernelParams(ctx context.Context, opts ScanOptions, cfg *config.Config) (map[string]spec.KernelParamSpec, error) {
	var output string

	if s.mockSysctlOutput != "" {
		// Use mock output for testing
		output = s.mockSysctlOutput
	} else {
		// Check if sysctl is available
		sysctlPath, err := exec.LookPath("sysctl")
		if err != nil {
			opts.Logger.Warn("sysctl not found, skipping kernel parameter scan")
			return make(map[string]spec.KernelParamSpec), nil
		}

		// Run sysctl -a to get all parameters
		cmd := exec.CommandContext(ctx, sysctlPath, "-a")

		stdout, err := cmd.Output()
		if err != nil {
			// sysctl -a may fail on some systems, but we continue with what we can get
			opts.Logger.Warn("sysctl command had errors, continuing with partial results", "error", err)
			if len(stdout) == 0 {
				return make(map[string]spec.KernelParamSpec), nil
			}
		}

		output = string(stdout)
	}

	return s.parseKernelParams(output, opts, cfg), nil
}

// parseKernelParams parses sysctl output into KernelParamSpec map
func (s *KernelParamScanner) parseKernelParams(output string, opts ScanOptions, cfg *config.Config) map[string]spec.KernelParamSpec {
	params := make(map[string]spec.KernelParamSpec)
	scanner := bufio.NewScanner(strings.NewReader(output))

	for scanner.Scan() {
		line := scanner.Text()

		// Skip empty lines
		if strings.TrimSpace(line) == "" {
			continue
		}

		// Skip lines that don't start with a letter or number (multiline continuations)
		if len(line) > 0 && !isAlphanumeric(line[0]) {
			continue
		}

		// Parse line format: key = value
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			// Skip lines without '=' (error messages, etc.)
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		// Skip if key is empty
		if key == "" {
			continue
		}

		// Check if this param is excluded
		if cfg.IsKernelParamExcluded(key) {
			opts.Logger.Debug("Excluding kernel param", "key", key)
			continue
		}

		// Convert tabs to spaces in value
		value = strings.ReplaceAll(value, "\t", " ")

		params[key] = spec.KernelParamSpec{
			Key:   key,
			Value: value,
		}
	}

	return params
}

// isAlphanumeric checks if a byte is alphanumeric or a dot (for param names)
func isAlphanumeric(b byte) bool {
	return (b >= 'a' && b <= 'z') ||
		(b >= 'A' && b <= 'Z') ||
		(b >= '0' && b <= '9') ||
		b == '.' || b == '_' || b == '-'
}
