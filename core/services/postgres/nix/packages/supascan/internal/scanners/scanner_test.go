package scanners

import (
	"context"
	"io"
	"testing"

	"github.com/charmbracelet/log"
)

// mockStaticScanner implements Scanner for testing
type mockStaticScanner struct {
	name string
}

func (m *mockStaticScanner) Name() string {
	return m.name
}

func (m *mockStaticScanner) Scan(ctx context.Context, opts ScanOptions) (ScanStats, error) {
	return ScanStats{ScannersRun: 1}, nil
}

func (m *mockStaticScanner) IsDynamic() bool {
	return false
}

// mockDynamicScanner implements Scanner for testing
type mockDynamicScanner struct {
	name string
}

func (m *mockDynamicScanner) Name() string {
	return m.name
}

func (m *mockDynamicScanner) Scan(ctx context.Context, opts ScanOptions) (ScanStats, error) {
	return ScanStats{ScannersRun: 1}, nil
}

func (m *mockDynamicScanner) IsDynamic() bool {
	return true
}

// testLogger returns a silent logger for testing
func testLogger() *log.Logger {
	return log.NewWithOptions(io.Discard, log.Options{
		Level: log.DebugLevel,
	})
}

func TestRunAll_SkipsDynamic(t *testing.T) {
	// Save original registry and restore after test
	originalScanners := AllScanners
	defer func() { AllScanners = originalScanners }()

	// Setup test scanners
	AllScanners = []Scanner{
		&mockStaticScanner{name: "static1"},
		&mockDynamicScanner{name: "dynamic1"},
		&mockStaticScanner{name: "static2"},
	}

	writer := &mockWriter{}
	opts := ScanOptions{
		Writer:         writer,
		IncludeDynamic: false,
		Strict:         false,
		Logger:         testLogger(),
	}

	stats, err := RunAll(context.Background(), opts)
	if err != nil {
		t.Fatalf("RunAll() error = %v", err)
	}

	// Should only run 2 static scanners
	if stats.ScannersRun != 2 {
		t.Errorf("ScannersRun = %d, want 2", stats.ScannersRun)
	}
}

// mockWriter implements Writer for testing
type mockWriter struct{}

func (m *mockWriter) StartResource(resourceType string) error { return nil }
func (m *mockWriter) Add(spec interface{}) error              { return nil }
func (m *mockWriter) Flush() error                            { return nil }
func (m *mockWriter) Close() error                            { return nil }
func (m *mockWriter) WriteHeader(comment string) error        { return nil }
