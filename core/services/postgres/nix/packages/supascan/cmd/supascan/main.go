package main

import (
	"os"

	"github.com/spf13/cobra"
)

var (
	version = "dev" // Set by ldflags during build
)

var rootCmd = &cobra.Command{
	Use:   "supascan",
	Short: "Supabase system scanner and validator",
	Long: `supascan - Supabase System Scanner and Validator

A comprehensive tool for generating and validating system baseline specifications.
Used to ensure infrastructure consistency and detect configuration drift.

Commands:
  genspec   Generate a baseline specification from the current system
  validate  Validate the system against baseline specifications
  split     Split a baseline file into separate section files

Examples:
  # Generate a baseline spec
  supascan genspec baseline.yml

  # Validate system against baseline specs
  supascan validate /path/to/baselines

  # Split a baseline into sections
  supascan split baseline.yml

  # Generate with verbose output
  supascan genspec --verbose --format yaml baseline.yml
`,
	Version: version,
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
