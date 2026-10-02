package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"

	"github.com/supabase/supascan/internal/validator"
)

var (
	// validate flags
	gossPath        string
	validateFormat  string
	validateVerbose bool
)

var validateCmd = &cobra.Command{
	Use:   "validate <baselines-dir>",
	Short: "Validate the system against baseline specifications",
	Long: `Validate the system against multiple baseline specification files.

This command runs goss validation against each spec file in a baselines directory,
categorizing results as critical (must pass) or advisory (informational).

The validation will fail if any critical spec fails, but advisory failures
are reported without failing the overall validation.

Critical specs (must pass):
  - service.yml, user.yml, group.yml, mount.yml, package.yml
  - files-security.yml, files-ssl.yml
  - files-postgres-config.yml, files-postgres-data.yml

Advisory specs (informational):
  - kernel-param.yml, files-*.yml (non-critical paths)

Examples:
  # Validate using baselines directory
  supascan validate /path/to/baselines

  # Verbose output with documentation format
  supascan validate --verbose --format documentation /path/to/baselines

  # Use custom goss path
  supascan validate --goss /usr/local/bin/goss /path/to/baselines
`,
	Args: cobra.ExactArgs(1),
	RunE: runValidate,
}

func init() {
	validateCmd.Flags().StringVar(&gossPath, "goss", "goss", "Path to goss binary")
	validateCmd.Flags().StringVar(&validateFormat, "format", "tap", "Output format: tap, documentation, json")
	validateCmd.Flags().BoolVar(&validateVerbose, "verbose", false, "Show detailed output for each spec")

	rootCmd.AddCommand(validateCmd)
}

func runValidate(cmd *cobra.Command, args []string) error {
	baselinesDir := args[0]

	// Verify baselines directory exists
	if _, err := os.Stat(baselinesDir); os.IsNotExist(err) {
		return fmt.Errorf("baselines directory not found: %s", baselinesDir)
	}

	// Make path absolute
	absPath, err := filepath.Abs(baselinesDir)
	if err != nil {
		return fmt.Errorf("failed to get absolute path: %w", err)
	}

	// Create validator
	v := validator.New(validator.Options{
		BaselinesDir: absPath,
		GossPath:     gossPath,
		Format:       validateFormat,
		Verbose:      validateVerbose,
	})

	// Run validation
	result, err := v.Run()
	if err != nil {
		return err
	}

	// Print results
	v.PrintResults(result)

	// Return error if critical checks failed
	if result.CriticalFailed > 0 {
		return fmt.Errorf("validation failed: %d critical spec(s) failed", result.CriticalFailed)
	}

	return nil
}
