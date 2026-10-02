package reloader

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"syscall"
	"testing"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/e2e"
	"golang.org/x/sync/errgroup"
)

func TestLoadConfigFile(t *testing.T) {
	// test bad multi line config value
	if err := godotenv.Overload("testdata/60_example_newline.env"); err != nil {
		t.Fatal(err)
	}
}

func TestWatchSignals(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	dir, cleanup := helpTestDir(t)
	defer cleanup()

	// test ctx cancel
	{
		doneCtx, doneCancel := context.WithCancel(ctx)
		doneCancel()

		cfg := e2e.Must(e2e.Config()).Reloading
		rl := NewReloader(cfg, dir)

		err := rl.watchSignal(doneCtx, nil)
		if exp, got := context.Canceled, err; exp != got {
			require.Equal(t, exp, got)
		}
	}

	{
		proc, err := os.FindProcess(os.Getpid())
		require.NoError(t, err)

		const sig = syscall.SIGUSR1
		cfg := e2e.Must(e2e.Config()).Reloading
		cfg.GracePeriodInterval = time.Second / 100
		cfg.PollerInterval = time.Second / 100
		cfg.SignalEnabled = true
		cfg.SignalNumber = int(sig)
		cfg.NotifyEnabled = true
		cfg.PollerEnabled = true

		rl := NewReloader(cfg, dir)

		egCtx, egCancel := context.WithCancel(ctx)
		defer egCancel()

		rr := mockReloadRecorder()
		gateCh := make(chan struct{})

		var eg errgroup.Group
		eg.Go(func() error {
			close(gateCh)

			return rl.Watch(egCtx, rr.configFn)
		})

		eg.Go(func() error {
			select {
			case <-gateCh:
			case <-egCtx.Done():
				return egCtx.Err()
			}

			tr := time.NewTicker(time.Second / 16)
			defer tr.Stop()

			after := time.After(time.Second / 4)
			for {
				select {
				case <-after:
					return nil
				case <-tr.C:
					if err := proc.Signal(sig); err != nil {
						return err
					}
				}
			}
		})

		// need to ensure errorCh drains so test isn't racey
		eg.Go(func() error {
			defer egCancel()

			select {
			case <-egCtx.Done():
				return egCtx.Err()
			case <-rr.configCh:
				egCancel()
				return nil
			}
		})

		err = eg.Wait()
		if exp, got := context.Canceled, err; exp != got {
			require.Equal(t, exp, got)
		}
	}
}

func TestWatchNotify(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	t.Run("IsWatchable", func(t *testing.T) {
		dir, cleanup := helpTestDir(t)
		defer cleanup()

		invalidDir := path.Join(dir, "__not_found__")
		require.False(t, isWatchable(invalidDir))

		name := helpWriteEnvFile(t, dir, "05_example.env", map[string]string{
			"GOTRUE_SMTP_PORT": "2222",
		})
		require.False(t, isWatchable(name))

	})

	t.Run("AllDisabled", func(t *testing.T) {
		dir, cleanup := helpTestDir(t)
		defer cleanup()

		rr := mockReloadRecorder()

		cfg := e2e.Must(e2e.Config()).Reloading
		cfg.NotifyEnabled = false
		cfg.SignalEnabled = false
		cfg.PollerEnabled = false

		rl := NewReloader(cfg, dir)

		err := rl.Watch(ctx, rr.configFn)
		require.NoError(t, err)
	})

	t.Run("BrokenWatcher", func(t *testing.T) {
		dir, cleanup := helpTestDir(t)
		defer cleanup()

		sentinelErr := errors.New("sentinel")
		rr := mockReloadRecorder()

		cfg := e2e.Must(e2e.Config()).Reloading
		cfg.SignalEnabled = false
		cfg.PollerEnabled = false

		rl := NewReloader(cfg, dir)
		rl.watchFn = func() (watcher, error) { return nil, sentinelErr }

		err := rl.Watch(ctx, rr.configFn)
		if exp, got := sentinelErr, err; exp != got {
			require.Equal(t, exp, got)
		}
	})

	t.Run("InvalidDir", func(t *testing.T) {
		dir, cleanup := helpTestDir(t)
		defer cleanup()

		doneCtx, doneCancel := context.WithCancel(ctx)
		doneCancel()

		cfg := e2e.Must(e2e.Config()).Reloading
		cfg.SignalEnabled = false
		cfg.PollerEnabled = false

		invalidDir := path.Join(dir, "__not_found__")
		rr := mockReloadRecorder()
		rl := NewReloader(cfg, invalidDir)
		err := rl.Watch(doneCtx, rr.configFn)
		if exp, got := context.Canceled, err; exp != got {
			require.Equal(t, exp, got)
		}
	})

	t.Run("AddDirFnError", func(t *testing.T) {
		dir, cleanup := helpTestDir(t)
		defer cleanup()

		sentinel := errors.New("sentinel")
		wr := newMockWatcher(sentinel)

		cfg := e2e.Must(e2e.Config()).Reloading
		cfg.SignalEnabled = false
		cfg.PollerEnabled = false

		rl := NewReloader(cfg, dir)
		rl.watchFn = func() (watcher, error) { return wr, nil }

		err := rl.addDirFn(ctx, wr, dir)
		if exp, got := sentinel, err; exp != got {
			require.Equal(t, exp, got)
		}
	})

	t.Run("ErrorChanClosed", func(t *testing.T) {
		fn := func() string {
			ctx, cancel := context.WithCancel(ctx)
			defer cancel()

			dir, cleanup := helpTestDir(t)
			defer cleanup()

			cfg := e2e.Must(e2e.Config()).Reloading
			cfg.SignalEnabled = false
			cfg.PollerEnabled = false

			rr := mockReloadRecorder()
			wr := newMockWatcher(nil)
			wr.errorCh <- errors.New("sentinel")
			close(wr.errorCh)

			rl := NewReloader(cfg, dir)
			rl.watchFn = func() (watcher, error) { return wr, nil }

			err := rl.Watch(ctx, rr.configFn)
			require.NotNil(t, err)
			return err.Error()
		}

		const exp = "reloader: fsnotify error channel was closed"
		runUntilErrorStr(t, exp, fn)
	})

	t.Run("EventChanClosed", func(t *testing.T) {
		fn := func() string {
			ctx, cancel := context.WithCancel(ctx)
			defer cancel()

			dir, cleanup := helpTestDir(t)
			defer cleanup()

			cfg := e2e.Must(e2e.Config()).Reloading
			cfg.SignalEnabled = false
			cfg.PollerEnabled = false
			cfg.GracePeriodInterval = time.Second / 100

			rr := mockReloadRecorder()
			wr := newMockWatcher(nil)
			close(wr.eventCh)

			rl := NewReloader(cfg, dir)
			rl.watchFn = func() (watcher, error) { return wr, nil }

			err := rl.Watch(ctx, rr.configFn)
			require.NotNil(t, err)

			return err.Error()
		}

		const exp = "reloader: fsnotify event channel was closed"
		runUntilErrorStr(t, exp, fn)
	})

	t.Run("ErrorChan", func(t *testing.T) {
		dir, cleanup := helpTestDir(t)
		defer cleanup()

		cfg := e2e.Must(e2e.Config()).Reloading
		cfg.SignalEnabled = false
		cfg.PollerEnabled = false

		rr := mockReloadRecorder()
		wr := newMockWatcher(nil)
		wr.errorCh <- errors.New("sentinel")

		rl := NewReloader(cfg, dir)
		rl.watchFn = func() (watcher, error) { return wr, nil }

		egCtx, egCancel := context.WithCancel(ctx)
		defer egCancel()

		var eg errgroup.Group
		eg.Go(func() error {
			defer egCancel()

			return rl.Watch(egCtx, rr.configFn)
		})

		// need to ensure errorCh drains so test isn't racey
		eg.Go(func() error {
			defer egCancel()

			tr := time.NewTicker(time.Second / 100)
			defer tr.Stop()

			for {
				select {
				case <-egCtx.Done():
					return egCtx.Err()
				case <-tr.C:
					if len(wr.errorCh) == 0 {
						return nil
					}
				}
			}
		})

		err := eg.Wait()
		if exp, got := context.Canceled, err; exp != got {
			require.Equal(t, exp, got)
		}
	})

	t.Run("PollerFallbackOnWatcherError", func(t *testing.T) {
		dir, cleanup := helpTestDir(t)
		defer cleanup()

		sentinelErr := errors.New("sentinel")
		rr := mockReloadRecorder()

		cfg := e2e.Must(e2e.Config()).Reloading
		cfg.GracePeriodInterval = time.Second / 100
		cfg.PollerInterval = time.Second / 100
		cfg.PollerEnabled = true
		cfg.SignalEnabled = false

		rl := NewReloader(cfg, dir)
		rl.watchFn = func() (watcher, error) { return nil, sentinelErr }
		rl.reloadFn = rr.reloadFn

		// Need to lower ticker ival to pickup config write quicker.
		rl.tickerIval = time.Second / 100

		egCtx, egCancel := context.WithCancel(ctx)
		defer egCancel()

		var eg errgroup.Group
		eg.Go(func() error {
			defer egCancel()

			return rl.Watch(egCtx, rr.configFn)
		})

		// need to ensure errorCh drains so test isn't racey
		eg.Go(func() error {
			defer egCancel()

			tr := time.NewTicker(time.Second / 100)
			defer tr.Stop()

			for {
				select {
				case <-egCtx.Done():
					return egCtx.Err()
				case <-rr.configCh:
					return nil
				case <-tr.C:
					// write to the config
					helpWriteEnvFile(t, dir, "01_conf.env", map[string]string{
						"GOTRUE_SMTP_PORT": "11111",
					})
				}
			}
		})

		err := eg.Wait()
		if exp, got := context.Canceled, err; exp != got {
			require.Equal(t, exp, got)
		}
	})

	t.Run("PollerFallbackOnAddDirError", func(t *testing.T) {
		dir, cleanup := helpTestDir(t)
		defer cleanup()

		sentinelErr := errors.New("sentinel")
		rr := mockReloadRecorder()

		cfg := e2e.Must(e2e.Config()).Reloading
		cfg.GracePeriodInterval = time.Second / 100
		cfg.PollerInterval = time.Second / 100
		cfg.PollerEnabled = true
		cfg.SignalEnabled = false

		rl := NewReloader(cfg, dir)
		rl.reloadFn = rr.reloadFn
		rl.addDirFn = func(ctx context.Context, wr watcher, dir string) error {
			return sentinelErr
		}

		// Need to lower ticker ival to pickup config write quicker.
		rl.tickerIval = time.Second / 100

		egCtx, egCancel := context.WithCancel(ctx)
		defer egCancel()

		var eg errgroup.Group
		eg.Go(func() error {
			defer egCancel()

			return rl.Watch(egCtx, rr.configFn)
		})

		// need to ensure errorCh drains so test isn't racey
		eg.Go(func() error {
			defer egCancel()

			tr := time.NewTicker(time.Second / 100)
			defer tr.Stop()

			for {
				select {
				case <-egCtx.Done():
					return egCtx.Err()
				case <-rr.configCh:
					return nil
				case <-tr.C:
					// write to the config
					helpWriteEnvFile(t, dir, "01_conf.env", map[string]string{
						"GOTRUE_SMTP_PORT": "11111",
					})
				}
			}
		})

		err := eg.Wait()
		if exp, got := context.Canceled, err; exp != got {
			require.Equal(t, exp, got)
		}

		// context canceled propagation
		{
			pollCtx, pollCancel := context.WithCancel(ctx)
			pollCancel()

			err := rl.watchPoller(pollCtx, nil)
			require.Error(t, err)
		}
	})

	t.Run("EndToEnd", func(t *testing.T) {
		dir, cleanup := helpTestDir(t)
		defer cleanup()

		cfg := e2e.Must(e2e.Config()).Reloading
		cfg.SignalEnabled = false
		cfg.PollerEnabled = false
		cfg.GracePeriodInterval = time.Second / 100

		rr := mockReloadRecorder()
		wr := newMockWatcher(nil)

		rl := NewReloader(cfg, dir)
		rl.tickerIval = time.Second / 100
		rl.watchFn = func() (watcher, error) { return wr, wr.getErr() }
		rl.reloadFn = rr.reloadFn
		rl.addDirFn = func(ctx context.Context, wr watcher, dir string) error {
			if err := wr.Add(dir); err != nil {
				logrus.WithError(err).Error("reloader: error watching config directory")
				return err
			}
			return nil
		}

		egCtx, egCancel := context.WithCancel(ctx)
		defer egCancel()

		var eg errgroup.Group
		eg.Go(func() error {
			defer egCancel()

			return rl.Watch(egCtx, rr.configFn)
		})

		// Copy a full and valid example configuration to trigger Watch
		{
			select {
			case <-egCtx.Done():
				require.Nil(t, egCtx.Err())
			case v := <-wr.addCh:
				require.Equal(t, v, dir)
			}

			name := helpCopyEnvFile(t, dir, "01_example.env", "testdata/50_example.env")
			wr.eventCh <- fsnotify.Event{
				Name: name,
				Op:   fsnotify.Create,
			}
			select {
			case <-egCtx.Done():
				require.Nil(t, egCtx.Err())
			case cfg := <-rr.configCh:
				require.NotNil(t, cfg)
				require.Equal(t, cfg.External.Apple.Enabled, false)
			}
		}

		{
			drain(rr.configCh)
			drain(rr.reloadCh)

			name := helpWriteEnvFile(t, dir, "02_example.env", map[string]string{
				"GOTRUE_EXTERNAL_APPLE_ENABLED": "true",
			})
			wr.eventCh <- fsnotify.Event{
				Name: name,
				Op:   fsnotify.Create,
			}

			cfg, err := ctxSelect(egCtx, rr.configCh)
			require.NoError(t, err)
			require.NotNil(t, cfg)
			require.Equal(t, cfg.External.Apple.Enabled, true)
		}

		{
			name := helpWriteEnvFile(t, dir, "03_example.env.bak", map[string]string{
				"GOTRUE_EXTERNAL_APPLE_ENABLED": "false",
			})
			wr.eventCh <- fsnotify.Event{
				Name: name,
				Op:   fsnotify.Create,
			}
		}

		{
			// empty the reload ch
			drain(rr.reloadCh)

			name := helpWriteEnvFile(t, dir, "04_example.env", map[string]string{
				"GOTRUE_SMTP_PORT": "ABC",
			})
			wr.eventCh <- fsnotify.Event{
				Name: name,
				Op:   fsnotify.Create,
			}

			select {
			case <-egCtx.Done():
				require.Nil(t, egCtx.Err())
			case p := <-rr.reloadCh:
				if exp, got := dir, p; exp != got {
					require.Equal(t, exp, got)
				}
			}
		}

		{
			name := helpWriteEnvFile(t, dir, "05_example.env", map[string]string{
				"GOTRUE_SMTP_PORT": "2222",
			})
			wr.eventCh <- fsnotify.Event{
				Name: name,
				Op:   fsnotify.Create,
			}

			cfg, err := ctxSelect(egCtx, rr.configCh)
			require.NoError(t, err)
			require.NotNil(t, cfg)
			require.Equal(t, cfg.SMTP.Port, 2222)
		}

		// test the wr.Add doesn't exit if bad watch dir is given during tick
		{
			// set the error on watcher
			sentinelErr := errors.New("sentinel")
			wr.setErr(sentinelErr)

			name := helpWriteEnvFile(t, dir, "05_example.env", map[string]string{
				"GOTRUE_SMTP_PORT": "2221",
			})
			wr.eventCh <- fsnotify.Event{
				Name: name,
				Op:   fsnotify.Create,
			}

			cfg, err := ctxSelect(egCtx, rr.configCh)
			require.NoError(t, err)
			require.NotNil(t, cfg)
			require.Equal(t, cfg.SMTP.Port, 2221)
		}

		// test cases ran, end context to unblock Wait()
		egCancel()

		err := eg.Wait()
		if exp, got := context.Canceled, err; exp != got {
			require.Equal(t, exp, got)
		}
	})
}

func TestReloadConfig(t *testing.T) {
	dir, cleanup := helpTestDir(t)
	defer cleanup()

	cfg := e2e.Must(e2e.Config()).Reloading
	rl := NewReloader(cfg, dir)

	// Copy the full and valid example configuration.
	helpCopyEnvFile(t, dir, "01_example.env", "testdata/50_example.env")
	{
		cfg, err := rl.reload()
		require.Nil(t, err)
		require.NotNil(t, cfg)
		require.Equal(t, cfg.External.Apple.Enabled, false)
	}

	helpWriteEnvFile(t, dir, "02_example.env", map[string]string{
		"GOTRUE_EXTERNAL_APPLE_ENABLED": "true",
	})
	{
		cfg, err := rl.reload()
		require.Nil(t, err)
		require.NotNil(t, cfg)
		require.Equal(t, cfg.External.Apple.Enabled, true)
	}

	helpWriteEnvFile(t, dir, "03_example.env.bak", map[string]string{
		"GOTRUE_EXTERNAL_APPLE_ENABLED": "false",
	})
	{
		cfg, err := rl.reload()
		require.Nil(t, err)
		require.NotNil(t, cfg)
		require.Equal(t, cfg.External.Apple.Enabled, true)
	}

	// test cfg reload failure
	helpWriteEnvFile(t, dir, "04_example.env", map[string]string{
		"PORT":             "INVALIDPORT",
		"GOTRUE_SMTP_PORT": "ABC",
	})
	{
		cfg, err := rl.reload()
		require.NotNil(t, err)
		require.Nil(t, cfg)
	}

	// test directory loading failure
	{
		cleanup()

		cfg, err := rl.reload()
		require.NotNil(t, err)
		require.Nil(t, cfg)
	}
}

func TestReloadCheckAt(t *testing.T) {
	const s10 = time.Second * 10

	makeCfg := func(d time.Duration) conf.ReloadingConfiguration {
		return conf.ReloadingConfiguration{
			GracePeriodInterval: d,
		}
	}

	now := time.Now()
	tests := []struct {
		rl             *Reloader
		at, lastUpdate time.Time
		exp            bool
	}{
		// no lastUpdate is set (time.IsZero())
		{
			rl:  &Reloader{rc: makeCfg(s10), tickerIval: s10 / 10},
			exp: false,
		},
		{
			rl:  &Reloader{rc: makeCfg(s10), tickerIval: s10 / 10},
			at:  now,
			exp: false,
		},

		// last update within reload interval
		{
			rl:         &Reloader{rc: makeCfg(s10), tickerIval: s10 / 10},
			at:         now,
			lastUpdate: now.Add(-s10 + 1),
			exp:        false,
		},
		{
			rl:         &Reloader{rc: makeCfg(s10), tickerIval: s10 / 10},
			at:         now,
			lastUpdate: now,
			exp:        false,
		},
		{
			rl:         &Reloader{rc: makeCfg(s10), tickerIval: s10 / 10},
			at:         now,
			lastUpdate: now.Add(s10 - 1),
			exp:        false,
		},
		{
			rl:         &Reloader{rc: makeCfg(s10), tickerIval: s10 / 10},
			at:         now,
			lastUpdate: now.Add(s10),
			exp:        false,
		},
		{
			rl:         &Reloader{rc: makeCfg(s10), tickerIval: s10 / 10},
			at:         now,
			lastUpdate: now.Add(s10 + 1),
			exp:        false,
		},
		{
			rl:         &Reloader{rc: makeCfg(s10), tickerIval: s10 / 10},
			at:         now,
			lastUpdate: now.Add(s10 * 2),
			exp:        false,
		},

		// last update was outside our reload interval
		{
			rl:         &Reloader{rc: makeCfg(s10), tickerIval: s10 / 10},
			at:         now,
			lastUpdate: now.Add(-s10),
			exp:        true,
		},
		{
			rl:         &Reloader{rc: makeCfg(s10), tickerIval: s10 / 10},
			at:         now,
			lastUpdate: now.Add(-s10 - 1),
			exp:        true,
		},
	}
	for _, tc := range tests {
		rl := tc.rl
		require.NotNil(t, rl)
		require.Equal(t, rl.reloadCheckAt(tc.at, tc.lastUpdate), tc.exp)
	}
}

func runUntilErrorStr(t testing.TB, exp string, fn func() string) {
	var got string
	for range 100 {
		if got = fn(); got == exp {
			break
		}
	}
	require.Equal(t, exp, got)
}

func helpTestDir(t testing.TB) (dir string, cleanup func()) {
	name := fmt.Sprintf("%v_%v", t.Name(), time.Now().Nanosecond())
	dir = filepath.Join("testdata", name)
	err := os.MkdirAll(dir, 0750)
	if err != nil && !os.IsExist(err) {
		require.Nil(t, err)
	}
	return dir, func() { os.RemoveAll(dir) }
}

func helpCopyEnvFile(t testing.TB, dir, name, src string) string {
	data, err := os.ReadFile(src) // #nosec G304
	if err != nil {
		require.Nil(t, err)
	}

	dst := filepath.Join(dir, name)
	err = os.WriteFile(dst, data, 0600) // #nosec G703 -- Test helper; dir and name are controlled by the test.
	if err != nil {
		require.Nil(t, err)
	}
	return dst
}

func helpWriteEnvFile(t testing.TB, dir, name string, values map[string]string) string {
	var buf bytes.Buffer
	for k, v := range values {
		buf.WriteString(k)
		buf.WriteString("=")
		buf.WriteString(`"`)
		buf.WriteString(v)
		buf.WriteString(`"`)
		buf.WriteString("\n")
	}

	dst := filepath.Join(dir, name)
	err := os.WriteFile(dst, buf.Bytes(), 0600)
	require.Nil(t, err)
	return dst
}

func mockReloadRecorder() *reloadRecorder {
	rr := &reloadRecorder{
		configCh: make(chan *conf.GlobalConfiguration, 1024),
		reloadCh: make(chan string, 1024),
	}
	return rr
}

type reloadRecorder struct {
	configCh chan *conf.GlobalConfiguration
	reloadCh chan string
}

func (o *reloadRecorder) reloadFn(dir string) (*conf.GlobalConfiguration, error) {
	defer func() {
		select {
		case o.reloadCh <- dir:
		default:
		}
	}()
	return defaultReloadFn(dir)
}

func (o *reloadRecorder) configFn(gc *conf.GlobalConfiguration) {
	select {
	case o.configCh <- gc:
	default:
	}
}

func drain[C ~chan T, T any](ch C) (out []T) {
	for {
		select {
		case v := <-ch:
			out = append(out, v)
		default:
			return out
		}
	}
}

func ctxSelect[T any](ctx context.Context, ch <-chan T) (T, error) {
	var def T
	select {
	case <-ctx.Done():
		return def, ctx.Err()
	case def = <-ch:
		return def, nil
	}
}

type mockFile struct {
	err         error
	errN, errAt int

	dir  bool
	name string
	time time.Time
	mode fs.FileMode
	info fs.FileInfo
	ents []fs.DirEntry
}

func (o *mockFile) check() error {
	if o.errN++; o.errN == o.errAt || o.errAt == 0 {
		return o.err
	}
	return nil
}

// File
func (o *mockFile) Stat() (fs.FileInfo, error) { return o.info, o.check() }
func (o *mockFile) Read([]byte) (int, error)   { return 0, o.check() }
func (o *mockFile) Close() error               { return o.check() }

// ReadDirFile
func (o *mockFile) ReadDir(n int) ([]fs.DirEntry, error) { return o.ents, o.check() }

// FileInfo
func (o *mockFile) Name() string       { return o.name }
func (o *mockFile) Size() int64        { return 0 }
func (o *mockFile) Mode() fs.FileMode  { return o.mode }
func (o *mockFile) ModTime() time.Time { return o.time }
func (o *mockFile) IsDir() bool        { return o.dir }
func (o *mockFile) Sys() any           { return nil }

// DirEntry
func (o *mockFile) Type() fs.FileMode          { return o.mode }
func (o *mockFile) Info() (fs.FileInfo, error) { return o.info, o.check() }
func (o *mockFile) String() string             { return fs.FormatDirEntry(o) }
