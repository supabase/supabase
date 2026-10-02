package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

// Config represents the complete configuration for the scanner, including exclusions
// and overrides. It supports a three-layer precedence model:
// 1. Hardcoded defaults (in defaults.go)
// 2. Config file (YAML)
// 3. CLI flags (highest precedence)
type Config struct {
	// Paths to exclude from scanning (glob patterns supported)
	Paths []string `yaml:"paths,omitempty"`

	// ShallowDirs are directories to scan with limited recursion depth
	// Files up to ShallowDepth levels deep are scanned, deeper subdirectories are skipped
	ShallowDirs []string `yaml:"shallowDirs,omitempty"`

	// ShallowDepth controls how many levels deep to scan in shallow directories
	// 1 = only files directly in the shallow dir (default)
	// 2 = files in shallow dir + immediate subdirectories
	// 3 = files in shallow dir + 2 levels of subdirectories, etc.
	ShallowDepth int `yaml:"shallowDepth,omitempty"`

	// Kernel parameters to exclude from scanning
	KernelParams []string `yaml:"kernelParams,omitempty"`

	// Scanner types to disable (e.g., "port", "process")
	DisabledScanners []string `yaml:"disabledScanners,omitempty"`

	// OverridePaths allows CLI to remove default path exclusions
	OverridePaths []string `yaml:"-"`

	// OverrideKernelParams allows CLI to remove default kernel param exclusions
	OverrideKernelParams []string `yaml:"-"`
}

// CLIOptions represents command-line flags that can override configuration.
// These flags take precedence over both defaults and config files.
type CLIOptions struct {
	// IncludeDynamic removes dynamic kernel params from exclusions
	IncludeDynamic bool

	// IncludePorts enables port scanning (removes "port" from DisabledScanners)
	IncludePorts bool

	// IncludeProcesses enables process scanning (removes "process" from DisabledScanners)
	IncludeProcesses bool

	// ShallowDirs adds directories to scan without recursion (from CLI)
	ShallowDirs []string

	// ShallowDepth controls recursion depth in shallow directories (from CLI)
	// Use -1 to indicate "not set" (will use default), 0+ for explicit depth
	ShallowDepth int

	// ShallowDepthSet indicates whether ShallowDepth was explicitly set via CLI
	ShallowDepthSet bool
}

// Load reads configuration from defaults, optional config file, and CLI options.
// Precedence: CLI flags > Config file > Hardcoded defaults
func Load(configPath string, opts CLIOptions) (*Config, error) {
	// Start with default exclusions
	cfg := DefaultExclusions

	// If a config file is specified, merge it with defaults
	if configPath != "" {
		fileCfg, err := loadFile(configPath)
		if err != nil {
			return nil, fmt.Errorf("failed to load config file: %w", err)
		}
		cfg = merge(cfg, fileCfg)
	}

	// Apply CLI overrides (highest precedence)
	if opts.IncludeDynamic {
		// Remove all dynamic/RAM-dependent kernel params from the exclusion list
		dynamicParams := []string{
			// Dynamic counters/statistics
			"fs.dentry-state",
			"fs.file-nr",
			"fs.inode-nr",
			"fs.inode-state",
			"fs.aio-nr",
			"kernel.random.uuid",
			"kernel.random.boot_id",
			"kernel.random.entropy_avail",
			"kernel.ns_last_pid",
			"kernel.pty.nr",
			"net.netfilter.*_conntrack_count",
			"net.netfilter.*_conntrack_max",
			// RAM-dependent parameters
			"fs.epoll.max_user_watches",
			"net.netfilter.nf_conntrack_buckets",
			"net.netfilter.nf_conntrack_expect_max",
		}
		cfg.KernelParams = removeItems(cfg.KernelParams, dynamicParams)
	}

	if opts.IncludePorts {
		cfg.DisabledScanners = removeItems(cfg.DisabledScanners, []string{"port"})
	}

	if opts.IncludeProcesses {
		cfg.DisabledScanners = removeItems(cfg.DisabledScanners, []string{"process"})
	}

	// Add CLI shallow dirs to config
	if len(opts.ShallowDirs) > 0 {
		cfg.ShallowDirs = append(cfg.ShallowDirs, opts.ShallowDirs...)
	}

	// Set shallow depth from CLI (overrides config file and defaults)
	// ShallowDepthSet allows explicit 0 to be distinguished from "not set"
	if opts.ShallowDepthSet {
		cfg.ShallowDepth = opts.ShallowDepth
	} else if cfg.ShallowDepth == 0 {
		// Default shallow depth to 1 only if not explicitly set
		cfg.ShallowDepth = 1
	}

	return &cfg, nil
}

// loadFile reads and parses a YAML configuration file.
func loadFile(path string) (Config, error) {
	var cfg Config

	data, err := os.ReadFile(path)
	if err != nil {
		return cfg, fmt.Errorf("failed to read config file: %w", err)
	}

	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return cfg, fmt.Errorf("failed to parse config file: %w", err)
	}

	return cfg, nil
}

// merge combines two configs, with the file config adding to (not replacing) the base.
func merge(base, file Config) Config {
	result := base

	// Append file exclusions to base exclusions (additive)
	result.Paths = append(result.Paths, file.Paths...)
	result.ShallowDirs = append(result.ShallowDirs, file.ShallowDirs...)
	result.KernelParams = append(result.KernelParams, file.KernelParams...)
	result.DisabledScanners = append(result.DisabledScanners, file.DisabledScanners...)

	// ShallowDepth from file overrides base if set
	if file.ShallowDepth > 0 {
		result.ShallowDepth = file.ShallowDepth
	}

	return result
}

// removeItems removes all occurrences of items from slice.
func removeItems(slice []string, itemsToRemove []string) []string {
	result := make([]string, 0, len(slice))
	removeMap := make(map[string]bool)
	for _, item := range itemsToRemove {
		removeMap[item] = true
	}

	for _, item := range slice {
		if !removeMap[item] {
			result = append(result, item)
		}
	}

	return result
}

// IsPathExcluded checks if a given path matches any exclusion pattern.
// Supports glob patterns (*, ?, []) and special patterns:
// - /dir/* matches anything under /dir/
// - */__pycache__/* matches __pycache__ directories anywhere
// - *.pyc matches any .pyc file
// - */.bash_history matches .bash_history file anywhere
func (c *Config) IsPathExcluded(path string) bool {
	for _, pattern := range c.Paths {
		// Handle patterns that match anywhere in the path (starting with *)
		if strings.HasPrefix(pattern, "*") {
			// Pattern like *.pyc - match file extension
			if strings.HasPrefix(pattern, "*.") {
				suffix := strings.TrimPrefix(pattern, "*")
				if strings.HasSuffix(path, suffix) {
					return true
				}
				continue
			}
			// Pattern like */__pycache__/* or */.cache/* - match directory component anywhere
			// Pattern like */.bash_history - match file anywhere
			if strings.HasPrefix(pattern, "*/") {
				// Get the part after */
				rest := strings.TrimPrefix(pattern, "*/")

				if strings.HasSuffix(pattern, "/*") {
					// Directory pattern: */.cache/* should match /.cache/ anywhere
					dirName := strings.TrimSuffix(rest, "/*")
					if strings.Contains(path, "/"+dirName+"/") {
						return true
					}
				} else {
					// File pattern: */.bash_history should match /.bash_history at end
					if strings.HasSuffix(path, "/"+rest) {
						return true
					}
				}
				continue
			}
		}

		matched, err := filepath.Match(pattern, path)
		if err != nil {
			// Invalid pattern, skip
			continue
		}
		if matched {
			return true
		}

		// Also check if path is under a directory pattern
		// e.g., /proc/* should match /proc/cpuinfo
		if strings.HasSuffix(pattern, "/*") {
			dir := strings.TrimSuffix(pattern, "/*")
			if strings.HasPrefix(path, dir+"/") {
				return true
			}
		}
	}
	return false
}

// IsKernelParamExcluded checks if a given kernel parameter matches any exclusion pattern.
// Supports glob patterns for wildcard matching.
func (c *Config) IsKernelParamExcluded(param string) bool {
	for _, pattern := range c.KernelParams {
		// Simple glob support for patterns like net.netfilter.*_conntrack_count
		if strings.Contains(pattern, "*") {
			matched, err := filepath.Match(pattern, param)
			if err != nil {
				continue
			}
			if matched {
				return true
			}
		} else {
			// Exact match
			if param == pattern {
				return true
			}
		}
	}
	return false
}

// IsScannerDisabled checks if a given scanner type is disabled in the configuration.
func (c *Config) IsScannerDisabled(scannerType string) bool {
	for _, disabled := range c.DisabledScanners {
		if disabled == scannerType {
			return true
		}
	}
	return false
}

// IsShallowDir checks if the given path is a shallow directory (should not recurse into).
// Returns true if path exactly matches a shallow dir or is a subdirectory of one.
func (c *Config) IsShallowDir(path string) bool {
	for _, shallow := range c.ShallowDirs {
		// Normalize paths (remove trailing slashes)
		shallow = strings.TrimSuffix(shallow, "/")
		path = strings.TrimSuffix(path, "/")

		// Check if this is exactly the shallow dir or a subdirectory
		if path == shallow || strings.HasPrefix(path, shallow+"/") {
			return true
		}
	}
	return false
}

// GetShallowDirDepth returns the depth of the shallow directory that contains this path.
// Returns -1 if path is not in any shallow directory.
// Depth 0 = the shallow dir itself, depth 1 = immediate child, etc.
func (c *Config) GetShallowDirDepth(path string) int {
	for _, shallow := range c.ShallowDirs {
		shallow = strings.TrimSuffix(shallow, "/")
		path = strings.TrimSuffix(path, "/")

		if path == shallow {
			return 0
		}
		if strings.HasPrefix(path, shallow+"/") {
			// Count the depth relative to shallow dir
			relPath := strings.TrimPrefix(path, shallow+"/")
			return strings.Count(relPath, "/") + 1
		}
	}
	return -1
}
