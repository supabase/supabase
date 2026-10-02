package api

import (
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/conf"
)

func TestJwks(t *testing.T) {
	// generate RSA key pair for testing
	rsaPrivateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)
	rsaJwkPrivate, err := jwk.FromRaw(rsaPrivateKey)
	require.NoError(t, err)
	rsaJwkPublic, err := rsaJwkPrivate.PublicKey()
	require.NoError(t, err)
	kid := rsaJwkPublic.KeyID()

	cases := []struct {
		desc        string
		config      conf.JWTConfiguration
		expectedLen int
	}{
		{
			desc: "hmac key should not be returned",
			config: conf.JWTConfiguration{
				Aud:    "authenticated",
				Secret: "test-secret",
			},
			expectedLen: 0,
		},
		{
			desc: "rsa public key returned",
			config: conf.JWTConfiguration{
				Aud:    "authenticated",
				Secret: "test-secret",
				Keys: conf.JwtKeysDecoder{
					kid: conf.JwkInfo{
						PublicKey:  rsaJwkPublic,
						PrivateKey: rsaJwkPrivate,
					},
				},
			},
			expectedLen: 1,
		},
	}

	for _, c := range cases {
		t.Run(c.desc, func(t *testing.T) {
			mockAPI, _, err := setupAPIForTest()
			require.NoError(t, err)
			mockAPI.config.JWT = c.config

			req := httptest.NewRequest(http.MethodGet, "/.well-known/jwks.json", nil)
			w := httptest.NewRecorder()
			mockAPI.handler.ServeHTTP(w, req)
			require.Equal(t, http.StatusOK, w.Code)

			var data map[string]interface{}
			require.NoError(t, json.NewDecoder(w.Body).Decode(&data))
			require.Len(t, data["keys"], c.expectedLen)

			for _, key := range data["keys"].([]interface{}) {
				bytes, err := json.Marshal(key)
				require.NoError(t, err)
				actualKey, err := jwk.ParseKey(bytes)
				require.NoError(t, err)
				require.Equal(t, c.config.Keys[kid].PublicKey, actualKey)
			}
		})
	}
}
