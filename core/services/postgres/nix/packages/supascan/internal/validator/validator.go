package validator

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// Spec categories
var (
	CriticalSpecs = []string{
		"service.yml",
		"user.yml",
		"group.yml",
		"mount.yml",
		"package.yml",
		"files-security.yml",
		"files-ssl.yml",
		"files-postgres-config.yml",
		"files-postgres-data.yml",
	}

	AdvisorySpecs = []string{
		"kernel-param.yml",
		"files-etc.yml",
		"files-systemd.yml",
		"files-boot.yml",
		"files-data.yml",
		"files-home.yml",
		"files-var.yml",
		"files-opt.yml",
		"files-usr.yml",
		"files-usr-local.yml",
		"files-nix.yml",
		"files-other.yml",
	}
)

// Options configures the validator
type Options struct {
	BaselinesDir string
	GossPath     string
	Format       string
	Verbose      bool
}

// Result holds the validation results
type Result struct {
	Specs           []SpecResult
	CriticalPassed  int
	CriticalFailed  int
	CriticalSkipped int
	AdvisoryPassed  int
	AdvisoryFailed  int
	AdvisorySkipped int
	FailedCritical  []string
}

// SpecResult holds the result for a single spec
type SpecResult struct {
	Spec     string
	Category string // "critical" or "advisory"
	Passed   bool
	Skipped  bool
	Output   string
	Error    error
}

// Validator runs baseline validations
type Validator struct {
	opts Options
}

// New creates a new Validator
func New(opts Options) *Validator {
	return &Validator{opts: opts}
}

// Run executes all validations and returns the results
func (v *Validator) Run() (*Result, error) {
	// Find goss binary
	gossPath, err := v.findGoss()
	if err != nil {
		return nil, fmt.Errorf("goss not found: %w", err)
	}

	result := &Result{}

	fmt.Println("============================================================")
	fmt.Println("CRITICAL CHECKS (must pass)")
	fmt.Println("============================================================")
	fmt.Println()

	// Run critical specs
	for _, spec := range CriticalSpecs {
		specResult := v.runSpec(spec, "critical", gossPath)
		result.Specs = append(result.Specs, specResult)
		v.printSpecResult(specResult)

		if specResult.Skipped {
			result.CriticalSkipped++
		} else if specResult.Passed {
			result.CriticalPassed++
		} else {
			result.CriticalFailed++
			result.FailedCritical = append(result.FailedCritical, specResult.Spec)
		}
	}

	fmt.Println()
	fmt.Println("============================================================")
	fmt.Println("ADVISORY CHECKS (informational)")
	fmt.Println("============================================================")
	fmt.Println()

	// Run advisory specs
	for _, spec := range AdvisorySpecs {
		specResult := v.runSpec(spec, "advisory", gossPath)
		result.Specs = append(result.Specs, specResult)
		v.printSpecResult(specResult)

		if specResult.Skipped {
			result.AdvisorySkipped++
		} else if specResult.Passed {
			result.AdvisoryPassed++
		} else {
			result.AdvisoryFailed++
		}
	}

	fmt.Println()

	return result, nil
}

// PrintResults prints the final summary
func (v *Validator) PrintResults(result *Result) {
	fmt.Println("============================================================")
	fmt.Println("SUMMARY")
	fmt.Println("============================================================")
	fmt.Println()
	fmt.Println("Critical checks:")
	fmt.Printf("  Passed:  %d\n", result.CriticalPassed)
	fmt.Printf("  Failed:  %d\n", result.CriticalFailed)
	fmt.Printf("  Skipped: %d\n", result.CriticalSkipped)
	fmt.Println()
	fmt.Println("Advisory checks:")
	fmt.Printf("  Passed:  %d\n", result.AdvisoryPassed)
	fmt.Printf("  Failed:  %d\n", result.AdvisoryFailed)
	fmt.Printf("  Skipped: %d\n", result.AdvisorySkipped)
	fmt.Println()

	if result.CriticalFailed > 0 {
		fmt.Println("✗ Baseline validation FAILED")
		fmt.Println()
		fmt.Println("  Failed critical specs:")
		for _, spec := range result.FailedCritical {
			fmt.Printf("    - %s\n", spec)
		}
		fmt.Println()
		fmt.Println("  The machine configuration has drifted from the baseline.")
		fmt.Println("  Review the failures above and either:")
		fmt.Println("    1. Fix the configuration to match the baseline, OR")
		fmt.Println("    2. Update the baseline if the change is intentional:")
		fmt.Println("       supascan genspec <output-dir>")
		fmt.Println()
	} else {
		fmt.Println("✓ Baseline validation PASSED")
		fmt.Println("  All critical checks passed.")
		if result.AdvisoryFailed > 0 {
			fmt.Printf("  Note: %d advisory check(s) failed - review recommended.\n", result.AdvisoryFailed)
		}
		fmt.Println()
	}
}

func (v *Validator) findGoss() (string, error) {
	// Check if gossPath is absolute or in PATH
	if filepath.IsAbs(v.opts.GossPath) {
		if _, err := os.Stat(v.opts.GossPath); err == nil {
			return v.opts.GossPath, nil
		}
		return "", fmt.Errorf("goss not found at %s", v.opts.GossPath)
	}

	// Look in PATH
	path, err := exec.LookPath(v.opts.GossPath)
	if err == nil {
		return path, nil
	}

	// Common locations
	commonPaths := []string{
		"/usr/local/bin/goss",
		"/usr/bin/goss",
		"/nix/var/nix/profiles/default/bin/goss",
	}
	for _, p := range commonPaths {
		if _, err := os.Stat(p); err == nil {
			return p, nil
		}
	}

	return "", fmt.Errorf("goss not found in PATH or common locations")
}

func (v *Validator) runSpec(specFile, category, gossPath string) SpecResult {
	specPath := filepath.Join(v.opts.BaselinesDir, specFile)
	specName := strings.TrimSuffix(specFile, ".yml")

	result := SpecResult{
		Spec:     specName,
		Category: category,
	}

	// Check if spec file exists
	if _, err := os.Stat(specPath); os.IsNotExist(err) {
		result.Skipped = true
		return result
	}

	// Build goss command
	// Use sudo since many checks require root access
	args := []string{gossPath, "--gossfile", specPath, "validate", "--format", v.opts.Format}
	cmd := exec.Command("sudo", args...)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	result.Output = stdout.String() + stderr.String()

	if err != nil {
		result.Passed = false
		result.Error = err
	} else {
		result.Passed = true
	}

	return result
}

func (v *Validator) printSpecResult(r SpecResult) {
	if r.Skipped {
		fmt.Printf("  ⊘ %s: skipped (file not found)\n", r.Spec)
		return
	}

	if r.Passed {
		fmt.Printf("  ✓ %s: passed\n", r.Spec)
	} else {
		fmt.Printf("  ✗ %s: FAILED\n", r.Spec)
	}

	// Show output if verbose or if failed
	if v.opts.Verbose || !r.Passed {
		if r.Output != "" {
			lines := strings.Split(strings.TrimSpace(r.Output), "\n")
			// Show last few lines for failures (summary)
			if !r.Passed && len(lines) > 10 && !v.opts.Verbose {
				lines = lines[len(lines)-10:]
				fmt.Println("    ... (showing last 10 lines)")
			}
			for _, line := range lines {
				fmt.Printf("    %s\n", line)
			}
		}
	}
}
