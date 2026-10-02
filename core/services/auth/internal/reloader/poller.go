package reloader

import (
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"maps"
	"os"
	"sync"
	"time"
)

const (
	pollerMaxScan  = 1
	pollerMaxFiles = 1000
)

type poller struct {
	pollMu    sync.Mutex
	dir       string
	cur, prev *pollerState
}

type pollerFile struct {
	name string
	size int64
	mode fs.FileMode
	mod  time.Time
	dir  bool
}

type pollerState struct {
	updatedAt time.Time
	files     map[string]*pollerFile
}

func (o *pollerState) reset() { clear(o.files) }

func newPollerState() *pollerState {
	return &pollerState{
		files: make(map[string]*pollerFile),
	}
}

func newPollerFile(fi fs.FileInfo) *pollerFile {
	return &pollerFile{
		name: fi.Name(),
		size: fi.Size(),
		mode: fi.Mode(),
		mod:  fi.ModTime(),
		dir:  fi.IsDir(),
	}
}

func newPoller(watchDir string) *poller {
	return &poller{
		dir:  watchDir,
		cur:  newPollerState(),
		prev: newPollerState(),
	}
}

func (o *poller) watch(
	ctx context.Context,
	ival time.Duration,
	notifyFn func(),
	errFn func(error),
) error {
	tr := time.NewTicker(ival)
	defer tr.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-tr.C:
			changed, err := o.poll(ctx)
			if err != nil {
				errFn(err)
				continue
			}
			if changed {
				notifyFn()
			}
		}
	}
}

func (o *poller) poll(ctx context.Context) (bool, error) {
	if ok := o.pollMu.TryLock(); !ok {
		const msg = "reloader: poller: concurrent calls to poll are invalid"
		return false, errors.New(msg)
	}
	defer o.pollMu.Unlock()

	if err := ctx.Err(); err != nil {
		return false, err
	}

	o.prev, o.cur = o.cur, o.prev
	if err := o.scan(ctx, o.cur); err != nil {
		return false, err
	}
	o.cur.updatedAt = time.Now()
	m1, m2 := o.prev.files, o.cur.files

	if o.prev.updatedAt.IsZero() {
		return false, nil
	}

	eq := maps.EqualFunc(m1, m2, func(v1, v2 *pollerFile) bool {
		return *v1 == *v2
	})
	return !eq, nil
}

func (o *poller) scan(
	ctx context.Context,
	ps *pollerState,
) error {
	o.cur.reset()

	f, err := os.Open(o.dir)
	if err != nil {
		return err
	}
	defer f.Close()

	return o.scanFile(ctx, ps, f)
}

func (o *poller) scanFile(
	ctx context.Context,
	ps *pollerState,
	f fs.ReadDirFile,
) error {
	fi, err := f.Stat()
	if err != nil {
		return fmt.Errorf("poller: %w", err)
	}
	if !fi.IsDir() {
		return fmt.Errorf("poller: %q is not a directory", o.dir)
	}

	for range pollerMaxFiles / pollerMaxScan {
		if err := ctx.Err(); err != nil {
			return err
		}

		ents, err := f.ReadDir(pollerMaxScan)
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return fmt.Errorf("poller: error reading dir %q: %w", o.dir, err)
		}
		o.scanEntries(ps, ents)
	}
	return fmt.Errorf("poller: %q has too many files", o.dir)
}

func (o *poller) scanEntries(ps *pollerState, ents []fs.DirEntry) {
	for _, ent := range ents {
		fi, err := ent.Info()
		if err != nil {
			continue
		}
		if fi.IsDir() {
			continue
		}
		if !isPathReloadable(ent.Name()) {
			continue
		}

		pf := newPollerFile(fi)
		ps.files[pf.name] = pf
	}
}
