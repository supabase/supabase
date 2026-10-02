package e2e

import (
	"errors"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/e2e/e2ecfg"
)

func TestUtils(t *testing.T) {

	// check paths
	require.Equal(t, projectRoot, e2ecfg.GetProjectRoot())
	require.Equal(t, configPath, e2ecfg.GetConfigPath())

	// Config
	func() {

		// positive
		{
			testCfgPath := "../../hack/test.env"
			testCfg := Must(confload.LoadGlobal(testCfgPath))
			// SigningKey is a func
			testCfg.JWT.SigningKey = nil

			globalCfg := Must(Config())
			globalCfg.JWT.SigningKey = nil
			require.Equal(t, testCfg, globalCfg)

		}

		// negative
		{
			restore := configPath
			defer func() {
				configPath = restore
			}()
			configPath = "abc"

			globalCfg, err := Config()
			require.Error(t, err)
			require.Nil(t, globalCfg)
		}
	}()

	// Conn
	func() {
		// positive
		{
			globalCfg := Must(Config())
			conn := Must(Conn(globalCfg))
			require.NotNil(t, conn)
		}

		// negative
		{
			globalCfg := Must(Config())
			globalCfg.DB.Driver = ""
			globalCfg.DB.URL = "invalid"
			conn, err := Conn(globalCfg)
			require.Error(t, err)
			require.Nil(t, conn)
		}

	}()

	// Must
	func() {
		restore := configPath
		defer func() {
			configPath = restore
		}()
		configPath = "abc"

		var err error
		func() {
			defer func() {
				err = recover().(error)
			}()

			globalCfg := Must(Config())
			if globalCfg != nil {
				panic(errors.New("globalCfg != nil"))
			}
		}()
		require.Error(t, err)
	}()
}
