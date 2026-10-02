// Package confload provides configuration loading.
package confload

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
	"github.com/supabase/auth/internal/conf"
)

// LoadFile calls godotenv.Load() when the given filename is empty ignoring any
// errors loading, otherwise it calls godotenv.Overload(filename).
//
// godotenv.Load: preserves env, ".env" path is optional
// godotenv.Overload: overrides env, "filename" path must exist
func LoadFile(filename string) error {
	var err error
	if filename != "" {
		err = godotenv.Overload(filename)
	} else {
		err = godotenv.Load()
		// handle if .env file does not exist, this is OK
		if os.IsNotExist(err) {
			return nil
		}
	}
	return err
}

// LoadDirectory does nothing when configDir is empty, otherwise it will attempt
// to load a list of configuration files located in configDir by using ReadDir
// to obtain a sorted list of files containing a .env suffix.
//
// When the list is empty it will do nothing, otherwise it passes the file list
// to godotenv.Overload to pull them into the current environment.
func LoadDirectory(configDir string) error {
	if configDir == "" {
		return nil
	}

	// Returns entries sorted by filename
	ents, err := os.ReadDir(configDir)
	if err != nil {
		// We mimic the behavior of LoadGlobal here, if an explicit path is
		// provided we return an error.
		return err
	}

	var paths []string
	for _, ent := range ents {
		if ent.IsDir() {
			continue // ignore directories
		}

		// We only read files ending in .env
		name := ent.Name()
		if !strings.HasSuffix(name, ".env") {
			continue
		}

		// ent.Name() does not include the watch dir.
		paths = append(paths, filepath.Join(configDir, name))
	}

	// If at least one path was found we load the configuration files in the
	// directory. We don't call override without config files because it will
	// override the env vars previously set with a ".env", if one exists.
	return loadDirectoryPaths(paths...)
}

func loadDirectoryPaths(p ...string) error {
	// If at least one path was found we load the configuration files in the
	// directory. We don't call override without config files because it will
	// override the env vars previously set with a ".env", if one exists.
	if len(p) > 0 {
		if err := godotenv.Overload(p...); err != nil {
			return err
		}
	}
	return nil
}

// LoadGlobalFromEnv will return a new *GlobalConfiguration value from the
// currently configured environment.
func LoadGlobalFromEnv() (*conf.GlobalConfiguration, error) {
	config := new(conf.GlobalConfiguration)
	if err := loadGlobal(config); err != nil {
		return nil, err
	}
	return config, nil
}

func LoadGlobal(filename string) (*conf.GlobalConfiguration, error) {
	if err := loadEnvironment(filename); err != nil {
		return nil, err
	}

	config := new(conf.GlobalConfiguration)
	if err := loadGlobal(config); err != nil {
		return nil, err
	}
	return config, nil
}

func loadGlobal(config *conf.GlobalConfiguration) error {
	// although the package is called "auth" it used to be called "gotrue"
	// so environment configs will remain to be called "GOTRUE"
	if err := envconfig.Process("gotrue", config); err != nil {
		return err
	}

	if err := config.ApplyDefaults(); err != nil {
		return err
	}

	if err := config.Validate(); err != nil {
		return err
	}
	return config.PopulateGlobal()
}

func loadEnvironment(filename string) error {
	var err error
	if filename != "" {
		err = godotenv.Overload(filename)
	} else {
		err = godotenv.Load()
		// handle if .env file does not exist, this is OK
		if os.IsNotExist(err) {
			return nil
		}
	}
	return err
}
