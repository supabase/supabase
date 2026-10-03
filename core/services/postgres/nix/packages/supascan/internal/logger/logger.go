package logger

import (
	"io"
	"os"

	"github.com/charmbracelet/log"
)

// Setup configures and returns a logger based on provided options
func Setup(verbose, debug bool, format string) *log.Logger {
	var output io.Writer = io.Discard
	var level log.Level = log.InfoLevel

	if debug {
		output = os.Stderr
		level = log.DebugLevel
	} else if verbose {
		output = os.Stderr
		level = log.InfoLevel
	}

	opts := log.Options{
		Level: level,
	}

	// Set format based on user preference
	switch format {
	case "json":
		opts.ReportTimestamp = true
	case "logfmt":
		opts.ReportTimestamp = true
	default:
		// Default text format
		opts.ReportTimestamp = false
	}

	logger := log.NewWithOptions(output, opts)

	// Configure formatter
	switch format {
	case "json":
		logger.SetFormatter(log.JSONFormatter)
	case "logfmt":
		logger.SetFormatter(log.LogfmtFormatter)
	}

	return logger
}
