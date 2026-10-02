package scanners

import (
	"context"
	"strings"
	"testing"

	"github.com/supabase/supascan/internal/config"
	"github.com/supabase/supascan/internal/spec"
)

func TestKernelParamScanner_BasicScan(t *testing.T) {
	// Create a mock sysctl output
	mockOutput := `kernel.hostname = testhost
net.ipv4.ip_forward = 0
vm.swappiness = 60
fs.file-max = 9223372036854775807
kernel.random.uuid = 12345678-1234-1234-1234-123456789abc
`

	scanner := &KernelParamScanner{
		mockSysctlOutput: mockOutput,
	}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Config: &config.Config{
			KernelParams: []string{"kernel.random.uuid"}, // Exclude dynamic param
		},
		Logger: testLogger(),
	}

	_, err := scanner.Scan(context.Background(), opts)
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	results := writer.GetKernelParamResults()

	// Should have 4 params (excluding kernel.random.uuid)
	if len(results) != 4 {
		t.Errorf("Expected 4 kernel params, got %d", len(results))
	}

	// Check specific param
	ipForward, ok := results["net.ipv4.ip_forward"]
	if !ok {
		t.Fatalf("net.ipv4.ip_forward not found")
	}
	if ipForward.Value != "0" {
		t.Errorf("Expected value '0', got '%s'", ipForward.Value)
	}

	// Verify excluded param is not present
	if _, ok := results["kernel.random.uuid"]; ok {
		t.Errorf("kernel.random.uuid should be excluded")
	}
}

func TestKernelParamScanner_Properties(t *testing.T) {
	scanner := &KernelParamScanner{}

	if scanner.Name() != "kernel-params" {
		t.Errorf("Expected name 'kernel-params', got '%s'", scanner.Name())
	}

	if scanner.IsDynamic() != false {
		t.Errorf("KernelParamScanner should not be dynamic (with proper exclusions)")
	}
}

func TestKernelParamScanner_MultilineSkip(t *testing.T) {
	// Test that multiline continuation lines (with leading whitespace) are skipped
	mockOutput := `kernel.hostname = testhost
net.ipv4.ip_forward = 0
some.multiline.param = value
	continued on next line
vm.swappiness = 60
`

	scanner := &KernelParamScanner{
		mockSysctlOutput: mockOutput,
	}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Config: &config.Config{},
		Logger: testLogger(),
	}

	_, err := scanner.Scan(context.Background(), opts)
	if err != nil {
		t.Fatalf("Scan failed: %v", err)
	}

	results := writer.GetKernelParamResults()

	// Should have 4 params - the continuation line is skipped but the param with value is kept
	// kernel.hostname, net.ipv4.ip_forward, some.multiline.param (with first line of value), vm.swappiness
	if len(results) != 4 {
		t.Errorf("Expected 4 kernel params, got %d", len(results))
		for k := range results {
			t.Logf("Found param: %s", k)
		}
	}

	// Verify the continuation line is not included in the value
	multilineParam := results["some.multiline.param"]
	if strings.Contains(multilineParam.Value, "continued") {
		t.Errorf("Value should not contain continuation line, got: %q", multilineParam.Value)
	}
}

func TestKernelParamScanner_TabsToSpaces(t *testing.T) {
	// Test that tabs in values are converted to spaces
	mockOutput := "some.param = value\twith\ttabs"

	scanner := &KernelParamScanner{
		mockSysctlOutput: mockOutput,
	}
	writer := spec.NewTestWriter()

	opts := ScanOptions{
		Writer: writer,
		Config: &config.Config{},
		Logger: testLogger(),
	}

	scanner.Scan(context.Background(), opts)

	results := writer.GetKernelParamResults()
	param := results["some.param"]

	if strings.Contains(param.Value, "\t") {
		t.Errorf("Value should not contain tabs, got: %q", param.Value)
	}
	if !strings.Contains(param.Value, " ") {
		t.Errorf("Value should contain spaces (converted from tabs), got: %q", param.Value)
	}
}
