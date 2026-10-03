package scanners

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/supabase/supascan/internal/spec"
)

func TestUserScanner_BasicScan(t *testing.T) {
	tmpDir := t.TempDir()
	passwdFile := filepath.Join(tmpDir, "passwd")

	// Create a test passwd file
	passwdContent := `root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
ubuntu:x:1000:1000:Ubuntu User:/home/ubuntu:/bin/bash
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
`
	if err := os.WriteFile(passwdFile, []byte(passwdContent), 0644); err != nil {
		t.Fatalf("Failed to create test passwd file: %v", err)
	}

	scanner := &UserScanner{passwdPath: passwdFile}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Logger: testLogger(),
	}

	stats, err := scanner.Scan(context.Background(), opts)
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	results := writer.GetUserResults()

	// Should have 4 users
	if len(results) != 4 {
		t.Errorf("Expected 4 users, got %d", len(results))
	}

	// Check root user
	root, ok := results["root"]
	if !ok {
		t.Fatalf("root user not found")
	}
	if root.UID != 0 {
		t.Errorf("Expected root UID=0, got %d", root.UID)
	}
	if root.Home != "/root" {
		t.Errorf("Expected root home=/root, got %s", root.Home)
	}
	if root.Shell != "/bin/bash" {
		t.Errorf("Expected root shell=/bin/bash, got %s", root.Shell)
	}

	// Check ubuntu user
	ubuntu, ok := results["ubuntu"]
	if !ok {
		t.Fatalf("ubuntu user not found")
	}
	if ubuntu.UID != 1000 {
		t.Errorf("Expected ubuntu UID=1000, got %d", ubuntu.UID)
	}

	// Check stats
	if stats.UsersScanned != 4 {
		t.Errorf("Expected 4 users scanned, got %d", stats.UsersScanned)
	}
}

func TestUserScanner_Properties(t *testing.T) {
	scanner := &UserScanner{}

	if scanner.Name() != "users" {
		t.Errorf("Expected name 'users', got '%s'", scanner.Name())
	}

	if scanner.IsDynamic() != false {
		t.Errorf("UserScanner should not be dynamic")
	}
}

func TestUserScanner_MalformedLines(t *testing.T) {
	tmpDir := t.TempDir()
	passwdFile := filepath.Join(tmpDir, "passwd")

	// Create passwd file with some malformed lines
	passwdContent := `root:x:0:0:root:/root:/bin/bash
invalid_line_here
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
:::::
ubuntu:x:1000:1000:Ubuntu:/home/ubuntu:/bin/bash
`
	if err := os.WriteFile(passwdFile, []byte(passwdContent), 0644); err != nil {
		t.Fatalf("Failed to create test passwd file: %v", err)
	}

	scanner := &UserScanner{passwdPath: passwdFile}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Logger: testLogger(),
	}

	_, err := scanner.Scan(context.Background(), opts)
	if err != nil {
		t.Fatalf("Scan should not fail on malformed lines: %v", err)
	}

	results := writer.GetUserResults()

	// Should have 3 valid users (malformed lines skipped)
	if len(results) != 3 {
		t.Errorf("Expected 3 valid users, got %d", len(results))
	}
}
