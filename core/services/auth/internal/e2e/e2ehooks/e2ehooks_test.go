package e2ehooks

import (
	"context"
	"errors"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/iotest"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/hooks/v0hooks"
)

func TestInstance(t *testing.T) {
	{
		globalCfg, err := confload.LoadGlobal("../../../hack/test.env")
		require.NoError(t, err)

		globalCfg.DB.Driver = ""
		globalCfg.DB.URL = "invalid"

		inst, err := New(globalCfg)
		require.Error(t, err)
		require.Nil(t, inst)
	}

	{
		globalCfg, err := confload.LoadGlobal("../../../hack/test.env")
		require.NoError(t, err)

		inst, err := New(globalCfg)
		require.NoError(t, err)
		require.NotNil(t, inst)
		require.NoError(t, inst.Close())
	}
}

func TestHook(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	hook := NewHook(v0hooks.AfterUserCreated)

	{
		calls := hook.GetCalls()
		require.Equal(t, 0, len(calls))

		u := "http://localhost"
		rdr := strings.NewReader("12345")
		req := httptest.NewRequestWithContext(ctx, "POST", u, rdr)
		res := httptest.NewRecorder()

		hook.ServeHTTP(res, req)

		calls = hook.GetCalls()
		require.Equal(t, 1, len(calls))
		call := calls[0]

		var got int
		err := call.Unmarshal(&got)
		require.NoError(t, err)
		require.Equal(t, 12345, got)
	}

	{
		u := "http://localhost/hooks/before-user-created"
		sentinel := errors.New("sentinel")
		rdr := iotest.ErrReader(sentinel)
		req := httptest.NewRequestWithContext(ctx, "POST", u, rdr)
		res := httptest.NewRecorder()

		hook.ServeHTTP(res, req)
	}
}

func TestHookRecorder(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	hookRec := NewHookRecorder()
	tests := []struct {
		name v0hooks.Name
		hook *Hook
	}{
		{
			name: v0hooks.BeforeUserCreated,
			hook: hookRec.BeforeUserCreated,
		},
		{
			name: v0hooks.AfterUserCreated,
			hook: hookRec.AfterUserCreated,
		},
		{
			name: v0hooks.CustomizeAccessToken,
			hook: hookRec.CustomizeAccessToken,
		},
		{
			name: v0hooks.MFAVerification,
			hook: hookRec.MFAVerification,
		},
		{
			name: v0hooks.PasswordVerification,
			hook: hookRec.PasswordVerification,
		},
		{
			name: v0hooks.SendEmail,
			hook: hookRec.SendEmail,
		},
		{
			name: v0hooks.SendSMS,
			hook: hookRec.SendSMS,
		},
	}

	for _, test := range tests {

		{
			calls := test.hook.GetCalls()
			require.Equal(t, 0, len(calls))
		}

		u := "http://localhost/hooks/" + string(test.name)
		rdr := strings.NewReader("12345")
		req := httptest.NewRequestWithContext(ctx, "POST", u, rdr)
		res := httptest.NewRecorder()
		hookRec.ServeHTTP(res, req)

		{
			calls := test.hook.GetCalls()
			require.Equal(t, 1, len(calls))
			call := calls[0]

			test.hook.ClearCalls()
			require.Equal(t, 0, len(test.hook.GetCalls()))

			var got int
			err := call.Unmarshal(&got)
			require.NoError(t, err)
			require.Equal(t, 12345, got)
		}
	}

	// not found
	{
		u := "http://localhost/hooks/__invalid-hook-name__"
		rdr := strings.NewReader("12345")
		req := httptest.NewRequestWithContext(ctx, "POST", u, rdr)
		res := httptest.NewRecorder()
		hookRec.ServeHTTP(res, req)

		require.Equal(t, 404, res.Result().StatusCode)
	}
}
