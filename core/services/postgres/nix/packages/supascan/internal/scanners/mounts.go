package scanners

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/supabase/supascan/internal/spec"
)

// MountScanner scans all mounts from /proc/mounts.
type MountScanner struct {
	mountsPath string // For testing (default: "/proc/mounts")
	stats      ScanStats
}

func (s *MountScanner) Name() string {
	return "mounts"
}

func (s *MountScanner) IsDynamic() bool {
	return false // Mount points are relatively static
}

func (s *MountScanner) Scan(ctx context.Context, opts ScanOptions) (ScanStats, error) {
	opts.Logger.Info("Starting mount scan")

	// Get writer interface
	writer, ok := opts.Writer.(Writer)
	if !ok {
		return s.stats, fmt.Errorf("writer does not implement Writer interface")
	}

	if err := writer.StartResource("mount"); err != nil {
		return s.stats, err
	}

	// Get mounts
	mounts, err := s.getMounts(opts)
	if err != nil {
		return s.stats, err
	}

	// Add each mount to writer
	for path, mount := range mounts {
		if err := writer.Add(mount); err != nil {
			return s.stats, fmt.Errorf("failed to write mount spec for %s: %w", path, err)
		}
	}

	opts.Logger.Info("Mount scan complete", "mounts_found", len(mounts))

	return s.stats, nil
}

// getMounts reads and parses /proc/mounts
func (s *MountScanner) getMounts(opts ScanOptions) (map[string]spec.MountSpec, error) {
	mountsPath := s.mountsPath
	if mountsPath == "" {
		mountsPath = "/proc/mounts"
	}

	file, err := os.Open(mountsPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open %s: %w", mountsPath, err)
	}
	defer file.Close()

	mounts := make(map[string]spec.MountSpec)
	scanner := bufio.NewScanner(file)
	lineNum := 0

	for scanner.Scan() {
		lineNum++
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Parse mounts line: device mountpoint fstype options dump pass
		// Fields are space-separated
		fields := strings.Fields(line)
		if len(fields) < 4 {
			// Skip malformed lines
			opts.Logger.Debug("Skipping malformed mounts line", "line", lineNum, "content", line)
			continue
		}

		device := fields[0]
		mountpoint := fields[1]
		fstype := fields[2]
		optionsStr := fields[3]

		// Parse options (comma-separated), filtering out instance-specific values
		var filteredOpts []string
		if optionsStr != "" {
			for _, opt := range strings.Split(optionsStr, ",") {
				// Skip instance-specific options that vary by RAM/instance type
				if strings.HasPrefix(opt, "size=") ||
					strings.HasPrefix(opt, "nr_inodes=") ||
					strings.HasPrefix(opt, "nr_blocks=") {
					continue
				}
				filteredOpts = append(filteredOpts, opt)
			}
		}

		// Determine if source should be included
		// Skip source for virtual filesystems where device names are meaningless or instance-specific
		source := device
		if isVirtualOrInstanceSpecificSource(device, fstype) {
			source = ""
		}

		mounts[mountpoint] = spec.MountSpec{
			Path:       mountpoint,
			Exists:     true,
			Filesystem: fstype,
			Opts:       filteredOpts,
			Source:     source,
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading %s: %w", mountsPath, err)
	}

	return mounts, nil
}

// isVirtualOrInstanceSpecificSource returns true if the device/source is virtual
// or instance-specific (e.g., /dev/nvme* device names that vary by instance)
func isVirtualOrInstanceSpecificSource(device, fstype string) bool {
	// Virtual filesystems where source is just a label
	virtualFsTypes := map[string]bool{
		"tmpfs":       true,
		"devtmpfs":    true,
		"sysfs":       true,
		"proc":        true,
		"devpts":      true,
		"cgroup":      true,
		"cgroup2":     true,
		"securityfs":  true,
		"debugfs":     true,
		"hugetlbfs":   true,
		"mqueue":      true,
		"binfmt_misc": true,
		"configfs":    true,
		"fusectl":     true,
		"tracefs":     true,
		"pstore":      true,
		"efivarfs":    true,
		"bpf":         true,
	}

	if virtualFsTypes[fstype] {
		return true
	}

	// Instance-specific block devices (NVMe devices vary by instance)
	if strings.HasPrefix(device, "/dev/nvme") ||
		strings.HasPrefix(device, "/dev/xvd") ||
		strings.HasPrefix(device, "/dev/sd") {
		return true
	}

	return false
}
