// Package e2ecfg provides config paths values with no internal dependencies.
package e2ecfg

import (
	"path/filepath"
	"runtime"
	"testing"
)

var (
	projectRoot string
	configPath  string
)

var isTesting func() bool = testing.Testing

func init() {
	initPackage()
}

func initPackage() {
	if isTesting() {
		_, thisFile, _, _ := runtime.Caller(0)
		projectRoot = filepath.Join(filepath.Dir(thisFile), "../../..")
		configPath = filepath.Join(GetProjectRoot(), "hack", "test.env")
	} else {
		panic("package e2e may not be used in a main package")
	}
}

// GetProjectRoot returns the path to the root of the project. This may be used
// to locate files without needing the relative path from a given test.
func GetProjectRoot() string {
	return projectRoot
}

// GetConfigPath returns the path for the "/hack/test.env" config file.
func GetConfigPath() string {
	return configPath
}
