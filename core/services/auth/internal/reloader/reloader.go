// Package reloader provides support for live configuration reloading.
package reloader

import (
	"context"
	"errors"
	"os"
	"os/signal"
	"path/filepath"
	"sync"
	"syscall"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"golang.org/x/sync/errgroup"
)

const (

	// tickerInterval is the maximum latency between configuration reloads.
	tickerInterval = time.Second
)

type ConfigFunc func(*conf.GlobalConfiguration)

type Reloader struct {
	watchDir string
	rc       conf.ReloadingConfiguration

	// Below here is for DI
	tickerIval time.Duration
	watchFn    func() (watcher, error)
	reloadFn   func(dir string) (*conf.GlobalConfiguration, error)
	addDirFn   func(ctx context.Context, wr watcher, dir string) error
}

func NewReloader(rc conf.ReloadingConfiguration, watchDir string) *Reloader {
	return NewReloaderFunc(rc, watchDir, defaultReloadFn)
}

func NewReloaderFunc(rc conf.ReloadingConfiguration, watchDir string, fn ReloadFunc) *Reloader {
	return &Reloader{
		rc:         rc,
		watchDir:   watchDir,
		tickerIval: tickerInterval,
		watchFn:    newFSWatcher,
		reloadFn:   fn,
		addDirFn:   defaultAddDirFn,
	}
}

type ReloadFunc func(dir string) (*conf.GlobalConfiguration, error)

// reload attempts to create a new *conf.GlobalConfiguration after loading the
// currently configured watchDir.
func (rl *Reloader) reload() (*conf.GlobalConfiguration, error) {
	return rl.reloadFn(rl.watchDir)
}

// reloadCheckAt checks if reloadConfig should be called, returns true if config
// should be reloaded or false otherwise.
func (rl *Reloader) reloadCheckAt(at, lastUpdate time.Time) bool {
	if lastUpdate.IsZero() {
		return false // no pending updates
	}
	if at.Sub(lastUpdate) < rl.rc.GracePeriodInterval {
		return false // waiting for reload interval
	}

	// Update is pending.
	return true
}

type watchState struct {
	eg errgroup.Group
	fn ConfigFunc
	ch chan struct{}
}

func (o *watchState) notify() {
	select {
	case o.ch <- struct{}{}:
	default:
	}
}

func newWatchState(
	fn ConfigFunc,
) *watchState {
	return &watchState{
		fn: fn,
		ch: make(chan struct{}, 1),
	}
}

func (rl *Reloader) Watch(ctx context.Context, fn ConfigFunc) error {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	ws := newWatchState(fn)
	if rl.rc.NotifyEnabled || rl.rc.SignalEnabled {
		ws.eg.Go(func() error { return rl.watchReloads(ctx, ws) })
	}

	if rl.rc.NotifyEnabled {
		ws.eg.Go(func() error {
			defer func() {
				if !rl.rc.SignalEnabled {
					cancel()
				}
			}()

			return rl.watchNotify(ctx, ws)
		})
	}

	if rl.rc.SignalEnabled {
		ws.eg.Go(func() error {
			defer func() {
				if rl.rc.NotifyEnabled {
					cancel()
				}
			}()

			return rl.watchSignal(ctx, ws)
		})
	}
	return ws.eg.Wait()
}

func (rl *Reloader) watchReloads(
	ctx context.Context,
	ws *watchState,
) error {
	tr := time.NewTicker(rl.tickerIval)
	defer tr.Stop()

	var lastUpdate time.Time
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()

		case <-ws.ch:
			lastUpdate = time.Now()

		case <-tr.C:
			// Check to see if the config is ready to be relaoded.
			if !rl.reloadCheckAt(time.Now(), lastUpdate) {
				continue
			}

			// Reset the last update time before we try to reload the config.
			lastUpdate = time.Time{}

			cfg, err := rl.reload()
			if err != nil {
				logrus.WithError(err).Error("reloader: error loading config")
				continue
			}

			// Call the callback function with the latest cfg.
			ws.fn(cfg)
		}
	}
}

func (rl *Reloader) watchPoller(
	ctx context.Context,
	ws *watchState,
) error {
	errFn := func(err error) {
		logrus.WithError(err).Error("reloader: error polling config directory")
	}

	pr := newPoller(rl.watchDir)
	if _, err := pr.poll(ctx); err != nil {
		errFn(err)
	}
	return pr.watch(ctx, rl.rc.PollerInterval, ws.notify, errFn)
}

func (rl *Reloader) watchSignal(
	ctx context.Context,
	ws *watchState,
) error {
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.Signal(rl.rc.SignalNumber))
	defer signal.Stop(sigCh)

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-sigCh:
			ws.notify()
		}
	}
}

func (rl *Reloader) watchNotify(
	ctx context.Context,
	ws *watchState,
) error {
	wr, err := rl.watchFn()
	if err != nil {
		if rl.rc.PollerEnabled {
			logrus.WithError(err).Error(
				"reloader: error creating fsnotify Watcher, switching to poller")
			return rl.watchPoller(ctx, ws)
		}

		logrus.WithError(err).Error("reloader: error creating fsnotify Watcher")
		return err
	}
	defer wr.Close()

	tr := time.NewTicker(rl.rc.GracePeriodInterval)
	defer tr.Stop()

	// A simple log dedupe flag to prevent endless noise if config dir missing
	var addDirFailed bool

	// Ignore errors, if watch dir doesn't exist we can add it later.
	if err := rl.addDirFn(ctx, wr, rl.watchDir); err != nil {

		// On a supported host OS like linux the watcher creation won't fail
		// but will when adding a dir with an underlying filesystem without
		// notification support. Checking if the directory is watchable when
		// you get an error from addDirFn is a way to detect this.
		if rl.rc.PollerEnabled && isWatchable(rl.watchDir) {
			logrus.WithError(err).Error(
				"reloader: error using fsnotify Watcher, switching to poller")
			return rl.watchPoller(ctx, ws)
		}

		logrus.WithError(err).Error("reloader: error watching config directory")
		addDirFailed = true
	}

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()

		case <-tr.C:

			// This is a simple way to solve watch dir being added later or
			// being moved and then recreated. I've tested all of these basic
			// scenarios and wr.WatchList() does not grow which aligns with
			// the documented behavior.
			err := rl.addDirFn(ctx, wr, rl.watchDir)
			if err != nil && !addDirFailed {
				logrus.WithError(err).Error("reloader: error watching config directory")
			}
			addDirFailed = err != nil

		case evt, ok := <-wr.Events():
			if !ok {
				err := errors.New("reloader: fsnotify event channel was closed")
				logrus.WithError(err).Error(err)
				return err
			}

			if !isPathReloadable(evt.Name) {
				continue
			}
			switch {
			case evt.Op.Has(fsnotify.Create),
				evt.Op.Has(fsnotify.Remove),
				evt.Op.Has(fsnotify.Rename),
				evt.Op.Has(fsnotify.Write):
				ws.notify()
			}
		case err, ok := <-wr.Errors():
			if !ok {
				err := errors.New("reloader: fsnotify error channel was closed")
				logrus.WithError(err).Error(err)
				return err
			}
			logrus.WithError(err).Error(
				"reloader: fsnotify has reported an error")
		}
	}
}

// TOOD(cstockton): At some point we should pass a concrete ref to the loader
// and ask the loader if a path is reloadable.
func isPathReloadable(name string) bool {
	switch filepath.Ext(name) {
	case ".env", ".json":
		return true
	default:
		return false
	}
}
func isWatchable(dir string) bool {
	fi, err := os.Stat(dir)
	if err != nil {
		return false
	}
	if !fi.IsDir() {
		return false
	}
	return true
}

// defaultAddDirFn adds a dir to a watcher with a common error and sleep
// duration if the directory doesn't exist.
func defaultAddDirFn(ctx context.Context, wr watcher, dir string) error {
	return wr.Add(dir)
}

func defaultReloadFn(dir string) (*conf.GlobalConfiguration, error) {
	if err := confload.LoadDirectory(dir); err != nil {
		return nil, err
	}

	cfg, err := confload.LoadGlobalFromEnv()
	if err != nil {
		return nil, err
	}
	return cfg, nil
}

type watcher interface {
	Add(path string) error
	Close() error
	Events() chan fsnotify.Event
	Errors() chan error
}

type fsNotifyWatcher struct {
	wr *fsnotify.Watcher
}

func newFSWatcher() (watcher, error) {
	wr, err := fsnotify.NewWatcher()
	return &fsNotifyWatcher{wr}, err
}

func (o *fsNotifyWatcher) Add(path string) error       { return o.wr.Add(path) }
func (o *fsNotifyWatcher) Close() error                { return o.wr.Close() }
func (o *fsNotifyWatcher) Errors() chan error          { return o.wr.Errors }
func (o *fsNotifyWatcher) Events() chan fsnotify.Event { return o.wr.Events }

type mockWatcher struct {
	mu      sync.Mutex
	err     error
	eventCh chan fsnotify.Event
	errorCh chan error
	addCh   chan string
}

func newMockWatcher(err error) *mockWatcher {
	wr := &mockWatcher{
		err:     err,
		eventCh: make(chan fsnotify.Event, 1024),
		errorCh: make(chan error, 1024),
		addCh:   make(chan string, 1024),
	}
	return wr
}

func (o *mockWatcher) getErr() error {
	o.mu.Lock()
	defer o.mu.Unlock()
	err := o.err
	return err
}

func (o *mockWatcher) setErr(err error) {
	o.mu.Lock()
	defer o.mu.Unlock()
	o.err = err
}

func (o *mockWatcher) Add(path string) error {
	o.mu.Lock()
	defer o.mu.Unlock()
	if err := o.err; err != nil {
		return err
	}

	select {
	case o.addCh <- path:
	default:
	}
	return nil
}
func (o *mockWatcher) Close() error                { return o.getErr() }
func (o *mockWatcher) Events() chan fsnotify.Event { return o.eventCh }
func (o *mockWatcher) Errors() chan error          { return o.errorCh }
