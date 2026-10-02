package provider

import (
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"
)

// captureAllowedClaims is the single helper shared by all three capture paths.
func TestCaptureAllowedClaims(t *testing.T) {
	// A representative raw claim map: standard claims, custom claims, and
	// protocol/registered claims that must never leak unless explicitly listed.
	raw := map[string]interface{}{
		"sub":       "user-123",
		"email":     "test@example.com",
		"groups":    []interface{}{"admins", "devs"},
		"org_id":    "org-42",
		"tenant_id": "tenant-7",
		"nbf":       float64(1700000000),
		"nonce":     "abc",
		"c_hash":    "xyz",
		"at_hash":   "qrs",
		"sid":       "session-1",
	}

	t.Run("captures only allowlisted keys", func(t *testing.T) {
		c := &Claims{}
		captureAllowedClaims(raw, []string{"groups", "org_id"}, c)

		require.NotNil(t, c.CustomClaims)
		assert.Len(t, c.CustomClaims, 2)
		assert.Equal(t, []interface{}{"admins", "devs"}, c.CustomClaims["groups"])
		assert.Equal(t, "org-42", c.CustomClaims["org_id"])
		// Not listed → absent.
		assert.NotContains(t, c.CustomClaims, "tenant_id")
	})

	t.Run("protocol/registered claims never leak when not listed", func(t *testing.T) {
		c := &Claims{}
		captureAllowedClaims(raw, []string{"groups"}, c)

		for _, protocolKey := range []string{"nbf", "nonce", "c_hash", "at_hash", "sid"} {
			assert.NotContains(t, c.CustomClaims, protocolKey)
		}
	})

	t.Run("empty allowlist captures nothing", func(t *testing.T) {
		c := &Claims{}
		captureAllowedClaims(raw, nil, c)
		assert.Nil(t, c.CustomClaims)

		captureAllowedClaims(raw, []string{}, c)
		assert.Nil(t, c.CustomClaims)
	})

	t.Run("allowlisted key absent from response is skipped", func(t *testing.T) {
		c := &Claims{}
		captureAllowedClaims(raw, []string{"groups", "not_present"}, c)

		assert.Contains(t, c.CustomClaims, "groups")
		// No nil entry created for the missing key.
		assert.NotContains(t, c.CustomClaims, "not_present")
		assert.Len(t, c.CustomClaims, 1)
	})

	t.Run("azure-style stripped keys are not re-added", func(t *testing.T) {
		// Simulates the Azure path where the parser intentionally strips some
		// keys: an allowlist that omits them must not bring them back.
		azureRaw := map[string]interface{}{
			"sub":      "azure-user",
			"email":    "user@example.com",
			"groups":   []interface{}{"team-a"},
			"aio":      "stripped-azure-internal",
			"xms_edov": "1",
			"nonce":    "n-1",
		}
		c := &Claims{}
		captureAllowedClaims(azureRaw, []string{"groups"}, c)

		assert.Equal(t, []interface{}{"team-a"}, c.CustomClaims["groups"])
		assert.NotContains(t, c.CustomClaims, "aio")
		assert.NotContains(t, c.CustomClaims, "xms_edov")
		assert.NotContains(t, c.CustomClaims, "nonce")
	})
}

func TestCustomOAuthProvider_GetUserData_CustomClaimsAllowlist(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"sub":            "user-123",
			"email":          "test@example.com",
			"email_verified": true,
			"groups":         []interface{}{"admins"},
			"org_id":         "org-42",
			"tenant_id":      "tenant-7", // not allowlisted
			"nonce":          "should-not-leak",
		})
	}))
	defer server.Close()

	provider := NewCustomOAuthProvider(
		"client-id", "client-secret",
		"https://example.com/authorize", "https://example.com/token",
		server.URL, "https://myapp.com/callback",
		[]string{"openid"}, false,
		nil, nil, nil,
		[]string{"groups", "org_id"},
	)

	userData, err := provider.GetUserData(context.Background(), &oauth2.Token{AccessToken: "t", TokenType: "Bearer"})
	require.NoError(t, err)
	require.NotNil(t, userData.Metadata)

	require.NotNil(t, userData.Metadata.CustomClaims)
	assert.Equal(t, []interface{}{"admins"}, userData.Metadata.CustomClaims["groups"])
	assert.Equal(t, "org-42", userData.Metadata.CustomClaims["org_id"])
	assert.NotContains(t, userData.Metadata.CustomClaims, "tenant_id")
	assert.NotContains(t, userData.Metadata.CustomClaims, "nonce")
	// Standard claims still parsed.
	assert.Equal(t, "test@example.com", userData.Metadata.Email)
}

func TestCustomOAuthProvider_GetUserData_EmptyAllowlist(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"sub":    "user-123",
			"email":  "test@example.com",
			"groups": []interface{}{"admins"},
		})
	}))
	defer server.Close()

	provider := NewCustomOAuthProvider(
		"client-id", "client-secret",
		"https://example.com/authorize", "https://example.com/token",
		server.URL, "https://myapp.com/callback",
		[]string{"openid"}, false,
		nil, nil, nil,
		nil, // empty allowlist
	)

	userData, err := provider.GetUserData(context.Background(), &oauth2.Token{AccessToken: "t", TokenType: "Bearer"})
	require.NoError(t, err)
	require.NotNil(t, userData.Metadata)
	assert.Nil(t, userData.Metadata.CustomClaims)
}

func TestCustomOIDCProvider_GetUserData_UserinfoAllowlist(t *testing.T) {
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/.well-known/openid-configuration":
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"issuer":                 server.URL,
				"authorization_endpoint": server.URL + "/authorize",
				"token_endpoint":         server.URL + "/token",
				"userinfo_endpoint":      server.URL + "/userinfo",
				"jwks_uri":               server.URL + "/jwks",
			})
		case "/jwks":
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{"keys": []interface{}{}})
		case "/userinfo":
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"sub":       "user-123",
				"email":     "test@example.com",
				"mail":      "alt@example.com",
				"sn":        "Doe",
				"tenant_id": "tenant-7", // not allowlisted
			})
		}
	}))
	defer server.Close()

	provider, err := NewCustomOIDCProvider(
		context.Background(),
		"client-id", "client-secret", "https://myapp.com/callback",
		[]string{"openid"}, server.URL, server.URL+"/.well-known/openid-configuration", false,
		nil, nil, nil,
		[]string{"mail", "sn"},
		newTestOIDCProviderCache(t, 0),
	)
	require.NoError(t, err)

	// Token with no id_token → falls through to userinfo endpoint.
	userData, err := provider.GetUserData(context.Background(), &oauth2.Token{AccessToken: "t", TokenType: "Bearer"})
	require.NoError(t, err)
	require.NotNil(t, userData.Metadata)

	require.NotNil(t, userData.Metadata.CustomClaims)
	assert.Equal(t, "alt@example.com", userData.Metadata.CustomClaims["mail"])
	assert.Equal(t, "Doe", userData.Metadata.CustomClaims["sn"])
	assert.NotContains(t, userData.Metadata.CustomClaims, "tenant_id")
}

func TestCustomOIDCProvider_GetUserData_IDTokenAllowlist(t *testing.T) {
	defer func() {
		OverrideVerifiers = make(map[string]func(context.Context, *oidc.Config) *oidc.IDTokenVerifier)
		OverrideClock = nil
	}()

	key, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)

	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/.well-known/openid-configuration":
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"issuer":                 server.URL,
				"authorization_endpoint": server.URL + "/authorize",
				"token_endpoint":         server.URL + "/token",
				"jwks_uri":               server.URL + "/jwks",
			})
		case "/jwks":
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{"keys": []interface{}{}})
		}
	}))
	defer server.Close()

	issuedAt := time.Unix(1700000000, 0)
	claims := jwt.MapClaims{
		"iss":       server.URL,
		"aud":       "client-id",
		"sub":       "user-123",
		"email":     "test@example.com",
		"groups":    []string{"admins", "devs"},
		"org_id":    "org-42",
		"iat":       issuedAt.Unix(),
		"exp":       issuedAt.Add(time.Hour).Unix(),
		"nbf":       issuedAt.Unix(),   // protocol claim, not allowlisted
		"nonce":     "should-not-leak", // protocol claim, not allowlisted
		"c_hash":    "should-not-leak", // protocol claim, not allowlisted
		"tenant_id": "tenant-7",        // not allowlisted
	}
	tokenString, err := jwt.NewWithClaims(jwt.SigningMethodRS256, claims).SignedString(key)
	require.NoError(t, err)

	provider, err := NewCustomOIDCProvider(
		context.Background(),
		"client-id", "client-secret", "https://myapp.com/callback",
		[]string{"openid"}, server.URL, server.URL+"/.well-known/openid-configuration", false,
		nil, nil, nil,
		[]string{"groups", "org_id"},
		newTestOIDCProviderCache(t, 0),
	)
	require.NoError(t, err)

	// Override the verifier to trust our in-test signing key, and freeze the clock.
	OverrideVerifiers[server.URL+"/authorize"] = func(ctx context.Context, config *oidc.Config) *oidc.IDTokenVerifier {
		return oidc.NewVerifier(server.URL, &oidc.StaticKeySet{
			PublicKeys: []crypto.PublicKey{&key.PublicKey},
		}, config)
	}
	OverrideClock = func() time.Time { return issuedAt.Add(time.Second) }

	tok := (&oauth2.Token{AccessToken: "t", TokenType: "Bearer"}).WithExtra(map[string]interface{}{
		"id_token": tokenString,
	})

	userData, err := provider.GetUserData(context.Background(), tok)
	require.NoError(t, err)
	require.NotNil(t, userData.Metadata)

	require.NotNil(t, userData.Metadata.CustomClaims)
	assert.ElementsMatch(t, []interface{}{"admins", "devs"}, userData.Metadata.CustomClaims["groups"])
	assert.Equal(t, "org-42", userData.Metadata.CustomClaims["org_id"])
	// Protocol claims and non-listed keys must not be re-added.
	for _, k := range []string{"nbf", "nonce", "c_hash", "tenant_id"} {
		assert.NotContains(t, userData.Metadata.CustomClaims, k)
	}
}
