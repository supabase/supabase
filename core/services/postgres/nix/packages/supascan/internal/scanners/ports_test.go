package scanners

import (
	"context"
	"testing"

	"github.com/supabase/supascan/internal/spec"
)

func TestPortScanner_BasicScan(t *testing.T) {
	scanner := &PortScanner{}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Logger: testLogger(),
	}

	_, err := scanner.Scan(context.Background(), opts)
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	results := writer.GetPortResults()

	// Should find 0 or more listening ports (depends on system state)
	if len(results) < 0 {
		t.Errorf("Expected 0 or more ports, got %d", len(results))
	}

	// If we found any ports, verify they have the correct format
	for portKey, portSpec := range results {
		if portKey == "" {
			t.Errorf("Port key should not be empty")
		}
		if !portSpec.Listening {
			t.Errorf("All scanned ports should be listening")
		}
	}
}

func TestPortScanner_Properties(t *testing.T) {
	scanner := &PortScanner{}

	if scanner.Name() != "ports" {
		t.Errorf("Expected name 'ports', got '%s'", scanner.Name())
	}

	if scanner.IsDynamic() != true {
		t.Errorf("PortScanner MUST be dynamic (IsDynamic should return true)")
	}
}
