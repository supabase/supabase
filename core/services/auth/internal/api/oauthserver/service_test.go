package oauthserver

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/hooks/v0hooks"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
	"github.com/supabase/auth/internal/tokens"
)

const serviceTestConfig = "../../../hack/test.env"

// OAuthServiceTestSuite runs tests for OAuth service layer functionality
type OAuthServiceTestSuite struct {
	suite.Suite
	Server *Server
	Config *conf.GlobalConfiguration
	DB     *storage.Connection
}

func TestOAuthService(t *testing.T) {
	globalConfig, err := confload.LoadGlobal(serviceTestConfig)
	require.NoError(t, err)

	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)

	// Enable OAuth server and dynamic client registration for tests
	globalConfig.OAuthServer.Enabled = true
	globalConfig.OAuthServer.AllowDynamicRegistration = true

	// Create a mock hooks manager for token service
	hooksMgr := &v0hooks.Manager{} // minimal mock for testing
	tokenService := tokens.NewService(globalConfig, hooksMgr)

	server := NewServer(globalConfig, conn, tokenService)

	ts := &OAuthServiceTestSuite{
		Server: server,
		Config: globalConfig,
		DB:     conn,
	}
	defer ts.DB.Close()

	suite.Run(t, ts)
}

func (ts *OAuthServiceTestSuite) SetupTest() {
	if ts.DB != nil {
		models.TruncateAll(ts.DB)
	}
	// Enable OAuth server and dynamic client registration for tests
	ts.Config.OAuthServer.Enabled = true
	ts.Config.OAuthServer.AllowDynamicRegistration = true
}

// Helper function to create test OAuth client
func (ts *OAuthServiceTestSuite) createTestOAuthClient() (*models.OAuthServerClient, string) {
	params := &OAuthServerClientRegisterParams{
		ClientName:       "Test Client",
		RedirectURIs:     []string{"https://example.com/callback", "http://localhost:3000/callback"},
		RegistrationType: "dynamic",
	}

	ctx := context.Background()
	client, secret, err := ts.Server.registerOAuthServerClient(ctx, params)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), client)
	require.NotEmpty(ts.T(), secret)

	return client, secret
}

// Test the OAuth client service functions directly
func (ts *OAuthServiceTestSuite) TestOAuthServerClientServiceMethods() {

	// Test registerOAuthServerClient
	params := &OAuthServerClientRegisterParams{
		ClientName:       "Test Client",
		RedirectURIs:     []string{"https://example.com/callback"},
		RegistrationType: "dynamic",
	}

	ctx := context.Background()
	client, secret, err := ts.Server.registerOAuthServerClient(ctx, params)

	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), client)
	require.NotEmpty(ts.T(), secret)
	assert.Equal(ts.T(), "Test Client", *client.ClientName)
	assert.Equal(ts.T(), "dynamic", client.RegistrationType)

	// Test getOAuthServerClient
	retrievedClient, err := ts.Server.getOAuthServerClient(ctx, client.ID)
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), client.ID, retrievedClient.ID)

}

func (ts *OAuthServiceTestSuite) TestHashClientSecret() {
	secret := "test-secret-123"

	hash, err := hashClientSecret(secret)
	require.NoError(ts.T(), err)
	assert.NotEmpty(ts.T(), hash)
	assert.NotEqual(ts.T(), secret, hash) // Should be hashed, not plaintext

	// Test validation
	isValid := ValidateClientSecret(secret, hash)
	assert.True(ts.T(), isValid)

	isInvalid := ValidateClientSecret("wrong-secret", hash)
	assert.False(ts.T(), isInvalid)
}

func (ts *OAuthServiceTestSuite) TestClientAuthentication() {

	client, secret := ts.createTestOAuthClient()

	// Test valid client credentials
	valid := ValidateClientSecret(secret, client.ClientSecretHash)
	assert.True(ts.T(), valid)

	// Test invalid client credentials
	invalid := ValidateClientSecret("wrong-secret", client.ClientSecretHash)
	assert.False(ts.T(), invalid)
}

func (ts *OAuthServiceTestSuite) TestDeleteOAuthServerClient() {
	// Create a test client first
	client, _ := ts.createTestOAuthClient()

	// Delete the client
	ctx := context.Background()
	err := ts.Server.deleteOAuthServerClient(ctx, client.ID)
	require.NoError(ts.T(), err)

	// Verify client was soft-deleted
	deletedClient, err := ts.Server.getOAuthServerClient(ctx, client.ID)
	assert.Error(ts.T(), err) // it was soft-deleted
	assert.Nil(ts.T(), deletedClient)
}

func (ts *OAuthServiceTestSuite) TestValidationEdgeCases() {
	// Test empty redirect URIs
	params := &OAuthServerClientRegisterParams{
		ClientName:       "Test Client",
		RedirectURIs:     []string{}, // Empty array
		RegistrationType: "dynamic",
	}

	ctx := context.Background()
	_, _, err := ts.Server.registerOAuthServerClient(ctx, params)
	assert.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "redirect_uris is required")

	// Test invalid redirect URI
	params = &OAuthServerClientRegisterParams{
		ClientName:       "Test Client",
		RedirectURIs:     []string{"invalid-uri"}, // Invalid URI
		RegistrationType: "dynamic",
	}

	_, _, err = ts.Server.registerOAuthServerClient(ctx, params)
	assert.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "invalid redirect_uri")

	// Test too many redirect URIs
	params = &OAuthServerClientRegisterParams{
		ClientName:       "Test Client",
		RedirectURIs:     make([]string, 11), // Too many URIs
		RegistrationType: "dynamic",
	}

	// Fill with valid URIs
	for i := 0; i < 11; i++ {
		params.RedirectURIs[i] = "https://example.com/callback" + string(rune('0'+i))
	}

	_, _, err = ts.Server.registerOAuthServerClient(ctx, params)
	assert.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "redirect_uris cannot exceed 10 items")

	// Test invalid grant type
	params = &OAuthServerClientRegisterParams{
		ClientName:       "Test Client",
		RedirectURIs:     []string{"https://example.com/callback"},
		GrantTypes:       []string{"invalid_grant_type"},
		RegistrationType: "dynamic",
	}

	_, _, err = ts.Server.registerOAuthServerClient(ctx, params)
	assert.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "grant_types must only contain 'authorization_code' and/or 'refresh_token'")

	// Test client name too long
	params = &OAuthServerClientRegisterParams{
		ClientName:       string(make([]byte, 1025)), // Too long
		RedirectURIs:     []string{"https://example.com/callback"},
		RegistrationType: "dynamic",
	}

	_, _, err = ts.Server.registerOAuthServerClient(ctx, params)
	assert.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "client_name cannot exceed 1024 characters")

	// Test invalid client URI
	params = &OAuthServerClientRegisterParams{
		ClientName:       "Test Client",
		RedirectURIs:     []string{"https://example.com/callback"},
		ClientURI:        "not-a-valid-url",
		RegistrationType: "dynamic",
	}

	_, _, err = ts.Server.registerOAuthServerClient(ctx, params)
	assert.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "client_uri must be a valid URL")

	// Test invalid logo URI
	params = &OAuthServerClientRegisterParams{
		ClientName:       "Test Client",
		RedirectURIs:     []string{"https://example.com/callback"},
		LogoURI:          "not-a-valid-url",
		RegistrationType: "dynamic",
	}

	_, _, err = ts.Server.registerOAuthServerClient(ctx, params)
	assert.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "logo_uri must be a valid URL")

	// Test invalid registration type
	params = &OAuthServerClientRegisterParams{
		ClientName:       "Test Client",
		RedirectURIs:     []string{"https://example.com/callback"},
		RegistrationType: "invalid",
	}

	_, _, err = ts.Server.registerOAuthServerClient(ctx, params)
	assert.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "registration_type must be 'dynamic' or 'manual'")
}

func (ts *OAuthServiceTestSuite) TestRedirectURIValidation() {
	testCases := []struct {
		name        string
		uri         string
		shouldError bool
		errorMsg    string
	}{
		// Valid HTTPS URIs
		{
			name:        "Valid HTTPS URI",
			uri:         "https://example.com/callback",
			shouldError: false,
		},
		{
			name:        "Valid HTTPS URI with port",
			uri:         "https://example.com:8443/callback",
			shouldError: false,
		},
		{
			name:        "Valid HTTPS URI with query params",
			uri:         "https://example.com/callback?foo=bar",
			shouldError: false,
		},
		// Valid HTTP localhost URIs
		{
			name:        "Valid localhost HTTP URI",
			uri:         "http://localhost:3000/callback",
			shouldError: false,
		},
		{
			name:        "Valid localhost HTTP URI without port",
			uri:         "http://localhost/callback",
			shouldError: false,
		},
		{
			name:        "Valid 127.0.0.1 HTTP URI",
			uri:         "http://127.0.0.1:8080/callback",
			shouldError: false,
		},
		{
			name:        "Valid IPv6 localhost HTTP URI",
			uri:         "http://[::1]:8080/callback",
			shouldError: false,
		},
		// Valid custom URI schemes (native apps)
		{
			name:        "Valid custom scheme - myapp",
			uri:         "myapp://callback",
			shouldError: false,
		},
		{
			name:        "Valid custom scheme - com.example.app",
			uri:         "com.example.app://oauth/callback",
			shouldError: false,
		},
		{
			name:        "Valid custom scheme with port and path",
			uri:         "myapp://localhost:8080/callback",
			shouldError: false,
		},
		// Invalid cases
		{
			name:        "Invalid empty URI",
			uri:         "",
			shouldError: true,
			errorMsg:    "redirect URI cannot be empty",
		},
		{
			name:        "Invalid HTTP non-localhost",
			uri:         "http://example.com/callback",
			shouldError: true,
			errorMsg:    "HTTP scheme only allowed for localhost",
		},
		{
			name:        "Invalid HTTP with IP address (not loopback)",
			uri:         "http://192.168.1.1/callback",
			shouldError: true,
			errorMsg:    "HTTP scheme only allowed for localhost",
		},
		{
			name:        "Invalid URI with fragment",
			uri:         "https://example.com/callback#fragment",
			shouldError: true,
			errorMsg:    "fragment not allowed in redirect URI",
		},
		{
			name:        "Invalid custom scheme with fragment",
			uri:         "myapp://callback#fragment",
			shouldError: true,
			errorMsg:    "fragment not allowed in redirect URI",
		},
		{
			name:        "Invalid URI format - no scheme",
			uri:         "example.com/callback",
			shouldError: true,
			errorMsg:    "must have scheme and host",
		},
		{
			name:        "Invalid URI format - no host",
			uri:         "https:///callback",
			shouldError: true,
			errorMsg:    "must have scheme and host",
		},
		{
			name:        "Invalid URI format - completely invalid",
			uri:         "not-a-uri",
			shouldError: true,
			errorMsg:    "must have scheme and host",
		},
		// Dangerous URI schemes
		{
			name:        "Invalid dangerous scheme - javascript",
			uri:         "javascript://example.com/alert(1)",
			shouldError: true,
			errorMsg:    "scheme 'javascript' is not allowed for security reasons",
		},
		{
			name:        "Invalid dangerous scheme - data",
			uri:         "data://text/html,<script>alert(1)</script>",
			shouldError: true,
			errorMsg:    "scheme 'data' is not allowed for security reasons",
		},
		{
			name:        "Invalid dangerous scheme - file",
			uri:         "file://localhost/etc/passwd",
			shouldError: true,
			errorMsg:    "scheme 'file' is not allowed for security reasons",
		},
		{
			name:        "Invalid dangerous scheme - vbscript",
			uri:         "vbscript://example.com/malicious",
			shouldError: true,
			errorMsg:    "scheme 'vbscript' is not allowed for security reasons",
		},
		{
			name:        "Invalid dangerous scheme - about",
			uri:         "about://blank",
			shouldError: true,
			errorMsg:    "scheme 'about' is not allowed for security reasons",
		},
		{
			name:        "Invalid dangerous scheme - blob",
			uri:         "blob://example.com/something",
			shouldError: true,
			errorMsg:    "scheme 'blob' is not allowed for security reasons",
		},
		{
			name:        "Invalid dangerous scheme - case insensitive JAVASCRIPT",
			uri:         "JAVASCRIPT://example.com/alert(1)",
			shouldError: true,
			errorMsg:    "is not allowed for security reasons",
		},
	}

	for _, tc := range testCases {
		ts.T().Run(tc.name, func(t *testing.T) {
			err := validateRedirectURI(tc.uri)
			if tc.shouldError {
				assert.Error(t, err)
				if tc.errorMsg != "" {
					assert.Contains(t, err.Error(), tc.errorMsg)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func (ts *OAuthServiceTestSuite) TestGrantTypeDefaults() {

	// Test that default grant types are set when none provided
	params := &OAuthServerClientRegisterParams{
		ClientName:       "Test Client",
		RedirectURIs:     []string{"https://example.com/callback"},
		RegistrationType: "dynamic",
		// GrantTypes not specified
	}

	ctx := context.Background()
	client, _, err := ts.Server.registerOAuthServerClient(ctx, params)
	require.NoError(ts.T(), err)

	// Should have default grant types
	grantTypes := client.GetGrantTypes()
	assert.Contains(ts.T(), grantTypes, "authorization_code")
	assert.Contains(ts.T(), grantTypes, "refresh_token")
	assert.Len(ts.T(), grantTypes, 2)
}
