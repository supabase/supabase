package reloader

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/e2e"
	"golang.org/x/sync/errgroup"
)

func TestPoller(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	t.Run("Poll", func(t *testing.T) {
		dir, cleanup := helpTestDir(t)
		defer cleanup()

		pr := newPoller(dir)
		require.NotNil(t, pr)

		// create a dir to skip
		{
			dirEnv := dir + "/dir.env"
			err := os.MkdirAll(dirEnv, 0750)
			require.NoError(t, err)
		}

		// first 4 polls should all return false, we haven't wrote config yet
		for range 4 {
			changes, err := pr.poll(ctx)
			require.NoError(t, err)
			require.False(t, changes)
		}

		// for 3 iterations
		for i := range 3 {

			{
				// write to the config
				name := fmt.Sprintf("%.02d_conf.env", i)
				helpWriteEnvFile(t, dir, name, map[string]string{
					"GOTRUE_SMTP_PORT": fmt.Sprintf("%d", 1000+i),
				})
			}

			// next poll detects above changes
			{
				changes, err := pr.poll(ctx)
				require.NoError(t, err)
				require.True(t, changes)
			}

			// no changes detected since last poll
			{
				changes, err := pr.poll(ctx)
				require.NoError(t, err)
				require.False(t, changes)
			}

			// write to the config
			name := fmt.Sprintf("%.02d_conf.env.bak", i)
			helpWriteEnvFile(t, dir, name, map[string]string{
				"GOTRUE_SMTP_PORT": fmt.Sprintf("%d", 1000+i),
			})

			// no changes detected since last poll since conf file has .bak
			{
				changes, err := pr.poll(ctx)
				require.NoError(t, err)
				require.False(t, changes)
			}
		}

		// context canceled propagation
		{
			pollCtx, pollCancel := context.WithCancel(ctx)
			pollCancel()

			_, err := pr.poll(pollCtx)
			require.Error(t, err)
		}
	})

	t.Run("InvalidDir", func(t *testing.T) {
		dir, cleanup := helpTestDir(t)
		defer cleanup()

		pr := newPoller(dir + "/invalid")
		require.NotNil(t, pr)

		changes, err := pr.poll(ctx)
		require.Error(t, err)
		require.False(t, changes)
	})

	t.Run("InvalidDirType", func(t *testing.T) {
		dir, cleanup := helpTestDir(t)
		defer cleanup()

		file := helpWriteEnvFile(t, dir, "not-a-dir", nil)
		pr := newPoller(file)
		require.NotNil(t, pr)

		changes, err := pr.poll(ctx)
		require.Error(t, err)
		require.False(t, changes)
	})

	t.Run("DoublePoll", func(t *testing.T) {
		dir, cleanup := helpTestDir(t)
		defer cleanup()

		pr := newPoller(dir)
		require.NotNil(t, pr)

		helpWriteEnvFile(t, dir, "01_conf.env", nil)

		egCtx, egCancel := context.WithCancel(ctx)
		defer egCancel()

		const exp = "concurrent calls to poll are invalid"
		eg := new(errgroup.Group)
		for range 6 {
			eg.Go(func() error {
				for {
					if err := egCtx.Err(); err != nil {
						return nil
					}
					if err := ctx.Err(); err != nil {
						return err
					}

					_, err := pr.poll(ctx)
					if err == nil {
						continue
					}
					msg := err.Error()
					if strings.Contains(msg, exp) {
						egCancel()
						return nil
					}
				}
			})
		}

		err := eg.Wait()
		require.NoError(t, err)
	})

	t.Run("Watch", func(t *testing.T) {
		dir, cleanup := helpTestDir(t)
		defer cleanup()

		pr := newPoller(dir)
		require.NotNil(t, pr)

		egCtx, egCancel := context.WithCancel(ctx)
		defer egCancel()

		writerWg := new(sync.WaitGroup)
		writerWg.Add(1)
		writerDoneCh := make(chan struct{})

		notifyCalled := false

		notifyFn := func() {
			notifyCalled = true
			close(writerDoneCh)
			writerWg.Wait()
			cleanup()
		}

		var watchErr error
		errFn := func(err error) {
			watchErr = err
			egCancel()
		}

		eg := new(errgroup.Group)
		eg.Go(func() error {
			return pr.watch(egCtx, time.Millisecond*100, notifyFn, errFn)
		})

		eg.Go(func() error {
			defer writerWg.Done()

			tr := time.NewTicker(time.Millisecond * 50)
			defer tr.Stop()

			for {
				select {
				case <-writerDoneCh:
					return nil
				case <-egCtx.Done():
					return egCtx.Err()
				case <-tr.C:
					helpWriteEnvFile(t, dir, "01_conf.env", nil)
				}
			}
		})

		err := eg.Wait()
		require.Error(t, err)
		require.Error(t, watchErr)
		require.True(t, notifyCalled)
	})

	t.Run("Errors", func(t *testing.T) {
		testCtx, testCancel := context.WithCancel(ctx)
		defer testCancel()

		// is not dir
		{
			f := &mockFile{
				info: &mockFile{},
			}

			pr := &poller{}
			err := pr.scanFile(testCtx, nil, f)
			require.Error(t, err)
			require.ErrorContains(t, err, "is not a directory")
		}

		// stat error
		{
			sentinel := errors.New("sentinel")
			f := &mockFile{
				err: sentinel,
			}

			pr := &poller{}
			err := pr.scanFile(testCtx, nil, f)
			require.Error(t, err)
			require.ErrorContains(t, err, sentinel.Error())
		}

		// err reading dir after valid stat
		{
			sentinel := errors.New("sentinel")
			f := &mockFile{
				err:   sentinel,
				errAt: 2,
				info:  &mockFile{dir: true},
			}

			pr := &poller{}
			err := pr.scanFile(testCtx, nil, f)
			require.Error(t, err)
			require.ErrorContains(t, err, "sentinel")
		}

		// err scanning entries
		{
			sentinel := errors.New("sentinel")
			f := &mockFile{
				info:  &mockFile{dir: true},
				err:   sentinel,
				errAt: 6,
				ents: []fs.DirEntry{
					&mockFile{err: sentinel},
				},
			}

			pr := &poller{}
			err := pr.scanFile(testCtx, nil, f)
			require.Error(t, err)
			require.ErrorContains(t, err, "sentinel")
		}

		// broken fs or huge directory
		{
			sentinel := errors.New("sentinel")
			f := &mockFile{
				info:  &mockFile{dir: true},
				err:   sentinel,
				errAt: 20000,
				ents: []fs.DirEntry{
					&mockFile{err: sentinel},
				},
			}

			pr := &poller{}
			err := pr.scanFile(testCtx, nil, f)
			require.Error(t, err)
			require.ErrorContains(t, err, "has too many files")
		}

		// ctx done
		{
			cancel()

			pr := &poller{}
			f := &mockFile{info: &mockFile{dir: true}}
			err := pr.scanFile(testCtx, nil, f)
			require.Error(t, err)
			require.ErrorContains(t, err, ctx.Err().Error())
		}
	})

}

func TestWatchPoller(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	dir, cleanup := helpTestDir(t)
	defer cleanup()

	// test watch invalid dir
	{
		doneCtx, doneCancel := context.WithCancel(ctx)
		doneCancel()

		rr := mockReloadRecorder()

		cfg := e2e.Must(e2e.Config()).Reloading
		cfg.NotifyEnabled = true
		rl := NewReloader(cfg, path.Join(dir, "__not_found__"))

		err := rl.Watch(doneCtx, rr.configFn)
		if exp, got := context.Canceled, err; exp != got {
			require.Equal(t, exp, got)
		}
	}

	// test watch poll fails
	{
		doneCtx, doneCancel := context.WithCancel(ctx)
		doneCancel()

		rr := mockReloadRecorder()

		cfg := e2e.Must(e2e.Config()).Reloading
		rl := NewReloader(cfg, path.Join(dir, "__not_found__"))
		cfg.NotifyEnabled = false

		err := rl.Watch(doneCtx, rr.configFn)
		if exp, got := context.Canceled, err; exp != got {
			require.Equal(t, exp, got)
		}
	}

	// test ctx cancel
	{
		doneCtx, doneCancel := context.WithCancel(ctx)
		doneCancel()

		cfg := e2e.Must(e2e.Config()).Reloading
		rl := NewReloader(cfg, dir)

		err := rl.watchPoller(doneCtx, nil)
		if exp, got := context.Canceled, err; exp != got {
			require.Equal(t, exp, got)
		}
	}
}
