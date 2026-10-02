package scanners

import (
	"context"
	"fmt"
	"time"

	"github.com/charmbracelet/log"
)

// Scanner defines the interface that all resource scanners must implement
type Scanner interface {
	// Name returns the unique identifier for this scanner
	Name() string

	// Scan performs the actual scanning logic and writes results to the writer
	Scan(ctx context.Context, opts ScanOptions) (ScanStats, error)

	// IsDynamic returns true if this scanner requires dynamic system access
	// (e.g., running processes, network connections)
	IsDynamic() bool
}

// Writer interface for writing spec resources
type Writer interface {
	StartResource(resourceType string) error
	Add(spec interface{}) error
	Flush() error
	Close() error
	WriteHeader(comment string) error
}

// ScanOptions contains configuration for running scanners
type ScanOptions struct {
	// Writer is where scan results should be written
	Writer Writer

	// Config contains the audit configuration (optional, for future use)
	Config interface{}

	// IncludeDynamic determines whether to run dynamic scanners
	IncludeDynamic bool

	// Strict mode - fail fast on first error
	Strict bool

	// Logger for diagnostic output
	Logger *log.Logger
}

// ScanStats contains aggregate statistics from scanner runs
type ScanStats struct {
	// ScannersRun is the number of scanners that executed
	ScannersRun int

	// FilesScanned is the total number of files scanned
	FilesScanned int

	// FilesSkipped is the number of files skipped
	FilesSkipped int

	// UsersScanned is the number of users scanned
	UsersScanned int

	// ServicesScanned is the number of services scanned
	ServicesScanned int

	// Duration is the total time taken
	Duration time.Duration

	// Warnings is a list of non-fatal warnings encountered
	Warnings []string
}

// AllScanners is the registry of all available scanners
var AllScanners = []Scanner{
	// Static scanners (always run)
	&FileScanner{},
	&PackageScanner{},
	&ServiceScanner{},
	&UserScanner{},
	&GroupScanner{},
	&KernelParamScanner{},
	&MountScanner{},
	&CommandScanner{},

	// Dynamic scanners (opt-in via IncludeDynamic flag)
	&PortScanner{},
	&ProcessScanner{},
}

// RunAll executes all registered scanners and returns aggregate statistics
func RunAll(ctx context.Context, opts ScanOptions) (ScanStats, error) {
	startTime := time.Now()
	var aggregateStats ScanStats

	for _, scanner := range AllScanners {
		// Skip dynamic scanners unless explicitly included
		if scanner.IsDynamic() && !opts.IncludeDynamic {
			opts.Logger.Debug("Skipping dynamic scanner", "scanner", scanner.Name())
			continue
		}

		opts.Logger.Info("Running scanner", "scanner", scanner.Name())

		stats, err := scanner.Scan(ctx, opts)
		if err != nil {
			if opts.Strict {
				// In strict mode, fail fast
				return aggregateStats, fmt.Errorf("scanner %s failed: %w", scanner.Name(), err)
			}
			// In non-strict mode, log error and continue
			warning := fmt.Sprintf("Scanner %s failed: %v", scanner.Name(), err)
			aggregateStats.Warnings = append(aggregateStats.Warnings, warning)
			opts.Logger.Warn("Scanner failed", "scanner", scanner.Name(), "error", err)
			continue
		}

		// Aggregate statistics
		aggregateStats.ScannersRun++
		aggregateStats.FilesScanned += stats.FilesScanned
		aggregateStats.FilesSkipped += stats.FilesSkipped
		aggregateStats.UsersScanned += stats.UsersScanned
		aggregateStats.ServicesScanned += stats.ServicesScanned
		aggregateStats.Warnings = append(aggregateStats.Warnings, stats.Warnings...)
	}

	aggregateStats.Duration = time.Since(startTime)
	return aggregateStats, nil
}
