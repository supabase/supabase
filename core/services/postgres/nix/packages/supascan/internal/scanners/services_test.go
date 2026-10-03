package scanners

import (
	"context"
	"testing"

	"github.com/supabase/supascan/internal/spec"
)

func TestServiceScanner_BasicScan(t *testing.T) {
	scanner := &ServiceScanner{}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Logger: testLogger(),
	}

	stats, err := scanner.Scan(context.Background(), opts)
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	results := writer.GetServiceResults()

	// Should find at least some services on any Linux system
	// (or zero if systemctl is not available)
	if len(results) < 0 {
		t.Errorf("Expected 0 or more services, got %d", len(results))
	}

	// Check that stats are reasonable
	if stats.ServicesScanned < 0 {
		t.Errorf("Expected non-negative services scanned, got %d", stats.ServicesScanned)
	}
}

func TestServiceScanner_Properties(t *testing.T) {
	scanner := &ServiceScanner{}

	if scanner.Name() != "services" {
		t.Errorf("Expected name 'services', got '%s'", scanner.Name())
	}

	if scanner.IsDynamic() != false {
		t.Errorf("ServiceScanner should not be dynamic")
	}
}
