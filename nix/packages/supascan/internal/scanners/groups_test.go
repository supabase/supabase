package scanners

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/supabase/supascan/internal/spec"
)

func TestGroupScanner_BasicScan(t *testing.T) {
	tmpDir := t.TempDir()
	groupFile := filepath.Join(tmpDir, "group")

	// Create a test group file
	groupContent := `root:x:0:
daemon:x:1:
bin:x:2:
sys:x:3:
adm:x:4:syslog,ubuntu
sudo:x:27:ubuntu
ubuntu:x:1000:
`
	if err := os.WriteFile(groupFile, []byte(groupContent), 0644); err != nil {
		t.Fatalf("Failed to create test group file: %v", err)
	}

	scanner := &GroupScanner{groupPath: groupFile}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Logger: testLogger(),
	}

	_, err := scanner.Scan(context.Background(), opts)
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	results := writer.GetGroupResults()

	// Should have 7 groups
	if len(results) != 7 {
		t.Errorf("Expected 7 groups, got %d", len(results))
	}

	// Check root group
	root, ok := results["root"]
	if !ok {
		t.Fatalf("root group not found")
	}
	if root.GID != 0 {
		t.Errorf("Expected root GID=0, got %d", root.GID)
	}

	// Check ubuntu group
	ubuntu, ok := results["ubuntu"]
	if !ok {
		t.Fatalf("ubuntu group not found")
	}
	if ubuntu.GID != 1000 {
		t.Errorf("Expected ubuntu GID=1000, got %d", ubuntu.GID)
	}
}

func TestGroupScanner_Properties(t *testing.T) {
	scanner := &GroupScanner{}

	if scanner.Name() != "groups" {
		t.Errorf("Expected name 'groups', got '%s'", scanner.Name())
	}

	if scanner.IsDynamic() != false {
		t.Errorf("GroupScanner should not be dynamic")
	}
}

func TestGroupScanner_MalformedLines(t *testing.T) {
	tmpDir := t.TempDir()
	groupFile := filepath.Join(tmpDir, "group")

	// Create group file with some malformed lines
	groupContent := `root:x:0:
invalid_line
daemon:x:1:
:::
ubuntu:x:1000:
malformed:x:not_a_number:
`
	if err := os.WriteFile(groupFile, []byte(groupContent), 0644); err != nil {
		t.Fatalf("Failed to create test group file: %v", err)
	}

	scanner := &GroupScanner{groupPath: groupFile}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Logger: testLogger(),
	}

	_, err := scanner.Scan(context.Background(), opts)
	if err != nil {
		t.Fatalf("Scan should not fail on malformed lines: %v", err)
	}

	results := writer.GetGroupResults()

	// Should have 3 valid groups (malformed lines skipped)
	if len(results) != 3 {
		t.Errorf("Expected 3 valid groups, got %d", len(results))
	}
}
