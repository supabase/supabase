package provider

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestClaimsUpdatedAt_Unmarshal(t *testing.T) {
	t.Run("numeric date seconds", func(t *testing.T) {
		var c Claims
		require.NoError(t, json.Unmarshal([]byte(`{"updated_at": 1700000000}`), &c))
		require.NotNil(t, c.UpdatedAt)
		require.Equal(t, int64(1700000000), time.Time(*c.UpdatedAt).Unix())
	})

	t.Run("rfc3339 string", func(t *testing.T) {
		var c Claims
		require.NoError(t, json.Unmarshal([]byte(`{"updated_at": "2024-01-02T03:04:05Z"}`), &c))
		require.NotNil(t, c.UpdatedAt)
		require.Equal(t, int64(1704164645), time.Time(*c.UpdatedAt).Unix())
	})
}

func TestClaimsUpdatedAt_Marshal(t *testing.T) {
	t.Run("marshals as RFC3339 string", func(t *testing.T) {
		ts := time.Date(2024, 1, 2, 3, 4, 5, 0, time.UTC)
		v := UnixTimeOrString(ts)
		c := Claims{UpdatedAt: &v}

		b, err := json.Marshal(c)
		require.NoError(t, err)
		require.Contains(t, string(b), `"updated_at":"2024-01-02T03:04:05Z"`)
	})

	t.Run("roundtrips through unmarshal and marshal", func(t *testing.T) {
		var c Claims
		require.NoError(t, json.Unmarshal([]byte(`{"updated_at": 1700000000}`), &c))

		b, err := json.Marshal(c)
		require.NoError(t, err)
		require.Contains(t, string(b), `"updated_at":"2023-11-14T22:13:20Z"`)
		require.NotContains(t, string(b), `"updated_at":{}`)
	})
}
