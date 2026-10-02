package scanners

import (
	"context"
	"fmt"
)

// CommandScanner is a special scanner for CIS benchmark command checks.
// This scanner doesn't scan the system directly - it's designed to allow
// adding custom command checks that are specific to CIS benchmarks.
// For now, this is implemented as a no-op scanner.
type CommandScanner struct {
	stats ScanStats
}

func (s *CommandScanner) Name() string {
	return "commands"
}

func (s *CommandScanner) IsDynamic() bool {
	return false // Command checks are static definitions
}

func (s *CommandScanner) Scan(ctx context.Context, opts ScanOptions) (ScanStats, error) {
	opts.Logger.Info("Starting command scan")

	// Get writer interface
	writer, ok := opts.Writer.(Writer)
	if !ok {
		return s.stats, fmt.Errorf("writer does not implement Writer interface")
	}

	if err := writer.StartResource("command"); err != nil {
		return s.stats, err
	}

	// No-op for now - this scanner is a placeholder for future CIS command checks
	// Commands would be added programmatically or loaded from configuration
	opts.Logger.Info("Command scan complete (no-op)", "commands_found", 0)

	return s.stats, nil
}
