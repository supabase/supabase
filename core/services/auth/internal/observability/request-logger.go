package observability

import (
	"context"
	"fmt"
	"net/http"
	"time"

	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/gofrs/uuid"
	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/utilities"
)

func AddRequestID(globalConfig *conf.GlobalConfiguration) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		fn := func(w http.ResponseWriter, r *http.Request) {
			id := uuid.Must(uuid.NewV4()).String()
			if globalConfig.API.RequestIDHeader != "" {
				id = r.Header.Get(globalConfig.API.RequestIDHeader)
			}
			ctx := r.Context()
			ctx = utilities.WithRequestID(ctx, id)
			next.ServeHTTP(w, r.WithContext(ctx))
		}
		return http.HandlerFunc(fn)
	}
}

func NewStructuredLogger(logger *logrus.Logger, config *conf.GlobalConfiguration) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/health" {
				next.ServeHTTP(w, r)
			} else {
				chimiddleware.RequestLogger(&structuredLogger{logger, config})(next).ServeHTTP(w, r)
			}
		})
	}
}

type structuredLogger struct {
	Logger *logrus.Logger
	Config *conf.GlobalConfiguration
}

func (l *structuredLogger) NewLogEntry(r *http.Request) chimiddleware.LogEntry {
	referrer := utilities.GetReferrer(r, l.Config)
	e := &logEntry{Entry: logrus.NewEntry(l.Logger)}
	logFields := logrus.Fields{
		"component":   "api",
		"method":      r.Method,
		"path":        r.URL.Path,
		"remote_addr": utilities.GetIPAddress(r),
		"referer":     referrer,
	}

	if r.URL.Path == "/token" {
		logFields["grant_type"] = r.FormValue("grant_type")
	}

	if reqID := utilities.GetRequestID(r.Context()); reqID != "" {
		logFields["request_id"] = reqID
	}

	e.Entry = e.Entry.WithFields(logFields)
	return e
}

// logEntry implements the chiMiddleware.LogEntry interface
type logEntry struct {
	Entry *logrus.Entry
}

// NewLogEntry returns a new chimiddleware.LogEntry from a *logrus.Entry.
func NewLogEntry(le *logrus.Entry) chimiddleware.LogEntry {
	return &logEntry{le}
}

func (e *logEntry) Write(status, bytes int, header http.Header, elapsed time.Duration, extra interface{}) {
	fields := logrus.Fields{
		"status":   status,
		"duration": elapsed.Nanoseconds(),
	}

	errorCode := header.Get("x-sb-error-code")
	if errorCode != "" {
		fields["error_code"] = errorCode
	}

	entry := e.Entry.WithFields(fields)
	entry.Log(LogLevelForHttp(status), "request completed")
	e.Entry = entry
}

func (e *logEntry) Panic(v interface{}, stack []byte) {
	entry := e.Entry.WithFields(logrus.Fields{
		"stack": string(stack),
		"panic": fmt.Sprintf("%+v", v),
	})
	entry.Error("request panicked")
	e.Entry = entry
}

func GetLogEntry(r *http.Request) *logEntry {
	l, _ := chimiddleware.GetLogEntry(r).(*logEntry)
	if l == nil {
		return &logEntry{Entry: logrus.NewEntry(logrus.StandardLogger())}
	}
	return l
}

func GetLogEntryFromContext(ctx context.Context) *logEntry {
	l, _ := ctx.Value(chimiddleware.LogEntryCtxKey).(*logEntry)
	if l == nil {
		return &logEntry{Entry: logrus.NewEntry(logrus.StandardLogger())}
	}
	return l
}

func SetLogEntryWithContext(
	ctx context.Context,
	entry chimiddleware.LogEntry,
) context.Context {
	return context.WithValue(ctx, chimiddleware.LogEntryCtxKey, entry)
}

func LogEntrySetField(r *http.Request, key string, value interface{}) {
	if l, ok := r.Context().Value(chimiddleware.LogEntryCtxKey).(*logEntry); ok {
		l.Entry = l.Entry.WithField(key, value)
	}
}

func LogEntrySetFields(r *http.Request, fields logrus.Fields) {
	if l, ok := r.Context().Value(chimiddleware.LogEntryCtxKey).(*logEntry); ok {
		l.Entry = l.Entry.WithFields(fields)
	}
}

func LogLevelForHttp(status int) logrus.Level {
	switch {
	case status >= http.StatusInternalServerError:
		return logrus.ErrorLevel
	case status >= http.StatusBadRequest:
		return logrus.WarnLevel
	default:
		return logrus.InfoLevel
	}
}
