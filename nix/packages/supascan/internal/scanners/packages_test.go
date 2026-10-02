package scanners

import (
	"strings"
	"testing"

	"github.com/supabase/supascan/internal/spec"
)

func TestPackageScanner_BasicScan(t *testing.T) {
	// Mock dpkg-query output
	mockOutput := `adduser	3.118ubuntu5	install ok installed
apt	2.4.8	install ok installed
base-files	12ubuntu4.2	install ok installed
bash	5.1-6ubuntu1	install ok installed
systemd	249.11-0ubuntu3.6	install ok installed
`

	scanner := &PackageScanner{}

	// Test the parsing function directly
	var packages map[string]spec.PackageSpec
	packages, err := scanner.parsePackages(strings.NewReader(mockOutput))
	if err != nil {
		t.Fatalf("parsePackages failed: %v", err)
	}

	if len(packages) != 5 {
		t.Errorf("Expected 5 packages, got %d", len(packages))
	}

	// Verify a specific package
	aptPkg, found := packages["apt"]
	if !found {
		t.Errorf("Expected to find 'apt' package")
	}
	if !aptPkg.Installed {
		t.Errorf("Expected 'apt' to be marked as installed")
	}
	if len(aptPkg.Versions) != 1 || aptPkg.Versions[0] != "2.4.8" {
		t.Errorf("Expected apt version 2.4.8, got %v", aptPkg.Versions)
	}
}

func TestPackageScanner_FilterByStatus(t *testing.T) {
	// Mock dpkg-query output with various statuses
	mockOutput := `installed-pkg	1.0	install ok installed
deinstalled-pkg	2.0	deinstall ok config-files
half-installed-pkg	3.0	install ok half-installed
`

	scanner := &PackageScanner{}

	packages, err := scanner.parsePackages(strings.NewReader(mockOutput))
	if err != nil {
		t.Fatalf("parsePackages failed: %v", err)
	}

	// Should only include "install ok installed" packages
	if len(packages) != 1 {
		t.Errorf("Expected 1 installed package, got %d", len(packages))
	}

	if _, found := packages["installed-pkg"]; !found {
		t.Errorf("Expected to find 'installed-pkg'")
	}
	if _, found := packages["deinstalled-pkg"]; found {
		t.Errorf("Should not include deinstalled packages")
	}
	if _, found := packages["half-installed-pkg"]; found {
		t.Errorf("Should not include half-installed packages")
	}
}

func TestPackageScanner_ScannerInterface(t *testing.T) {
	scanner := &PackageScanner{}

	if scanner.Name() != "packages" {
		t.Errorf("Expected Name() to return 'packages', got '%s'", scanner.Name())
	}

	if scanner.IsDynamic() {
		t.Errorf("Expected IsDynamic() to return false")
	}
}

func TestPackageScanner_EmptyOutput(t *testing.T) {
	scanner := &PackageScanner{}

	packages, err := scanner.parsePackages(strings.NewReader(""))
	if err != nil {
		t.Fatalf("parsePackages failed on empty input: %v", err)
	}

	if len(packages) != 0 {
		t.Errorf("Expected 0 packages from empty input, got %d", len(packages))
	}
}

func TestPackageScanner_MalformedLine(t *testing.T) {
	// Test with lines that don't have all three fields
	mockOutput := `good-pkg	1.0	install ok installed
bad-line-no-tabs
another-good-pkg	2.0	install ok installed
`

	scanner := &PackageScanner{}

	packages, err := scanner.parsePackages(strings.NewReader(mockOutput))
	if err != nil {
		t.Fatalf("parsePackages failed: %v", err)
	}

	// Should skip malformed lines but continue processing
	if len(packages) != 2 {
		t.Errorf("Expected 2 valid packages, got %d", len(packages))
	}
}
