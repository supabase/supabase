// Package confload provides configuration loading for the auth server.
package confload

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"maps"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/conf"
)

type Option interface {
	apply(*Loader)
}

type optionFunc func(*Loader)

func (f optionFunc) apply(a *Loader) { f(a) }

func withSystem(sys system) Option {
	return optionFunc(func(a *Loader) { a.sys = sys })
}

type Loader struct {
	mu  sync.Mutex
	sys system
}

func NewLoader(opt ...Option) *Loader {
	ldr := &Loader{
		sys: &osSystem{},
	}
	for _, o := range opt {
		o.apply(ldr)
	}
	return ldr
}

func (o *Loader) Startup(file, dir string) (*conf.GlobalConfiguration, error) {
	o.mu.Lock()
	defer o.mu.Unlock()

	cfgMap := make(map[string]string)
	if err := o.startup(cfgMap, file, dir); err != nil {
		return nil, fmt.Errorf("confload.Startup: %w", err)
	}

	cfg := new(conf.GlobalConfiguration)
	if err := loadGlobal(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}

func (o *Loader) startup(cfgMap map[string]string, file, dir string) error {
	o.loadEnv(cfgMap, o.sys.Environ())
	if err := o.loadFile(cfgMap, file); err != nil {
		return err
	}
	if err := o.loadDir(cfgMap, dir); err != nil {
		// Match current startup behavior and only log an error.
		logrus.WithError(err).Error("unable to load config from watch dir")
	}
	if err := o.applyCfg(cfgMap); err != nil {
		return err
	}
	return nil
}

func (o *Loader) Reload(dir string) (*conf.GlobalConfiguration, error) {
	o.mu.Lock()
	defer o.mu.Unlock()

	cfgMap := make(map[string]string)
	if err := o.reload(cfgMap, dir); err != nil {
		return nil, fmt.Errorf("confload.Reload: %w", err)
	}

	cfg := new(conf.GlobalConfiguration)
	if err := loadGlobal(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}

func (o *Loader) reload(cfgMap map[string]string, dir string) error {
	if err := o.loadDir(cfgMap, dir); err != nil {
		return err
	}
	if err := o.applyCfg(cfgMap); err != nil {
		return err
	}
	return nil
}

func (o *Loader) loadEnv(dst map[string]string, envs []string) {
	for _, line := range envs {
		k, v, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		dst[k] = v
	}
}

func (o *Loader) loadFile(dst map[string]string, file string) error {
	// If a cfg file is set we read the file and copy directly into dst
	if file != "" {
		return o.readFile(file, dst)
	}

	// Otherwise we need to mimic the current behavior of godotenv and
	// look for a .env file.
	//
	// TODO(cstockton): I would prefer to remove the .env loading without some
	// explicit devmode / local flag, or a way to disable via an option passed
	// from the CLI.
	buf := make(map[string]string)
	if err := o.readFile(".env", buf); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil // current behavior is to ignore errors loading .env
		}
		return err
	}

	o.merge(dst, buf, false)
	return nil
}

func (o *Loader) merge(dst, src map[string]string, override bool) {
	if override {
		maps.Copy(dst, src)
		return
	}
	for k, v := range src {
		if _, ok := dst[k]; !ok {
			dst[k] = v
		}
	}
}

func (o *Loader) applyCfg(cfgMap map[string]string) error {
	if len(cfgMap) == 0 {
		return nil
	}

	// We spare some cycles to call os.Setenv in a deterministic sequence.
	//
	// TODO(cstockton): This could be removed since I'm ignoring errors.
	for _, key := range slices.Sorted(maps.Keys(cfgMap)) {
		val := cfgMap[key]

		// I intentionally ignore the error here because godotenv ignores
		// errors returned by os.Setenv.
		//
		// Currently the only cases os.Setenv fails is if key is empty or
		// contains an '='. Eventually these should be blocked in a key
		// filtering phase, idealy only a strict set of keys would be
		// permitted in calls to os.Setenv at all.
		//
		// If a config value that is crucial to the startup sequence fails
		// os.Setenv we should aim to catch that in config.Validate()
		_ = o.sys.Setenv(key, val)
	}
	return nil
}

func (o *Loader) loadDir(dst map[string]string, dir string) error {
	paths, err := o.getPaths(dir)
	if err != nil {
		return fmt.Errorf("LoadDir: %w", err)
	}
	if len(paths) == 0 {
		return nil
	}

	buf := make(map[string]string)
	for _, p := range paths {
		clear(buf)

		// Matches godotenv.Overload
		if err := o.readFile(p, buf); err != nil {
			return fmt.Errorf("LoadDir: %w", err)
		}
		o.merge(dst, buf, true)
	}
	return nil
}

func (o *Loader) getPaths(dir string) ([]string, error) {
	if dir == "" {
		return nil, nil
	}

	// Returns entries sorted by filename
	ents, err := o.sys.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	// Remove directories and non .json and .env files
	ents = slices.DeleteFunc(ents, func(ent fs.DirEntry) bool {
		if ent.IsDir() {
			return true
		}
		ext := filepath.Ext(ent.Name())
		return ext != ".env" && ext != ".json"
	})

	var paths []string
	for i := 0; i < len(ents); i++ {
		cur := ents[i].Name()
		switch filepath.Ext(cur) {
		default:
			// ignore
		case ".env":
			if i+1 < len(ents) {
				base := cur[:len(cur)-4]
				next := ents[i+1].Name()
				if filepath.Ext(next) == ".json" && next[:len(next)-5] == base {
					// ents[i+0]=base.env
					// ents[i+1]=base.json
					i++
					paths = append(paths, filepath.Join(dir, next))
					break
				}
				// ents[i+0]=base.env
				// ents[i+1]=???
			}
			fallthrough
		case ".json":
			paths = append(paths, filepath.Join(dir, cur))
		}
	}
	return paths, nil
}

func (o *Loader) readFile(name string, dst map[string]string) error {
	f, err := o.sys.Open(name)
	if err != nil {
		return fmt.Errorf("ReadFile: %w", err)
	}
	defer f.Close()

	switch filepath.Ext(name) {
	case ".json":
		return o.readJSON(f, dst)
	default:
		return o.readDotenv(f, dst)
	}
}

func (o *Loader) readJSON(r io.Reader, dst map[string]string) error {
	data, err := io.ReadAll(r)
	if err != nil {
		return fmt.Errorf("ReadJSON: %w", err)
	}
	if err := json.Unmarshal(data, &dst); err != nil {
		return fmt.Errorf("ReadJSON: %w", err)
	}
	return nil
}

func (o *Loader) readDotenv(r io.Reader, dst map[string]string) error {
	m, err := godotenv.Parse(r)
	if err != nil {
		return fmt.Errorf("ReadDotenv: %w", err)
	}
	maps.Copy(dst, m)
	return nil
}

type system interface {
	fs.ReadDirFS
	fs.ReadFileFS

	Environ() []string
	Setenv(key, value string) error
}

// osSystem implements the system interface by calling os functions.
type osSystem struct{}

func (*osSystem) Open(name string) (fs.File, error) {
	return os.Open(name) //#nosec G304
}

func (*osSystem) ReadDir(name string) ([]fs.DirEntry, error) {
	return os.ReadDir(name) //#nosec G304
}

func (*osSystem) ReadFile(name string) ([]byte, error) {
	return os.ReadFile(name) //#nosec G304
}

func (*osSystem) Environ() []string {
	return os.Environ()
}

func (*osSystem) Setenv(key, value string) error {
	return os.Setenv(key, value)
}
