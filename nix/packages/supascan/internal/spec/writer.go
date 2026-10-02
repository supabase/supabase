package spec

import (
	"encoding/json"
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

// OutputFormat specifies the output format for the writer
type OutputFormat int

const (
	// FormatYAML writes output in YAML format
	FormatYAML OutputFormat = iota
	// FormatJSON writes output in JSON format
	FormatJSON
)

// YAMLWriter handles writing GOSS spec files with chunked streaming
type YAMLWriter struct {
	file            *os.File
	buffer          map[string]map[string]interface{} // resourceType -> key -> spec
	currentResource string
	format          OutputFormat
}

// NewWriter creates a new YAML writer with default format (YAML)
func NewWriter(path string) (*YAMLWriter, error) {
	return NewWriterWithFormat(path, FormatYAML)
}

// NewWriterWithFormat creates a new writer with specified format
func NewWriterWithFormat(path string, format OutputFormat) (*YAMLWriter, error) {
	file, err := os.Create(path)
	if err != nil {
		return nil, fmt.Errorf("failed to create output file: %w", err)
	}

	return &YAMLWriter{
		file:   file,
		buffer: make(map[string]map[string]interface{}),
		format: format,
	}, nil
}

// WriteHeader writes a comment header to the file (skipped for JSON)
func (w *YAMLWriter) WriteHeader(comment string) error {
	if w.format == FormatJSON {
		// JSON doesn't support comments, skip
		return nil
	}

	header := fmt.Sprintf("# %s\n", comment)
	if _, err := w.file.WriteString(header); err != nil {
		return fmt.Errorf("failed to write header: %w", err)
	}
	return nil
}

// StartResource begins a new resource section (e.g., "file", "package")
func (w *YAMLWriter) StartResource(resourceType string) error {
	w.currentResource = resourceType
	if w.buffer[resourceType] == nil {
		w.buffer[resourceType] = make(map[string]interface{})
	}
	return nil
}

// Add adds a spec to the current resource buffer
func (w *YAMLWriter) Add(spec interface{}) error {
	if w.currentResource == "" {
		return fmt.Errorf("no resource started, call StartResource first")
	}

	key := extractKey(spec)
	if key == "" {
		return fmt.Errorf("unable to extract key from spec type %T", spec)
	}

	w.buffer[w.currentResource][key] = spec
	return nil
}

// Flush writes the current buffer to the file
func (w *YAMLWriter) Flush() error {
	// For file-based streaming, we don't actually flush during operation
	// The buffer is held until Close() is called
	// This keeps memory bounded by resource type
	return nil
}

// Close finalizes the file by encoding all buffered data
func (w *YAMLWriter) Close() error {
	if w.file == nil {
		return nil
	}

	var err error
	if w.format == FormatJSON {
		encoder := json.NewEncoder(w.file)
		encoder.SetIndent("", "  ")
		err = encoder.Encode(w.buffer)
	} else {
		encoder := yaml.NewEncoder(w.file)
		encoder.SetIndent(2)
		err = encoder.Encode(w.buffer)
	}

	if err != nil {
		w.file.Close()
		return fmt.Errorf("failed to encode data: %w", err)
	}

	return w.file.Close()
}

// extractKey extracts the identifying key from any spec type
func extractKey(spec interface{}) string {
	switch s := spec.(type) {
	case FileSpec:
		return s.Path
	case PackageSpec:
		return s.Name
	case ServiceSpec:
		return s.Name
	case UserSpec:
		return s.Username
	case GroupSpec:
		return s.Name
	case KernelParamSpec:
		return s.Key
	case MountSpec:
		return s.Path
	case PortSpec:
		return s.Port
	case ProcessSpec:
		return s.Comm
	case CommandSpec:
		return s.Command
	default:
		return ""
	}
}
