package scanners

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/supabase/supascan/internal/config"
	"github.com/supabase/supascan/internal/spec"
)

func TestFileScanner_BasicScan(t *testing.T) {
	tmpDir := t.TempDir()

	// Create test files with known permissions
	os.WriteFile(filepath.Join(tmpDir, "file1.txt"), []byte("data"), 0644)
	os.WriteFile(filepath.Join(tmpDir, "file2.sh"), []byte("script"), 0755)

	subdir := filepath.Join(tmpDir, "subdir")
	os.Mkdir(subdir, 0755)
	os.WriteFile(filepath.Join(subdir, "file3"), []byte("test"), 0600)

	scanner := &FileScanner{rootPath: tmpDir}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Config: &config.Config{
			Paths: []string{}, // No exclusions
		},
		Logger: testLogger(),
	}

	_, err := scanner.Scan(context.Background(), opts)
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	results := writer.GetFileResults()
	if len(results) != 3 {
		t.Errorf("Expected 3 files, got %d", len(results))
	}

	// Verify file2.sh has correct mode
	for _, r := range results {
		if filepath.Base(r.Path) == "file2.sh" {
			if r.Mode != "0755" {
				t.Errorf("Expected mode 0755, got %s", r.Mode)
			}
		}
	}
}

func TestFileScanner_Exclusions(t *testing.T) {
	tmpDir := t.TempDir()

	proc := filepath.Join(tmpDir, "proc")
	etc := filepath.Join(tmpDir, "etc")
	os.Mkdir(proc, 0755)
	os.Mkdir(etc, 0755)

	os.WriteFile(filepath.Join(proc, "cpuinfo"), []byte("test"), 0644)
	os.WriteFile(filepath.Join(etc, "passwd"), []byte("test"), 0644)

	scanner := &FileScanner{rootPath: tmpDir}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Config: &config.Config{
			Paths: []string{filepath.Join(tmpDir, "proc") + "/*"},
		},
		Logger: testLogger(),
	}

	scanner.Scan(context.Background(), opts)

	results := writer.GetFileResults()

	// Should only have /etc/passwd, not /proc/cpuinfo
	if len(results) != 1 {
		t.Errorf("Expected 1 file (excluded proc), got %d", len(results))
	}
}

func TestFileScanner_ShallowDirsDepthZero(t *testing.T) {
	tmpDir := t.TempDir()

	// Create a shallow dir with files inside
	shallowDir := filepath.Join(tmpDir, "nix-store")
	os.Mkdir(shallowDir, 0755)
	os.WriteFile(filepath.Join(shallowDir, "file1.txt"), []byte("data"), 0644)
	os.WriteFile(filepath.Join(shallowDir, "file2.txt"), []byte("data"), 0644)

	// Create a subdir inside shallow dir
	subdir := filepath.Join(shallowDir, "subdir")
	os.Mkdir(subdir, 0755)
	os.WriteFile(filepath.Join(subdir, "nested.txt"), []byte("data"), 0644)

	// Create a normal dir that should be scanned
	normalDir := filepath.Join(tmpDir, "etc")
	os.Mkdir(normalDir, 0755)
	os.WriteFile(filepath.Join(normalDir, "passwd"), []byte("data"), 0644)

	scanner := &FileScanner{rootPath: tmpDir}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Config: &config.Config{
			ShallowDirs:  []string{shallowDir},
			ShallowDepth: 0, // Don't scan ANY files inside shallow dirs
		},
		Logger: testLogger(),
	}

	scanner.Scan(context.Background(), opts)

	results := writer.GetFileResults()

	// With depth 0, we should only get:
	// - /etc/passwd (normal dir)
	// - the shallow dir itself (as directory entry)
	// Files inside shallow dir should be skipped

	hasPasswd := false
	hasShallowDirFiles := false
	for _, r := range results {
		if filepath.Base(r.Path) == "passwd" {
			hasPasswd = true
		}
		if filepath.Base(r.Path) == "file1.txt" || filepath.Base(r.Path) == "file2.txt" || filepath.Base(r.Path) == "nested.txt" {
			hasShallowDirFiles = true
		}
	}

	if !hasPasswd {
		t.Errorf("Expected /etc/passwd to be scanned")
	}
	if hasShallowDirFiles {
		t.Errorf("Files inside shallow dir should be skipped with depth 0")
	}
}

func TestFileScanner_ShallowDirsDepthOne(t *testing.T) {
	tmpDir := t.TempDir()

	// Create a shallow dir with files inside
	shallowDir := filepath.Join(tmpDir, "nix-store")
	os.Mkdir(shallowDir, 0755)
	os.WriteFile(filepath.Join(shallowDir, "file1.txt"), []byte("data"), 0644)

	// Create a subdir inside shallow dir
	subdir := filepath.Join(shallowDir, "subdir")
	os.Mkdir(subdir, 0755)
	os.WriteFile(filepath.Join(subdir, "nested.txt"), []byte("data"), 0644)

	scanner := &FileScanner{rootPath: tmpDir}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Config: &config.Config{
			ShallowDirs:  []string{shallowDir},
			ShallowDepth: 1, // Scan top-level files only
		},
		Logger: testLogger(),
	}

	scanner.Scan(context.Background(), opts)

	results := writer.GetFileResults()

	// With depth 1, we should get:
	// - file1.txt (direct child of shallow dir)
	// But NOT nested.txt (inside subdir)

	hasFile1 := false
	hasNested := false
	for _, r := range results {
		if filepath.Base(r.Path) == "file1.txt" {
			hasFile1 = true
		}
		if filepath.Base(r.Path) == "nested.txt" {
			hasNested = true
		}
	}

	if !hasFile1 {
		t.Errorf("Expected file1.txt (direct child) to be scanned with depth 1")
	}
	if hasNested {
		t.Errorf("nested.txt should be skipped with depth 1")
	}
}
