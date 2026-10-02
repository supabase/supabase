package scanners

import (
	"context"
	"fmt"

	"github.com/shirou/gopsutil/v3/process"
	"github.com/supabase/supascan/internal/spec"
)

// ProcessScanner scans all running processes using gopsutil.
// This is a DYNAMIC scanner - it requires opt-in via IncludeDynamic flag.
type ProcessScanner struct {
	stats ScanStats
}

func (s *ProcessScanner) Name() string {
	return "processes"
}

func (s *ProcessScanner) IsDynamic() bool {
	return true // Running processes change dynamically
}

func (s *ProcessScanner) Scan(ctx context.Context, opts ScanOptions) (ScanStats, error) {
	opts.Logger.Info("Starting process scan")

	// Get writer interface
	writer, ok := opts.Writer.(Writer)
	if !ok {
		return s.stats, fmt.Errorf("writer does not implement Writer interface")
	}

	if err := writer.StartResource("process"); err != nil {
		return s.stats, err
	}

	// Get running processes
	processes, err := s.getRunningProcesses(ctx, opts)
	if err != nil {
		return s.stats, err
	}

	// Add each process to writer
	for procName, proc := range processes {
		if err := writer.Add(proc); err != nil {
			return s.stats, fmt.Errorf("failed to write process spec for %s: %w", procName, err)
		}
	}

	opts.Logger.Info("Process scan complete", "processes_found", len(processes))

	return s.stats, nil
}

// getRunningProcesses retrieves all running processes
func (s *ProcessScanner) getRunningProcesses(ctx context.Context, opts ScanOptions) (map[string]spec.ProcessSpec, error) {
	processes := make(map[string]spec.ProcessSpec)

	// Get all processes
	procs, err := process.ProcessesWithContext(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get processes: %w", err)
	}

	for _, proc := range procs {
		// Get process name
		name, err := proc.NameWithContext(ctx)
		if err != nil {
			// Skip processes we can't read (permission denied, etc.)
			opts.Logger.Debug("Failed to get process name, skipping", "pid", proc.Pid, "error", err)
			continue
		}

		// Use name as key (will deduplicate processes with same name)
		// In GOSS, processes are identified by their command name
		processes[name] = spec.ProcessSpec{
			Comm:    name,
			Running: true,
		}
	}

	return processes, nil
}
