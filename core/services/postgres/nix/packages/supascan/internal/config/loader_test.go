package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoad_Defaults(t *testing.T) {
	cfg, err := Load("", CLIOptions{})
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	// Verify default path exclusions are present
	expectedPaths := []string{"/proc/*", "/sys/*", "/dev/*"}
	for _, path := range expectedPaths {
		found := false
		for _, excluded := range cfg.Paths {
			if excluded == path {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Expected default path exclusion %q not found", path)
		}
	}

	// Verify default kernel param exclusions are present
	expectedParams := []string{"fs.dentry-state", "kernel.random.uuid"}
	for _, param := range expectedParams {
		found := false
		for _, excluded := range cfg.KernelParams {
			if excluded == param {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Expected default kernel param exclusion %q not found", param)
		}
	}

	// Verify default disabled scanners are present
	expectedDisabled := []string{"port", "process"}
	for _, scanner := range expectedDisabled {
		found := false
		for _, disabled := range cfg.DisabledScanners {
			if disabled == scanner {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Expected default disabled scanner %q not found", scanner)
		}
	}
}

func TestLoad_ConfigFile(t *testing.T) {
	// Create a temporary config file
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "config.yaml")
	configContent := `
paths:
  - /custom/path/*
  - /another/path
kernelParams:
  - custom.param
disabledScanners:
  - custom_scanner
`
	if err := os.WriteFile(configPath, []byte(configContent), 0644); err != nil {
		t.Fatalf("Failed to create test config file: %v", err)
	}

	cfg, err := Load(configPath, CLIOptions{})
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	// Verify config file additions are present
	if !contains(cfg.Paths, "/custom/path/*") {
		t.Errorf("Expected custom path from config file not found")
	}
	if !contains(cfg.KernelParams, "custom.param") {
		t.Errorf("Expected custom kernel param from config file not found")
	}
	if !contains(cfg.DisabledScanners, "custom_scanner") {
		t.Errorf("Expected custom disabled scanner from config file not found")
	}

	// Verify defaults are still present
	if !contains(cfg.Paths, "/proc/*") {
		t.Errorf("Expected default path exclusion not found after loading config file")
	}
}

func TestLoad_CLIOverrides(t *testing.T) {
	// Create a temporary config file that disables ports and processes
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "config.yaml")
	configContent := `
disabledScanners:
  - port
  - process
`
	if err := os.WriteFile(configPath, []byte(configContent), 0644); err != nil {
		t.Fatalf("Failed to create test config file: %v", err)
	}

	// Test IncludePorts override
	cfg, err := Load(configPath, CLIOptions{IncludePorts: true})
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if contains(cfg.DisabledScanners, "port") {
		t.Errorf("port scanner should not be disabled when IncludePorts is true")
	}
	if !contains(cfg.DisabledScanners, "process") {
		t.Errorf("process scanner should still be disabled")
	}

	// Test IncludeProcesses override
	cfg, err = Load(configPath, CLIOptions{IncludeProcesses: true})
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if contains(cfg.DisabledScanners, "process") {
		t.Errorf("process scanner should not be disabled when IncludeProcesses is true")
	}
	if !contains(cfg.DisabledScanners, "port") {
		t.Errorf("port scanner should still be disabled")
	}

	// Test IncludeDynamic override
	configContent = `
kernelParams:
  - fs.dentry-state
  - kernel.random.uuid
`
	if err := os.WriteFile(configPath, []byte(configContent), 0644); err != nil {
		t.Fatalf("Failed to create test config file: %v", err)
	}

	cfg, err = Load(configPath, CLIOptions{IncludeDynamic: true})
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if contains(cfg.KernelParams, "fs.dentry-state") {
		t.Errorf("Dynamic kernel params should be excluded when IncludeDynamic is true")
	}
	if contains(cfg.KernelParams, "kernel.random.uuid") {
		t.Errorf("Dynamic kernel params should be excluded when IncludeDynamic is true")
	}
}

func TestLoad_ShallowDepthZero(t *testing.T) {
	// Test that ShallowDepthSet allows explicit 0 to be set
	cfg, err := Load("", CLIOptions{
		ShallowDepth:    0,
		ShallowDepthSet: true,
	})
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.ShallowDepth != 0 {
		t.Errorf("Expected ShallowDepth 0 when explicitly set, got %d", cfg.ShallowDepth)
	}
}

func TestLoad_ShallowDepthDefault(t *testing.T) {
	// Test that ShallowDepth defaults to 1 when not set
	cfg, err := Load("", CLIOptions{
		ShallowDepthSet: false,
	})
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.ShallowDepth != 1 {
		t.Errorf("Expected ShallowDepth 1 as default, got %d", cfg.ShallowDepth)
	}
}

func TestLoad_ShallowDepthFromCLI(t *testing.T) {
	// Test that CLI shallow depth overrides defaults
	cfg, err := Load("", CLIOptions{
		ShallowDepth:    3,
		ShallowDepthSet: true,
	})
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.ShallowDepth != 3 {
		t.Errorf("Expected ShallowDepth 3 from CLI, got %d", cfg.ShallowDepth)
	}
}

func TestLoad_ShallowDirs(t *testing.T) {
	// Test that CLI shallow dirs are added
	cfg, err := Load("", CLIOptions{
		ShallowDirs: []string{"/custom/shallow", "/another/shallow"},
	})
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if !contains(cfg.ShallowDirs, "/custom/shallow") {
		t.Errorf("Expected /custom/shallow in ShallowDirs")
	}
	if !contains(cfg.ShallowDirs, "/another/shallow") {
		t.Errorf("Expected /another/shallow in ShallowDirs")
	}
}

func TestIsPathExcluded_PycacheAndPyc(t *testing.T) {
	cfg := &Config{
		Paths: []string{
			"*/__pycache__/*",
			"*.pyc",
		},
	}

	// Should be excluded
	excluded := []string{
		"/opt/saltstack/salt/lib/python3.10/__pycache__/locks.cpython-310.pyc",
		"/usr/lib/python3/__pycache__/abc.cpython-310.pyc",
		"/home/user/project/__pycache__/module.pyc",
		"/some/path/file.pyc",
		"/another/deeply/nested/file.pyc",
	}

	for _, path := range excluded {
		if !cfg.IsPathExcluded(path) {
			t.Errorf("Expected %s to be excluded", path)
		}
	}

	// Should NOT be excluded
	notExcluded := []string{
		"/opt/saltstack/salt/lib/python3.10/locks.py",
		"/usr/lib/python3/abc.py",
		"/etc/passwd",
		"/home/user/project/module.py",
	}

	for _, path := range notExcluded {
		if cfg.IsPathExcluded(path) {
			t.Errorf("Expected %s to NOT be excluded", path)
		}
	}
}

func TestIsPathExcluded_CacheAndHistory(t *testing.T) {
	cfg := &Config{
		Paths: []string{
			"*/.cache/*",
			"*/.bash_history",
			"*/.ansible/*",
		},
	}

	// Should be excluded
	excluded := []string{
		"/home/ubuntu/.cache/nix/eval-cache-v6/something.sqlite",
		"/home/wal-g/.cache/nix/fetcher-cache-v4.sqlite",
		"/root/.cache/pip/something",
		"/home/ubuntu/.bash_history",
		"/root/.bash_history",
		"/home/ubuntu/.ansible/galaxy_cache/api.json",
	}

	for _, path := range excluded {
		if !cfg.IsPathExcluded(path) {
			t.Errorf("Expected %s to be excluded", path)
		}
	}

	// Should NOT be excluded
	notExcluded := []string{
		"/home/ubuntu/.bashrc",
		"/home/ubuntu/.profile",
		"/etc/passwd",
		"/home/ubuntu/cache/not-dotcache",
	}

	for _, path := range notExcluded {
		if cfg.IsPathExcluded(path) {
			t.Errorf("Expected %s to NOT be excluded", path)
		}
	}
}

// Helper function to check if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
