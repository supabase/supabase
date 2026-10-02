package provider

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"
)

func TestNewCustomOAuthProvider(t *testing.T) {
	provider := NewCustomOAuthProvider(
		"test-client-id",
		"test-client-secret",
		"https://example.com/authorize",
		"https://example.com/token",
		"https://example.com/userinfo",
		"https://myapp.com/callback",
		[]string{"openid", "profile"},
		true, // PKCE enabled
		[]string{"ios-client-id", "android-client-id"},
		map[string]interface{}{
			"email": "user_email",
		},
		map[string]interface{}{
			"prompt": "consent",
		},
		nil,
	)

	assert.NotNil(t, provider)
	assert.Equal(t, "test-client-id", provider.config.ClientID)
	assert.Equal(t, "test-client-secret", provider.config.ClientSecret)
	assert.Equal(t, "https://myapp.com/callback", provider.config.RedirectURL)
	assert.Equal(t, []string{"openid", "profile"}, provider.config.Scopes)
	assert.Equal(t, "https://example.com/authorize", provider.config.Endpoint.AuthURL)
	assert.Equal(t, "https://example.com/token", provider.config.Endpoint.TokenURL)
	assert.Equal(t, "https://example.com/userinfo", provider.userinfoURL)
	assert.True(t, provider.RequiresPKCE())
	assert.Equal(t, []string{"ios-client-id", "android-client-id"}, provider.acceptableClientIDs)
	assert.Equal(t, "user_email", provider.attributeMapping["email"])
	assert.Equal(t, "consent", provider.authorizationParams["prompt"])
}

func TestCustomOAuthProvider_AuthCodeURL(t *testing.T) {
	t.Run("Auth URL with authorization params", func(t *testing.T) {
		provider := NewCustomOAuthProvider(
			"client-id",
			"client-secret",
			"https://example.com/authorize",
			"https://example.com/token",
			"https://example.com/userinfo",
			"https://myapp.com/callback",
			[]string{"openid", "profile"},
			false,
			nil,
			nil,
			map[string]interface{}{
				"prompt":       "consent",
				"access_type":  "offline",
				"custom_param": "custom_value",
			},
			nil,
		)

		authURL := provider.AuthCodeURL("test-state")

		assert.Contains(t, authURL, "client_id=client-id")
		assert.Contains(t, authURL, "redirect_uri=https")
		assert.Contains(t, authURL, "response_type=code")
		assert.Contains(t, authURL, "state=test-state")
		assert.Contains(t, authURL, "prompt=consent")
		assert.Contains(t, authURL, "access_type=offline")
		assert.Contains(t, authURL, "custom_param=custom_value")
	})

}

func TestCustomOAuthProvider_GetUserData(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify bearer token
		authHeader := r.Header.Get("Authorization")
		if authHeader != "Bearer test-access-token" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"sub":            "user-123",
			"email":          "test@example.com",
			"email_verified": true,
			"name":           "Test User",
			"picture":        "https://example.com/avatar.jpg",
		})
	}))
	defer server.Close()

	provider := NewCustomOAuthProvider(
		"client-id",
		"client-secret",
		"https://example.com/authorize",
		"https://example.com/token",
		server.URL, // userinfo URL
		"https://myapp.com/callback",
		[]string{"openid", "profile", "email"},
		false,
		nil,
		nil,
		nil,
		nil,
	)

	token := &oauth2.Token{
		AccessToken: "test-access-token",
		TokenType:   "Bearer",
	}

	userData, err := provider.GetUserData(context.Background(), token)
	require.NoError(t, err)
	require.NotNil(t, userData)

	require.Len(t, userData.Emails, 1)
	assert.Equal(t, "test@example.com", userData.Emails[0].Email)
	assert.True(t, userData.Emails[0].Verified)
	assert.True(t, userData.Emails[0].Primary)
}

func TestCustomOAuthProvider_GetUserDataWithAttributeMapping(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"sub":            "user-123",
			"email":          "test@example.com",
			"email_verified": false, // Will be overridden by literal mapping
			"full_name":      "John Doe",
		})
	}))
	defer server.Close()

	provider := NewCustomOAuthProvider(
		"client-id",
		"client-secret",
		"https://example.com/authorize",
		"https://example.com/token",
		server.URL,
		"https://myapp.com/callback",
		[]string{"openid"},
		false,
		nil,
		map[string]interface{}{
			"email_verified": true,        // Override with literal boolean value
			"name":           "full_name", // Map full_name field to name
		},
		nil,
		nil,
	)

	token := &oauth2.Token{
		AccessToken: "test-access-token",
		TokenType:   "Bearer",
	}

	userData, err := provider.GetUserData(context.Background(), token)
	require.NoError(t, err)
	require.NotNil(t, userData)

	require.Len(t, userData.Emails, 1)
	assert.Equal(t, "test@example.com", userData.Emails[0].Email)
	assert.True(t, userData.Emails[0].Verified) // Should be true from literal mapping
}

func TestApplyAttributeMapping(t *testing.T) {
	tests := []struct {
		name     string
		claims   Claims
		mapping  map[string]interface{}
		expected Claims
	}{
		{
			name: "Map with literal non-string values",
			claims: Claims{
				Subject: "user-456",
				Email:   "test@example.com",
			},
			mapping: map[string]interface{}{
				"email_verified": true,                // Literal boolean value
				"iat":            float64(1234567890), // Literal number value
			},
			expected: Claims{
				Subject:       "user-456",
				Email:         "test@example.com",
				EmailVerified: true,
				Iat:           float64(1234567890),
			},
		},
		{
			name: "Map between existing fields",
			claims: Claims{
				Subject:   "user-123",
				Email:     "test@example.com",
				FullName:  "John Doe",
				AvatarURL: "https://example.com/avatar.jpg",
			},
			mapping: map[string]interface{}{
				"name":    "full_name",  // Map full_name -> name
				"picture": "avatar_url", // Map avatar_url -> picture
			},
			expected: Claims{
				Subject:   "user-123",
				Email:     "test@example.com",
				Name:      "John Doe",
				Picture:   "https://example.com/avatar.jpg",
				FullName:  "John Doe", // Original field still exists
				AvatarURL: "https://example.com/avatar.jpg",
			},
		},
		{
			name: "Empty mapping returns original claims",
			claims: Claims{
				Subject: "user-789",
				Email:   "unchanged@example.com",
			},
			mapping: map[string]interface{}{},
			expected: Claims{
				Subject: "user-789",
				Email:   "unchanged@example.com",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := applyAttributeMapping(tt.claims, tt.mapping)

			assert.Equal(t, tt.expected.Subject, result.Subject)
			assert.Equal(t, tt.expected.Email, result.Email)
			assert.Equal(t, tt.expected.EmailVerified, result.EmailVerified)
			assert.Equal(t, tt.expected.Name, result.Name)
			if tt.expected.Picture != "" {
				assert.Equal(t, tt.expected.Picture, result.Picture)
			}
		})
	}
}

func TestNewCustomOIDCProvider(t *testing.T) {
	// Mock OIDC provider server
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/.well-known/openid-configuration":
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"issuer":                 server.URL,
				"authorization_endpoint": server.URL + "/authorize",
				"token_endpoint":         server.URL + "/token",
				"userinfo_endpoint":      server.URL + "/userinfo",
				"jwks_uri":               server.URL + "/jwks",
			})
		case "/jwks":
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"keys": []interface{}{},
			})
		}
	}))
	defer server.Close()

	// Pass issuer URL directly - oidc.NewProvider will fetch discovery automatically
	provider, err := NewCustomOIDCProvider(
		context.Background(),
		"test-client-id",
		"test-client-secret",
		"https://myapp.com/callback",
		[]string{"profile", "email"}, // Without openid
		server.URL,                   // issuer
		server.URL+"/.well-known/openid-configuration",
		true, // PKCE enabled
		[]string{"ios-client", "android-client"},
		map[string]interface{}{"email": "user_email"},
		map[string]interface{}{"prompt": "consent"},
		nil,
		newTestOIDCProviderCache(t, 0),
	)

	require.NoError(t, err)
	require.NotNil(t, provider)

	// Verify openid scope was automatically added
	assert.Contains(t, provider.config.Scopes, "openid")
	assert.Contains(t, provider.config.Scopes, "profile")
	assert.Contains(t, provider.config.Scopes, "email")

	assert.True(t, provider.RequiresPKCE())
	assert.Equal(t, []string{"ios-client", "android-client"}, provider.acceptableClientIDs)
}

func TestCustomOIDCProvider_ValidateAudience(t *testing.T) {
	tests := []struct {
		name                string
		clientID            string
		acceptableClientIDs []string
		tokenAudiences      []string
		wantErr             bool
	}{
		{
			name:                "Valid single audience matches client ID",
			clientID:            "web-client-id",
			acceptableClientIDs: nil,
			tokenAudiences:      []string{"web-client-id"},
			wantErr:             false,
		},
		{
			name:                "Valid audience matches one of acceptable client IDs",
			clientID:            "web-client-id",
			acceptableClientIDs: []string{"ios-client-id", "android-client-id"},
			tokenAudiences:      []string{"ios-client-id"},
			wantErr:             false,
		},
		{
			name:                "Valid audience matches different acceptable client ID",
			clientID:            "web-client-id",
			acceptableClientIDs: []string{"ios-client-id", "android-client-id"},
			tokenAudiences:      []string{"android-client-id"},
			wantErr:             false,
		},
		{
			name:                "Valid multiple audiences, one matches",
			clientID:            "web-client-id",
			acceptableClientIDs: []string{"ios-client-id"},
			tokenAudiences:      []string{"web-client-id", "other-client-id"},
			wantErr:             false,
		},
		{
			name:                "Invalid - no matching audience",
			clientID:            "web-client-id",
			acceptableClientIDs: []string{"ios-client-id", "android-client-id"},
			tokenAudiences:      []string{"unknown-client-id"},
			wantErr:             true,
		},
		{
			name:                "Invalid - empty token audiences",
			clientID:            "web-client-id",
			acceptableClientIDs: []string{"ios-client-id"},
			tokenAudiences:      []string{},
			wantErr:             true,
		},
		{
			name:                "Valid - multiple acceptable client IDs, multi-platform scenario",
			clientID:            "web-client-id",
			acceptableClientIDs: []string{"com.myapp.ios", "com.myapp.android", "com.myapp.macos"},
			tokenAudiences:      []string{"com.myapp.ios"},
			wantErr:             false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a minimal OIDC provider for testing validateAudience
			provider := &CustomOIDCProvider{
				config: &oauth2.Config{
					ClientID: tt.clientID,
				},
				acceptableClientIDs: tt.acceptableClientIDs,
			}

			err := provider.validateAudience(tt.tokenAudiences)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), "does not match any acceptable client ID")
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestCustomOIDCProvider_AuthCodeURL(t *testing.T) {
	// Mock OIDC provider server
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/.well-known/openid-configuration":
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"issuer":                 server.URL,
				"authorization_endpoint": server.URL + "/authorize",
				"token_endpoint":         server.URL + "/token",
				"jwks_uri":               server.URL + "/jwks",
			})
		case "/jwks":
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"keys": []interface{}{},
			})
		}
	}))
	defer server.Close()

	// Pass issuer URL directly - oidc.NewProvider will fetch discovery automatically
	provider, err := NewCustomOIDCProvider(
		context.Background(),
		"client-id",
		"client-secret",
		"https://myapp.com/callback",
		[]string{"openid", "profile"},
		server.URL, // issuer
		server.URL+"/.well-known/openid-configuration",
		false,
		nil,
		nil,
		map[string]interface{}{
			"prompt":     "consent",
			"max_age":    "3600",
			"ui_locales": "en",
			"login_hint": "user@example.com",
		},
		nil,
		newTestOIDCProviderCache(t, 0),
	)

	require.NoError(t, err)

	authURL := provider.AuthCodeURL("test-state")

	// Verify standard OAuth2 params
	assert.Contains(t, authURL, "client_id=client-id")
	assert.Contains(t, authURL, "state=test-state")
	assert.Contains(t, authURL, "response_type=code")

	// Verify custom authorization params
	assert.Contains(t, authURL, "prompt=consent")
	assert.Contains(t, authURL, "max_age=3600")
	assert.Contains(t, authURL, "ui_locales=en")
	assert.Contains(t, authURL, "login_hint=user")
}

func TestNewCustomOIDCProvider_CustomDiscoveryURL(t *testing.T) {
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/custom-discovery":
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"issuer":                 server.URL,
				"authorization_endpoint": server.URL + "/custom-authorize",
				"token_endpoint":         server.URL + "/custom-token",
				"userinfo_endpoint":      server.URL + "/custom-userinfo",
				"jwks_uri":               server.URL + "/jwks",
			})
		case "/jwks":
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"keys": []interface{}{}})
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	p, err := NewCustomOIDCProvider(
		context.Background(),
		"test-client-id",
		"test-secret",
		"https://myapp.com/callback",
		[]string{"openid"},
		server.URL,
		server.URL+"/custom-discovery",
		false,
		nil, nil, nil,
		nil,
		newTestOIDCProviderCache(t, time.Hour),
	)
	require.NoError(t, err)
	require.NotNil(t, p)

	assert.Equal(t, server.URL+"/custom-authorize", p.config.Endpoint.AuthURL)
	assert.Equal(t, server.URL+"/custom-token", p.config.Endpoint.TokenURL)
	assert.Equal(t, server.URL+"/custom-userinfo", p.userinfoEndpoint)
}

func TestCustomOIDCProvider_RequiresPKCE(t *testing.T) {
	// Mock OIDC provider server
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/.well-known/openid-configuration":
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"issuer":                 server.URL,
				"authorization_endpoint": server.URL + "/authorize",
				"token_endpoint":         server.URL + "/token",
				"jwks_uri":               server.URL + "/jwks",
			})
		case "/jwks":
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"keys": []interface{}{},
			})
		}
	}))
	defer server.Close()

	t.Run("PKCE enabled", func(t *testing.T) {
		// Pass issuer URL directly - oidc.NewProvider will fetch discovery automatically
		provider, err := NewCustomOIDCProvider(
			context.Background(),
			"client-id",
			"client-secret",
			"https://myapp.com/callback",
			[]string{"openid"},
			server.URL, // issuer
			server.URL+"/.well-known/openid-configuration",
			true, // PKCE enabled
			nil,
			nil,
			nil,
			nil,
			newTestOIDCProviderCache(t, 0),
		)

		require.NoError(t, err)
		assert.True(t, provider.RequiresPKCE())
	})

	t.Run("PKCE disabled", func(t *testing.T) {
		// Pass issuer URL directly - oidc.NewProvider will fetch discovery automatically
		provider, err := NewCustomOIDCProvider(
			context.Background(),
			"client-id",
			"client-secret",
			"https://myapp.com/callback",
			[]string{"openid"},
			server.URL, // issuer
			server.URL+"/.well-known/openid-configuration",
			false, // PKCE disabled
			nil,
			nil,
			nil,
			nil,
			newTestOIDCProviderCache(t, 0),
		)

		require.NoError(t, err)
		assert.False(t, provider.RequiresPKCE())
	})
}
