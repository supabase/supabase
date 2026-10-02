package validator

import (
	"testing"
)

func TestCriticalSpecsList(t *testing.T) {
	// Ensure critical specs list is not empty
	if len(CriticalSpecs) == 0 {
		t.Error("CriticalSpecs should not be empty")
	}

	// Check for expected critical specs
	expectedCritical := map[string]bool{
		"service.yml": true,
		"user.yml":    true,
		"group.yml":   true,
		"mount.yml":   true,
		"package.yml": true,
	}

	for _, spec := range CriticalSpecs {
		if expectedCritical[spec] {
			delete(expectedCritical, spec)
		}
	}

	for spec := range expectedCritical {
		t.Errorf("Expected critical spec %s not found in CriticalSpecs", spec)
	}
}

func TestAdvisorySpecsList(t *testing.T) {
	// Ensure advisory specs list is not empty
	if len(AdvisorySpecs) == 0 {
		t.Error("AdvisorySpecs should not be empty")
	}

	// Check for expected advisory specs
	expectedAdvisory := map[string]bool{
		"kernel-param.yml": true,
		"files-etc.yml":    true,
	}

	for _, spec := range AdvisorySpecs {
		if expectedAdvisory[spec] {
			delete(expectedAdvisory, spec)
		}
	}

	for spec := range expectedAdvisory {
		t.Errorf("Expected advisory spec %s not found in AdvisorySpecs", spec)
	}
}

func TestNewValidator(t *testing.T) {
	opts := Options{
		BaselinesDir: "/tmp/baselines",
		GossPath:     "goss",
		Format:       "tap",
		Verbose:      false,
	}

	v := New(opts)

	if v == nil {
		t.Error("New() should return a non-nil Validator")
	}

	if v.opts.BaselinesDir != "/tmp/baselines" {
		t.Errorf("Expected BaselinesDir '/tmp/baselines', got '%s'", v.opts.BaselinesDir)
	}

	if v.opts.Format != "tap" {
		t.Errorf("Expected Format 'tap', got '%s'", v.opts.Format)
	}
}

func TestResultCounts(t *testing.T) {
	result := &Result{
		CriticalPassed:  5,
		CriticalFailed:  1,
		CriticalSkipped: 2,
		AdvisoryPassed:  8,
		AdvisoryFailed:  3,
		AdvisorySkipped: 1,
		FailedCritical:  []string{"service.yml"},
	}

	totalCritical := result.CriticalPassed + result.CriticalFailed + result.CriticalSkipped
	if totalCritical != 8 {
		t.Errorf("Expected total critical 8, got %d", totalCritical)
	}

	totalAdvisory := result.AdvisoryPassed + result.AdvisoryFailed + result.AdvisorySkipped
	if totalAdvisory != 12 {
		t.Errorf("Expected total advisory 12, got %d", totalAdvisory)
	}

	if len(result.FailedCritical) != 1 {
		t.Errorf("Expected 1 failed critical, got %d", len(result.FailedCritical))
	}
}
