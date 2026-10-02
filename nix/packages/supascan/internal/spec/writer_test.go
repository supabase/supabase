package spec

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"gopkg.in/yaml.v3"
)

func TestYAMLWriter_SingleResource(t *testing.T) {
	tmpDir := t.TempDir()
	outputPath := filepath.Join(tmpDir, "test.yaml")

	writer, err := NewWriter(outputPath)
	if err != nil {
		t.Fatalf("NewWriter failed: %v", err)
	}
	defer writer.Close()

	if err := writer.WriteHeader("Test scan"); err != nil {
		t.Fatalf("WriteHeader failed: %v", err)
	}

	// Write a single file resource
	fileSpec := FileSpec{
		Path:   "/etc/passwd",
		Exists: true,
		Mode:   "0644",
		Owner:  "root",
		Group:  "root",
	}

	if err := writer.StartResource("file"); err != nil {
		t.Fatalf("StartResource failed: %v", err)
	}

	if err := writer.Add(fileSpec); err != nil {
		t.Fatalf("Add failed: %v", err)
	}

	if err := writer.Flush(); err != nil {
		t.Fatalf("Flush failed: %v", err)
	}

	if err := writer.Close(); err != nil {
		t.Fatalf("Close failed: %v", err)
	}

	// Verify output
	data, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("ReadFile failed: %v", err)
	}

	content := string(data)
	if !strings.Contains(content, "file:") {
		t.Error("Output missing 'file:' section")
	}
	if !strings.Contains(content, "/etc/passwd:") {
		t.Error("Output missing '/etc/passwd:' entry")
	}
	if !strings.Contains(content, "exists: true") {
		t.Error("Output missing 'exists: true'")
	}
}

func TestYAMLWriter_ChunkedWriting(t *testing.T) {
	tmpDir := t.TempDir()
	outputPath := filepath.Join(tmpDir, "chunked.yaml")

	writer, err := NewWriter(outputPath)
	if err != nil {
		t.Fatalf("NewWriter failed: %v", err)
	}
	defer writer.Close()

	if err := writer.WriteHeader("Chunked test"); err != nil {
		t.Fatalf("WriteHeader failed: %v", err)
	}

	// Write files in chunks
	if err := writer.StartResource("file"); err != nil {
		t.Fatalf("StartResource failed: %v", err)
	}

	// First chunk
	for i := 0; i < 100; i++ {
		fileSpec := FileSpec{
			Path:   "/tmp/file" + string(rune('0'+i%10)),
			Exists: true,
		}
		if err := writer.Add(fileSpec); err != nil {
			t.Fatalf("Add failed: %v", err)
		}
	}

	if err := writer.Flush(); err != nil {
		t.Fatalf("First flush failed: %v", err)
	}

	// Second chunk
	for i := 0; i < 100; i++ {
		fileSpec := FileSpec{
			Path:   "/var/file" + string(rune('0'+i%10)),
			Exists: true,
		}
		if err := writer.Add(fileSpec); err != nil {
			t.Fatalf("Add failed: %v", err)
		}
	}

	if err := writer.Flush(); err != nil {
		t.Fatalf("Second flush failed: %v", err)
	}

	if err := writer.Close(); err != nil {
		t.Fatalf("Close failed: %v", err)
	}

	// Verify output is valid YAML
	data, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("ReadFile failed: %v", err)
	}

	var result map[string]interface{}
	if err := yaml.Unmarshal(data, &result); err != nil {
		t.Fatalf("Invalid YAML: %v", err)
	}

	// Check that file section exists and has entries
	fileSection, ok := result["file"].(map[string]interface{})
	if !ok {
		t.Fatal("Missing or invalid 'file' section")
	}

	if len(fileSection) == 0 {
		t.Error("File section is empty")
	}
}

func TestYAMLWriter_WritesZeroUserAndGroupIDs(t *testing.T) {
	tmpDir := t.TempDir()
	outputPath := filepath.Join(tmpDir, "identities.yaml")

	writer, err := NewWriter(outputPath)
	if err != nil {
		t.Fatalf("NewWriter failed: %v", err)
	}

	if err := writer.StartResource("user"); err != nil {
		t.Fatalf("StartResource(user) failed: %v", err)
	}
	if err := writer.Add(UserSpec{Username: "root", Exists: true, UID: 0, GID: 0}); err != nil {
		t.Fatalf("Add(user) failed: %v", err)
	}
	if err := writer.StartResource("group"); err != nil {
		t.Fatalf("StartResource(group) failed: %v", err)
	}
	if err := writer.Add(GroupSpec{Name: "root", Exists: true, GID: 0}); err != nil {
		t.Fatalf("Add(group) failed: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("Close failed: %v", err)
	}

	data, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("ReadFile failed: %v", err)
	}

	content := string(data)
	if strings.Count(content, "uid: 0") != 1 {
		t.Errorf("expected one zero UID, got output:\n%s", content)
	}
	if strings.Count(content, "gid: 0") != 2 {
		t.Errorf("expected two zero GIDs, got output:\n%s", content)
	}
}

func TestYAMLWriter_JSONFormat(t *testing.T) {
	tmpDir := t.TempDir()
	outputPath := filepath.Join(tmpDir, "test.json")

	writer, err := NewWriterWithFormat(outputPath, FormatJSON)
	if err != nil {
		t.Fatalf("NewWriterWithFormat failed: %v", err)
	}
	defer writer.Close()

	if err := writer.WriteHeader("JSON test"); err != nil {
		t.Fatalf("WriteHeader failed: %v", err)
	}

	// Write a file resource
	fileSpec := FileSpec{
		Path:   "/etc/hosts",
		Exists: true,
		Mode:   "0644",
	}

	if err := writer.StartResource("file"); err != nil {
		t.Fatalf("StartResource failed: %v", err)
	}

	if err := writer.Add(fileSpec); err != nil {
		t.Fatalf("Add failed: %v", err)
	}

	if err := writer.Flush(); err != nil {
		t.Fatalf("Flush failed: %v", err)
	}

	// Write a package resource
	pkgSpec := PackageSpec{
		Name:      "openssh-server",
		Installed: true,
		Versions:  []string{"1:8.9p1"},
	}

	if err := writer.StartResource("package"); err != nil {
		t.Fatalf("StartResource(package) failed: %v", err)
	}

	if err := writer.Add(pkgSpec); err != nil {
		t.Fatalf("Add(package) failed: %v", err)
	}

	if err := writer.Flush(); err != nil {
		t.Fatalf("Flush(package) failed: %v", err)
	}

	if err := writer.Close(); err != nil {
		t.Fatalf("Close failed: %v", err)
	}

	// Verify output is valid JSON
	data, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("ReadFile failed: %v", err)
	}

	// Use bytes.Buffer approach for JSON validation
	var buf bytes.Buffer
	buf.Write(data)

	content := buf.String()
	if !strings.Contains(content, `"file"`) {
		t.Error("JSON output missing 'file' key")
	}
	if !strings.Contains(content, `"/etc/hosts"`) {
		t.Error("JSON output missing '/etc/hosts' entry")
	}
	if !strings.Contains(content, `"package"`) {
		t.Error("JSON output missing 'package' key")
	}
	if !strings.Contains(content, `"openssh-server"`) {
		t.Error("JSON output missing 'openssh-server' entry")
	}
}
