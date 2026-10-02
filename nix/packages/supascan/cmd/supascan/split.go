package main

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"
)

var splitCmd = &cobra.Command{
	Use:   "split <baseline-file>",
	Short: "Split a baseline file into separate section files",
	Long: `Split a monolithic baseline.yml into separate section files for easier auditing.

This command reads the main baseline file and creates individual spec files
for each resource type (file, package, service, etc.).

For large sections like 'file', it further splits by path prefix into categories
like files-security.yml, files-postgres-config.yml, etc.

Examples:
  # Split baseline.yml in the same directory
  supascan split baseline.yml

  # Split to a specific output directory
  supascan split baseline.yml --output-dir /path/to/output
`,
	Args: cobra.ExactArgs(1),
	RunE: runSplit,
}

var splitOutputDir string

func init() {
	splitCmd.Flags().StringVar(&splitOutputDir, "output-dir", "", "Output directory (defaults to same as input file)")
	rootCmd.AddCommand(splitCmd)
}

func runSplit(cmd *cobra.Command, args []string) error {
	baselinePath := args[0]

	// Verify baseline file exists
	if _, err := os.Stat(baselinePath); os.IsNotExist(err) {
		return fmt.Errorf("baseline file not found: %s", baselinePath)
	}

	// Determine output directory
	outputDir := splitOutputDir
	if outputDir == "" {
		outputDir = filepath.Dir(baselinePath)
	}

	fmt.Println("============================================================")
	fmt.Println("Splitting baseline into section files")
	fmt.Println("============================================================")
	fmt.Println()
	fmt.Printf("Input file: %s\n", baselinePath)
	fmt.Printf("Output dir: %s\n", outputDir)
	fmt.Println()

	// Read baseline file
	data, err := os.ReadFile(baselinePath)
	if err != nil {
		return fmt.Errorf("failed to read baseline file: %w", err)
	}

	var baseline map[string]interface{}
	if err := yaml.Unmarshal(data, &baseline); err != nil {
		return fmt.Errorf("failed to parse baseline file: %w", err)
	}

	stats := make(map[string]int)

	// Process each section
	for section, content := range baseline {
		if content == nil {
			fmt.Printf("  Skipping empty section: %s\n", section)
			continue
		}

		contentMap, ok := content.(map[string]interface{})
		if !ok {
			fmt.Printf("  Skipping non-map section: %s\n", section)
			continue
		}

		if section == "file" {
			// Split files by category
			categories := categorizeFiles(contentMap)
			fmt.Printf("  Splitting 'file' section into %d categories:\n", len(categories))

			for category, files := range categories {
				outputFile := filepath.Join(outputDir, fmt.Sprintf("files-%s.yml", category))
				specData := map[string]interface{}{"file": files}

				if err := writeSpec(outputFile, category, "file", len(files), specData); err != nil {
					return err
				}
				fmt.Printf("    - files-%s.yml: %d items\n", category, len(files))
				stats[fmt.Sprintf("files-%s", category)] = len(files)
			}
		} else {
			// Write section to its own file
			outputFile := filepath.Join(outputDir, fmt.Sprintf("%s.yml", section))
			specData := map[string]interface{}{section: contentMap}

			if err := writeSpec(outputFile, section, section, len(contentMap), specData); err != nil {
				return err
			}
			fmt.Printf("  Created %s.yml: %d items\n", section, len(contentMap))
			stats[section] = len(contentMap)
		}
	}

	// Print summary
	fmt.Println()
	fmt.Println("============================================================")
	fmt.Println("Summary")
	fmt.Println("============================================================")

	var keys []string
	for k := range stats {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	total := 0
	for _, k := range keys {
		fmt.Printf("  %s: %d\n", k, stats[k])
		total += stats[k]
	}
	fmt.Printf("  TOTAL: %d\n", total)
	fmt.Println()
	fmt.Println("Done! Run validation on individual files:")
	fmt.Println("  supascan validate", outputDir)

	return nil
}

func categorizeFiles(files map[string]interface{}) map[string]map[string]interface{} {
	categories := make(map[string]map[string]interface{})

	for path, spec := range files {
		category := categorizeFilePath(path)
		if categories[category] == nil {
			categories[category] = make(map[string]interface{})
		}
		categories[category][path] = spec
	}

	return categories
}

func categorizeFilePath(path string) string {
	switch {
	case strings.HasPrefix(path, "/boot"):
		return "boot"
	case strings.HasPrefix(path, "/data"):
		return "data"
	case strings.HasPrefix(path, "/etc/postgresql"), strings.HasPrefix(path, "/etc/postgres"):
		return "postgres-config"
	case strings.HasPrefix(path, "/etc/ssl"):
		return "ssl"
	case strings.HasPrefix(path, "/etc/systemd"):
		return "systemd"
	case strings.HasPrefix(path, "/etc/nftables"), strings.HasPrefix(path, "/etc/fail2ban"):
		return "security"
	case strings.HasPrefix(path, "/etc"):
		return "etc"
	case strings.HasPrefix(path, "/home"):
		return "home"
	case strings.HasPrefix(path, "/nix"):
		return "nix"
	case strings.HasPrefix(path, "/opt"):
		return "opt"
	case strings.HasPrefix(path, "/usr/local"):
		return "usr-local"
	case strings.HasPrefix(path, "/usr"):
		return "usr"
	case strings.HasPrefix(path, "/var/lib/postgresql"):
		return "postgres-data"
	case strings.HasPrefix(path, "/var"):
		return "var"
	default:
		return "other"
	}
}

func writeSpec(outputFile, name, section string, count int, data map[string]interface{}) error {
	f, err := os.Create(outputFile)
	if err != nil {
		return fmt.Errorf("failed to create %s: %w", outputFile, err)
	}
	defer f.Close()

	// Write header comment
	fmt.Fprintf(f, "# %s baseline\n", strings.Title(name))
	fmt.Fprintf(f, "# Generated from baseline.yml - %d items\n", count)

	// Write YAML content
	encoder := yaml.NewEncoder(f)
	encoder.SetIndent(2)
	if err := encoder.Encode(data); err != nil {
		return fmt.Errorf("failed to write %s: %w", outputFile, err)
	}

	return nil
}
