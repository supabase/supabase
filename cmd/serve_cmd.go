package cmd

import (
	"context"
	"net"
	"net/http"
	"sync"
	"syscall"
	"time"

	"golang.org/x/sys/unix"

	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/supabase/auth/internal/api"
	"github.com/supabase/auth/internal/api/apilimiter"
	"github.com/supabase/auth/internal/api/apiworker"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/mailer/templatemailer"
	"github.com/supabase/auth/internal/reloader"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/utilities"
)

var serveCmd = cobra.Command{
	Use:  "serve",
	Long: "Start API server",
	Run: func(cmd *cobra.Command, args []string) {
		serve(cmd.Context())
	},
}

func serve(ctx context.Context) {
	configLoader := confload.NewLoader()

	config, err := configLoader.Startup(configFile, watchDir)
	if err != nil {
		logrus.WithError(err).Fatal("unable to load config")
	}

	// Include serve ctx which carries cancelation signals so DialContext does
	// not hang indefinitely at startup.
	db, err := storage.DialContext(ctx, config)
	if err != nil {
		logrus.Fatalf("error opening database: %+v", err)
	}
	defer db.Close()

	baseCtx, baseCancel := context.WithCancel(context.Background())
	defer baseCancel()

	// Add the base context to the db, this is so during the shutdown sequence
	// the DB will be available while connections drain.
	db = db.WithContext(ctx)

	var wg sync.WaitGroup
	defer wg.Wait() // Do not return to caller until this goroutine is done.

	mrCache := templatemailer.NewCache()
	initialLim := apilimiter.New(config)
	initialAPI := api.NewAPIWithVersion(
		config, db, utilities.Version,
		api.WithLimiter(initialLim),
		api.WithMailer(templatemailer.FromConfig(config, mrCache)),
	)

	addr := net.JoinHostPort(config.API.Host, config.API.Port)
	logrus.WithField("version", initialAPI.Version()).Infof("GoTrue API started on: %s", addr)

	ah := reloader.NewAtomicHandler(initialAPI)
	httpSrv := &http.Server{
		Addr:              addr,
		Handler:           ah,
		ReadHeaderTimeout: 2 * time.Second, // to mitigate a Slowloris attack
		BaseContext: func(net.Listener) context.Context {
			return baseCtx
		},
	}
	log := logrus.WithField("component", "api")

	wrkLog := logrus.WithField("component", "apiworker")
	wrk := apiworker.New(config, mrCache, db, wrkLog)
	wg.Add(1)
	go func() {
		defer wg.Done()

		var err error
		defer func() {
			exitFn := wrkLog.Info
			if err != nil && !errors.Is(err, context.Canceled) {
				exitFn = wrkLog.WithError(err).Error
			}
			exitFn("background apiworker is exiting")
		}()

		// Work exits when ctx is done as in-flight requests do not depend
		// on it. If they do in the future this should be baseCtx instead.
		err = wrk.Work(ctx)
	}()

	if watchDir != "" {
		wg.Add(1)
		go func() {
			defer wg.Done()

			rc := config.Reloading
			le := logrus.WithFields(logrus.Fields{
				"component":             "reloader",
				"notify_enabled":        rc.NotifyEnabled,
				"poller_enabled":        rc.PollerEnabled,
				"poller_interval":       rc.PollerInterval.String(),
				"signal_enabled":        rc.SignalEnabled,
				"signal_number":         rc.SignalNumber,
				"grace_period_duration": rc.GracePeriodInterval.String(),
			})
			le.Info("starting configuration reloader")

			var err error
			defer func() {
				exitFn := le.Info
				if err != nil && !errors.Is(err, context.Canceled) {
					exitFn = le.WithError(err).Error
				}
				exitFn("config reloader is exiting")
			}()

			previousLim := initialLim
			fn := func(latestCfg *conf.GlobalConfiguration) {
				le.Info("reloading api with new configuration")

				// Update the previous limiter with the latest config
				latestLim := previousLim.Update(le, latestCfg)

				// Create a new API version with the updated config.
				latestAPI := api.NewAPIWithVersion(
					latestCfg, db, utilities.Version,

					// Create a new mailer with existing template cache.
					api.WithMailer(
						templatemailer.FromConfig(latestCfg, mrCache),
					),

					// Persist existing rate limiters.
					api.WithLimiter(latestLim),
				)

				// Assign this config as the latest configuration
				ah.Store(latestAPI)

				// When config is updated we notify the apiworker.
				wrk.ReloadConfig(latestCfg)

				// Update previous limiter
				previousLim = latestLim
			}

			rlFunc := func(dir string) (*conf.GlobalConfiguration, error) {
				return configLoader.Reload(dir)
			}
			rl := reloader.NewReloaderFunc(rc, watchDir, rlFunc)
			err = rl.Watch(ctx, fn)
		}()
	}

	wg.Add(1)
	go func() { // #nosec G118 -- Cleanup goroutine intentionally outlives the request; context.Background() is required for shutdown after parent context is cancelled.
		defer wg.Done()

		<-ctx.Done()

		// This must be done after httpSrv exits, otherwise you may potentially
		// have 1 or more inflight http requests blocked until the shutdownCtx
		// is canceled.
		defer baseCancel()

		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), time.Minute)
		defer shutdownCancel()

		if err := httpSrv.Shutdown(shutdownCtx); err != nil && !errors.Is(err, context.Canceled) {
			log.WithError(err).Error("shutdown failed")
		}
	}()

	lc := net.ListenConfig{
		Control: func(network, address string, c syscall.RawConn) error {
			var serr error
			if err := c.Control(func(fd uintptr) {
				serr = unix.SetsockoptInt(int(fd), unix.SOL_SOCKET, unix.SO_REUSEPORT, 1) // #nosec G115
			}); err != nil {
				return err
			}
			return serr
		},
	}
	listener, err := lc.Listen(ctx, "tcp", addr)
	if err != nil {
		log.WithError(err).Fatal("http server listen failed")
	}
	err = httpSrv.Serve(listener)
	if err == http.ErrServerClosed {
		log.Info("http server closed")
	} else if err != nil {
		log.WithError(err).Fatal("http server serve failed")
	}
}
