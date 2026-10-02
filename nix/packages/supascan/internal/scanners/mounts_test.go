package scanners

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/supabase/supascan/internal/spec"
)

func TestMountScanner_BasicScan(t *testing.T) {
	tmpDir := t.TempDir()
	mountsFile := filepath.Join(tmpDir, "mounts")

	// Create a test mounts file (format from /proc/mounts)
	mountsContent := `sysfs /sys sysfs rw,nosuid,nodev,noexec,relatime 0 0
proc /proc proc rw,nosuid,nodev,noexec,relatime 0 0
/dev/sda1 / ext4 rw,relatime,errors=remount-ro 0 0
/dev/sda2 /home ext4 rw,relatime 0 0
tmpfs /tmp tmpfs rw,nosuid,nodev 0 0
`
	if err := os.WriteFile(mountsFile, []byte(mountsContent), 0644); err != nil {
		t.Fatalf("Failed to create test mounts file: %v", err)
	}

	scanner := &MountScanner{mountsPath: mountsFile}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Logger: testLogger(),
	}

	_, err := scanner.Scan(context.Background(), opts)
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	results := writer.GetMountResults()

	// Should have 5 mounts
	if len(results) != 5 {
		t.Errorf("Expected 5 mounts, got %d", len(results))
	}

	// Check root mount
	root, ok := results["/"]
	if !ok {
		t.Fatalf("root mount not found")
	}
	if root.Filesystem != "ext4" {
		t.Errorf("Expected filesystem 'ext4', got '%s'", root.Filesystem)
	}
	// Source is now filtered out for /dev/* devices (instance-specific)
	if root.Source != "" {
		t.Errorf("Expected source to be empty for /dev/* device, got '%s'", root.Source)
	}
	if len(root.Opts) == 0 {
		t.Errorf("Expected mount options to be parsed")
	}

	// Check /tmp mount
	tmp, ok := results["/tmp"]
	if !ok {
		t.Fatalf("/tmp mount not found")
	}
	if tmp.Filesystem != "tmpfs" {
		t.Errorf("Expected filesystem 'tmpfs', got '%s'", tmp.Filesystem)
	}

	// Verify options are parsed
	hasNosuid := false
	for _, opt := range tmp.Opts {
		if opt == "nosuid" {
			hasNosuid = true
			break
		}
	}
	if !hasNosuid {
		t.Errorf("Expected 'nosuid' option in /tmp mount options")
	}
}

func TestMountScanner_Properties(t *testing.T) {
	scanner := &MountScanner{}

	if scanner.Name() != "mounts" {
		t.Errorf("Expected name 'mounts', got '%s'", scanner.Name())
	}

	if scanner.IsDynamic() != false {
		t.Errorf("MountScanner should not be dynamic")
	}
}

func TestMountScanner_FiltersInstanceSpecificOptions(t *testing.T) {
	tmpDir := t.TempDir()
	mountsFile := filepath.Join(tmpDir, "mounts")

	// Create mounts file with instance-specific options that should be filtered
	mountsContent := `tmpfs /dev/shm tmpfs rw,nosuid,nodev,size=194656k,nr_inodes=48664,inode64 0 0
/dev/nvme1n1p2 / ext4 rw,relatime,discard 0 0
`
	if err := os.WriteFile(mountsFile, []byte(mountsContent), 0644); err != nil {
		t.Fatalf("Failed to create test mounts file: %v", err)
	}

	scanner := &MountScanner{mountsPath: mountsFile}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Logger: testLogger(),
	}

	_, err := scanner.Scan(context.Background(), opts)
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	results := writer.GetMountResults()

	// Check /dev/shm - should have size= and nr_inodes= filtered out
	shm, ok := results["/dev/shm"]
	if !ok {
		t.Fatalf("/dev/shm mount not found")
	}
	for _, opt := range shm.Opts {
		if opt == "size=194656k" || opt == "nr_inodes=48664" {
			t.Errorf("Instance-specific option '%s' should have been filtered out", opt)
		}
	}
	// Source should be empty for tmpfs (virtual filesystem)
	if shm.Source != "" {
		t.Errorf("Expected empty source for tmpfs, got '%s'", shm.Source)
	}

	// Check root - source should be empty for /dev/nvme* devices
	root, ok := results["/"]
	if !ok {
		t.Fatalf("root mount not found")
	}
	if root.Source != "" {
		t.Errorf("Expected empty source for /dev/nvme* device, got '%s'", root.Source)
	}
}

func TestMountScanner_MalformedLines(t *testing.T) {
	tmpDir := t.TempDir()
	mountsFile := filepath.Join(tmpDir, "mounts")

	// Create mounts file with some malformed lines
	mountsContent := `sysfs /sys sysfs rw,nosuid 0 0
invalid line here
proc /proc proc rw 0 0
/dev/sda1 / ext4 rw 0 0
`
	if err := os.WriteFile(mountsFile, []byte(mountsContent), 0644); err != nil {
		t.Fatalf("Failed to create test mounts file: %v", err)
	}

	scanner := &MountScanner{mountsPath: mountsFile}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Logger: testLogger(),
	}

	_, err := scanner.Scan(context.Background(), opts)
	if err != nil {
		t.Fatalf("Scan should not fail on malformed lines: %v", err)
	}

	results := writer.GetMountResults()

	// Should have 3 valid mounts (malformed line skipped)
	if len(results) != 3 {
		t.Errorf("Expected 3 valid mounts, got %d", len(results))
	}
}
