package scanners

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os/exec"
	"strings"

	"github.com/supabase/supascan/internal/spec"
)

// PackageScanner scans all installed packages using dpkg.
type PackageScanner struct {
	stats ScanStats
}

func (s *PackageScanner) Name() string {
	return "packages"
}

func (s *PackageScanner) IsDynamic() bool {
	return false // Package installations are relatively static
}

func (s *PackageScanner) Scan(ctx context.Context, opts ScanOptions) (ScanStats, error) {
	opts.Logger.Info("Starting package scan")

	// Get writer interface
	writer, ok := opts.Writer.(Writer)
	if !ok {
		return s.stats, fmt.Errorf("writer does not implement Writer interface")
	}

	if err := writer.StartResource("package"); err != nil {
		return s.stats, err
	}

	// Get installed packages
	packages, err := s.getInstalledPackages(ctx, opts)
	if err != nil {
		return s.stats, err
	}

	// Add each package to writer
	for name, pkg := range packages {
		if err := writer.Add(pkg); err != nil {
			return s.stats, fmt.Errorf("failed to write package spec for %s: %w", name, err)
		}
	}

	opts.Logger.Info("Package scan complete", "packages_found", len(packages))

	return s.stats, nil
}

// getInstalledPackages executes dpkg-query and returns parsed packages
func (s *PackageScanner) getInstalledPackages(ctx context.Context, opts ScanOptions) (map[string]spec.PackageSpec, error) {
	// Check if dpkg is available
	dpkgPath, err := exec.LookPath("dpkg-query")
	if err != nil {
		opts.Logger.Warn("dpkg-query not found, skipping package scan (not a Debian-based system?)")
		return make(map[string]spec.PackageSpec), nil
	}

	// Run dpkg-query with custom format
	cmd := exec.CommandContext(ctx, dpkgPath, "-W", "-f=${Package}\t${Version}\t${Status}\n")

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create stdout pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start dpkg-query: %w", err)
	}

	// Parse output while command is running
	packages, parseErr := s.parsePackages(stdout)

	// Wait for command to complete
	if err := cmd.Wait(); err != nil {
		return nil, fmt.Errorf("dpkg-query command failed: %w", err)
	}

	if parseErr != nil {
		return nil, parseErr
	}

	return packages, nil
}

// parsePackages parses dpkg-query output into PackageSpec map
func (s *PackageScanner) parsePackages(r io.Reader) (map[string]spec.PackageSpec, error) {
	packages := make(map[string]spec.PackageSpec)
	scanner := bufio.NewScanner(r)

	lineNum := 0
	for scanner.Scan() {
		lineNum++
		line := scanner.Text()

		// Skip empty lines
		if strings.TrimSpace(line) == "" {
			continue
		}

		// Parse tab-separated fields: Package\tVersion\tStatus
		fields := strings.Split(line, "\t")
		if len(fields) != 3 {
			// Skip malformed lines (log at debug level)
			continue
		}

		pkgName := strings.TrimSpace(fields[0])
		version := strings.TrimSpace(fields[1])
		status := strings.TrimSpace(fields[2])

		// Only include packages with status "install ok installed"
		// This filters out deinstalled, half-installed, etc.
		if status != "install ok installed" {
			continue
		}

		packages[pkgName] = spec.PackageSpec{
			Name:      pkgName,
			Installed: true,
			Versions:  []string{version},
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading dpkg output: %w", err)
	}

	return packages, nil
}
