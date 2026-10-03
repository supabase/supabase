package observability

import (
	"context"
	"net"
	"time"

	"net/http"
	"net/http/pprof"

	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/conf"
)

func ConfigureProfiler(ctx context.Context, pc *conf.ProfilerConfig) error {
	if !pc.Enabled {
		return nil
	}
	addr := net.JoinHostPort(pc.Host, pc.Port)
	baseContext, cancel := context.WithCancel(context.Background()) // #nosec G118 -- cancel() is called in the shutdown goroutine below; baseContext is for the HTTP server.
	cleanupWaitGroup.Add(1)
	go func() {
		server := &http.Server{
			Addr:    addr,
			Handler: &ProfilerHandler{},
			BaseContext: func(net.Listener) context.Context {
				return baseContext
			},
			ReadHeaderTimeout: 2 * time.Second,
		}

		go func() {
			defer cleanupWaitGroup.Done()
			<-ctx.Done()

			cancel() // close baseContext

			shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer shutdownCancel()

			if err := server.Shutdown(shutdownCtx); err != nil {
				logrus.WithError(err).Errorf("profiler server (%s) failed to gracefully shut down", addr)
			}
		}()

		logrus.Infof("Profiler is listening on %s", addr)

		if err := server.ListenAndServe(); err != nil {
			logrus.WithError(err).Errorf("profiler server (%s) shut down", addr)
		} else {
			logrus.Info("profiler shut down")
		}
	}()

	return nil
}

type ProfilerHandler struct{}

func (p *ProfilerHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/debug/pprof/":
		pprof.Index(w, r)
	case "/debug/pprof/cmdline":
		pprof.Cmdline(w, r)
	case "/debug/pprof/profile":
		pprof.Profile(w, r)
	case "/debug/pprof/symbol":
		pprof.Symbol(w, r)
	case "/debug/pprof/trace":
		pprof.Trace(w, r)
	case "/debug/pprof/goroutine":
		pprof.Handler("goroutine").ServeHTTP(w, r)
	case "/debug/pprof/heap":
		pprof.Handler("heap").ServeHTTP(w, r)
	case "/debug/pprof/allocs":
		pprof.Handler("allocs").ServeHTTP(w, r)
	case "/debug/pprof/threadcreate":
		pprof.Handler("threadcreate").ServeHTTP(w, r)
	case "/debug/pprof/block":
		pprof.Handler("block").ServeHTTP(w, r)
	case "/debug/pprof/mutex":
		pprof.Handler("mutex").ServeHTTP(w, r)
	default:
		http.NotFound(w, r)
	}
}
