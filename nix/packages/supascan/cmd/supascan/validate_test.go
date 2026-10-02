package main

import (
	"testing"

	"github.com/supabase/supascan/internal/validator"
)

func TestValidatorSpecLists(t *testing.T) {
	// Ensure critical specs include essential security-related specs
	criticalSpecs := validator.CriticalSpecs

	expectedCritical := map[string]bool{
		"service.yml":               true,
		"user.yml":                  true,
		"group.yml":                 true,
		"mount.yml":                 true,
		"package.yml":               true,
		"files-security.yml":        true,
		"files-ssl.yml":             true,
		"files-postgres-config.yml": true,
	}

	for spec := range expectedCritical {
		found := false
		for _, s := range criticalSpecs {
			if s == spec {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Expected critical spec %q not found in CriticalSpecs", spec)
		}
	}

	// Ensure advisory specs include non-critical file categories
	advisorySpecs := validator.AdvisorySpecs

	expectedAdvisory := map[string]bool{
		"kernel-param.yml": true,
		"files-etc.yml":    true,
		"files-usr.yml":    true,
		"files-var.yml":    true,
	}

	for spec := range expectedAdvisory {
		found := false
		for _, s := range advisorySpecs {
			if s == spec {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Expected advisory spec %q not found in AdvisorySpecs", spec)
		}
	}
}

func TestCriticalAndAdvisoryDoNotOverlap(t *testing.T) {
	criticalSet := make(map[string]bool)
	for _, spec := range validator.CriticalSpecs {
		criticalSet[spec] = true
	}

	for _, spec := range validator.AdvisorySpecs {
		if criticalSet[spec] {
			t.Errorf("Spec %q appears in both CriticalSpecs and AdvisorySpecs", spec)
		}
	}
}
