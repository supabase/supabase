package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/api/apilimiter"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"

	"github.com/supabase/auth/internal/api/apierrors"
)

const (
	apiTestVersion = "1"
	apiTestConfig  = "../../hack/test.env"
)

func init() {
	crypto.PasswordHashCost = crypto.QuickHashCost
}

// setupAPIForTest creates a new API to run tests with.
// Using this function allows us to keep track of the database connection
// and cleaning up data between tests.
func setupAPIForTest(opts ...Option) (*API, *conf.GlobalConfiguration, error) {
	config, err := confload.LoadGlobal(apiTestConfig)
	if err != nil {
		return nil, nil, err
	}

	conn, err := test.SetupDBConnection(config)
	if err != nil {
		return nil, nil, err
	}

	return NewAPIWithVersion(config, conn, apiTestVersion, opts...), config, nil
}

func setupAPIForTestWithCallback(cb func(*conf.GlobalConfiguration, *storage.Connection)) (*API, *conf.GlobalConfiguration, error) {
	config, err := confload.LoadGlobal(apiTestConfig)
	if err != nil {
		return nil, nil, err
	}

	if cb != nil {
		cb(config, nil)
	}

	conn, err := test.SetupDBConnection(config)
	if err != nil {
		return nil, nil, err
	}

	if cb != nil {
		cb(nil, conn)
	}

	limiterOpts := apilimiter.New(config)
	return NewAPIWithVersion(config, conn, apiTestVersion, WithLimiter(limiterOpts)), config, nil
}

func TestEmailEnabledByDefault(t *testing.T) {
	api, _, err := setupAPIForTest()
	require.NoError(t, err)

	require.True(t, api.config.External.Email.Enabled)
}

func TestOAuthServerDisabledByDefault(t *testing.T) {
	api, _, err := setupAPIForTest()
	require.NoError(t, err)

	// OAuth server should be disabled by default
	require.False(t, api.config.OAuthServer.Enabled)

	// OAuth server instance should not be initialized when disabled
	require.Nil(t, api.oauthServer)
}

func TestDisabledFeatureReturnsJSON(t *testing.T) {
	cases := []struct {
		name      string
		method    string
		path      string
		errorCode string
		setup     func(*conf.GlobalConfiguration)
	}{
		{
			name:      "OAuthServer disabled returns JSON on /oauth/token",
			method:    http.MethodPost,
			path:      "http://localhost/oauth/token",
			errorCode: apierrors.ErrorCodeFeatureDisabled,
			setup: func(c *conf.GlobalConfiguration) {
				c.OAuthServer.Enabled = false
			},
		},
		{
			name:      "OAuthServer disabled returns JSON on /oauth/clients/register",
			method:    http.MethodPost,
			path:      "http://localhost/oauth/clients/register",
			errorCode: apierrors.ErrorCodeFeatureDisabled,
			setup: func(c *conf.GlobalConfiguration) {
				c.OAuthServer.Enabled = false
			},
		},
		{
			name:      "OAuthServer disabled returns JSON on /.well-known/oauth-authorization-server",
			method:    http.MethodGet,
			path:      "http://localhost/.well-known/oauth-authorization-server",
			errorCode: apierrors.ErrorCodeFeatureDisabled,
			setup: func(c *conf.GlobalConfiguration) {
				c.OAuthServer.Enabled = false
			},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			api, _, err := setupAPIForTestWithCallback(func(config *conf.GlobalConfiguration, conn *storage.Connection) {
				if config != nil {
					tc.setup(config)
				}
			})
			require.NoError(t, err)

			req := httptest.NewRequest(tc.method, tc.path, nil)
			w := httptest.NewRecorder()
			api.handler.ServeHTTP(w, req)

			require.Equal(t, http.StatusNotFound, w.Code)
			require.Contains(t, w.Header().Get("Content-Type"), "application/json")

			var body map[string]interface{}
			require.NoError(t, json.NewDecoder(w.Body).Decode(&body))
			require.Equal(t, tc.errorCode, body["error_code"])
		})
	}
}

func TestOAuthServerCanBeEnabled(t *testing.T) {
	api, _, err := setupAPIForTestWithCallback(func(config *conf.GlobalConfiguration, conn *storage.Connection) {
		if config != nil {
			// Enable OAuth server
			config.OAuthServer.Enabled = true
		}
	})
	require.NoError(t, err)

	// OAuth server should be enabled
	require.True(t, api.config.OAuthServer.Enabled)

	// OAuth server instance should be initialized when enabled
	require.NotNil(t, api.oauthServer)
}
