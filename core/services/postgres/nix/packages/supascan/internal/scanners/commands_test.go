package scanners

import (
	"context"
	"testing"

	"github.com/supabase/supascan/internal/spec"
)

func TestCommandScanner_BasicScan(t *testing.T) {
	scanner := &CommandScanner{}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Logger: testLogger(),
	}

	_, err := scanner.Scan(context.Background(), opts)
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	results := writer.GetCommandResults()

	// CommandScanner is a no-op for now, should return 0 commands
	if len(results) != 0 {
		t.Errorf("Expected 0 commands (no-op implementation), got %d", len(results))
	}
}

func TestCommandScanner_Properties(t *testing.T) {
	scanner := &CommandScanner{}

	if scanner.Name() != "commands" {
		t.Errorf("Expected name 'commands', got '%s'", scanner.Name())
	}

	if scanner.IsDynamic() != false {
		t.Errorf("CommandScanner should not be dynamic")
	}
}
