// Package e2e provides a few utilities for use in unit tests.
package e2e

import (
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/e2e/e2ecfg"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
)

var (
	projectRoot = e2ecfg.GetProjectRoot()
	configPath  = e2ecfg.GetConfigPath()
)

// Config calls confload.LoadGlobal using GetConfigPath().
func Config() (*conf.GlobalConfiguration, error) {
	globalCfg, err := confload.LoadGlobal(configPath)
	if err != nil {
		return nil, err
	}
	return globalCfg, nil
}

// Conn returns a connection for the given config.
func Conn(globalCfg *conf.GlobalConfiguration) (*storage.Connection, error) {
	conn, err := test.SetupDBConnection(globalCfg)
	if err != nil {
		return nil, err
	}
	return conn, nil
}

// Must may be used by Config and Conn, i.e.:
//
//	cfg := e2e.Must(e2e.Config())
//	conn := e2e.Must(e2e.Conn(cfg))
func Must[T any](res T, err error) T {
	if err != nil {
		panic(err)
	}
	return res
}
