package logger

import (
	"io"
	"os"

	"github.com/charmbracelet/log"
)

func Setup(verbose, debug bool) *log.Logger {
	var output io.Writer = io.Discard
	var level log.Level = log.InfoLevel

	if debug {
		output = os.Stderr
		level = log.DebugLevel
	} else if verbose {
		output = os.Stderr
		level = log.InfoLevel
	}

	return log.NewWithOptions(output, log.Options{
		Level:           level,
		ReportTimestamp: debug,
	})
}
