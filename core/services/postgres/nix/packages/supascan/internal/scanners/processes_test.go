package scanners

import (
	"context"
	"testing"

	"github.com/supabase/supascan/internal/spec"
)

func TestProcessScanner_BasicScan(t *testing.T) {
	scanner := &ProcessScanner{}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Logger: testLogger(),
	}

	_, err := scanner.Scan(context.Background(), opts)
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	results := writer.GetProcessResults()

	// Should find at least 1 running process (the test itself)
	if len(results) < 1 {
		t.Errorf("Expected at least 1 process, got %d", len(results))
	}

	// All processes should be marked as running
	for procName, procSpec := range results {
		if procName == "" {
			t.Errorf("Process name should not be empty")
		}
		if !procSpec.Running {
			t.Errorf("All scanned processes should be running")
		}
	}
}

func TestProcessScanner_Properties(t *testing.T) {
	scanner := &ProcessScanner{}

	if scanner.Name() != "processes" {
		t.Errorf("Expected name 'processes', got '%s'", scanner.Name())
	}

	if scanner.IsDynamic() != true {
		t.Errorf("ProcessScanner MUST be dynamic (IsDynamic should return true)")
	}
}
