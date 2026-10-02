package observability

import (
	"os"
	"sync"
	"time"

	"github.com/bombsimon/logrusr/v3"
	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/pop/v6/logging"
	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/conf"
	"go.opentelemetry.io/otel"
)

const (
	LOG_SQL_ALL       = "all"
	LOG_SQL_NONE      = "none"
	LOG_SQL_STATEMENT = "statement"
)

var (
	loggingOnce sync.Once
)

type CustomFormatter struct {
	logrus.JSONFormatter
}

func NewCustomFormatter() *CustomFormatter {
	return &CustomFormatter{
		JSONFormatter: logrus.JSONFormatter{
			DisableTimestamp: false,
			TimestampFormat:  time.RFC3339,
		},
	}
}

func (f *CustomFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	// logrus doesn't support formatting the time in UTC so we need to use a custom formatter
	entry.Time = entry.Time.UTC()
	return f.JSONFormatter.Format(entry)
}

func ConfigureLogging(config *conf.LoggingConfig) error {
	var err error

	loggingOnce.Do(func() {
		formatter := NewCustomFormatter()
		logrus.SetFormatter(formatter)

		// use a file if you want
		if config.File != "" {
			f, errOpen := os.OpenFile(config.File, os.O_RDWR|os.O_APPEND|os.O_CREATE, 0660) //#nosec G302 -- Log files should be rw-rw-r--
			if errOpen != nil {
				err = errOpen
				return
			}
			logrus.SetOutput(f)
			logrus.Infof("Set output file to %s", config.File)
		}

		if config.Level != "" {
			level, errParse := logrus.ParseLevel(config.Level)
			if err != nil {
				err = errParse
				return
			}
			logrus.SetLevel(level)
			logrus.Debug("Set log level to: " + logrus.GetLevel().String())
		}

		f := logrus.Fields{}
		for k, v := range config.Fields {
			f[k] = v
		}
		logrus.WithFields(f)

		setPopLogger(config.SQL)

		otel.SetLogger(logrusr.New(logrus.StandardLogger().WithField("component", "otel")))
	})

	return err
}

func setPopLogger(sql string) {
	popLog := logrus.WithField("component", "pop")
	sqlLog := logrus.WithField("component", "sql")

	shouldLogSQL := sql == LOG_SQL_STATEMENT || sql == LOG_SQL_ALL
	shouldLogSQLArgs := sql == LOG_SQL_ALL

	pop.SetLogger(func(lvl logging.Level, s string, args ...interface{}) {
		// Special case SQL logging since we have 2 extra flags to check
		if lvl == logging.SQL {
			if !shouldLogSQL {
				return
			}

			if shouldLogSQLArgs && len(args) > 0 {
				sqlLog.WithField("args", args).Info(s)
			} else {
				sqlLog.Info(s)
			}
			return
		}

		l := popLog
		if len(args) > 0 {
			l = l.WithField("args", args)
		}

		switch lvl {
		case logging.SQL, logging.Debug:
			l.Debug(s)
		case logging.Info:
			l.Info(s)
		case logging.Warn:
			l.Warn(s)
		case logging.Error:
			l.Error(s)
		}
	})
}
