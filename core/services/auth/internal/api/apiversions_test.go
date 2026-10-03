package api

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestDetermineClosestAPIVersion(t *testing.T) {
	version, err := DetermineClosestAPIVersion("")
	require.NoError(t, err)
	require.Equal(t, APIVersionInitial, version)

	version, err = DetermineClosestAPIVersion("Not a date")
	require.Error(t, err)
	require.Equal(t, APIVersionInitial, version)

	version, err = DetermineClosestAPIVersion("2023-12-31")
	require.NoError(t, err)
	require.Equal(t, APIVersionInitial, version)

	version, err = DetermineClosestAPIVersion("2024-01-01")
	require.NoError(t, err)
	require.Equal(t, APIVersion20240101, version)

	version, err = DetermineClosestAPIVersion("2024-01-02")
	require.NoError(t, err)
	require.Equal(t, APIVersion20240101, version)
}
