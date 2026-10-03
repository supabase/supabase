package e2ecfg

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestConfigPath(t *testing.T) {

	// check paths
	require.Equal(t, projectRoot, GetProjectRoot())
	require.Equal(t, configPath, GetConfigPath())

	// block init from main()
	func() {
		restore := isTesting
		defer func() {
			isTesting = restore
		}()
		isTesting = func() bool { return false }

		var errStr string
		func() {
			defer func() {
				errStr = recover().(string)
			}()

			initPackage()
		}()

		exp := "package e2e may not be used in a main package"
		require.Equal(t, exp, errStr)
	}()
}
