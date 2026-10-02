package models

import (
	"testing"

	"github.com/gobuffalo/pop/v6/slices"
	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
)

type CustomOAuthProviderTestSuite struct {
	suite.Suite
	db     *storage.Connection
	config *conf.GlobalConfiguration
}

func (ts *CustomOAuthProviderTestSuite) SetupTest() {
	TruncateAll(ts.db)
}

func TestCustomOAuthProvider(t *testing.T) {
	globalConfig, err := confload.LoadGlobal(modelsTestConfig)
	require.NoError(t, err)

	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)

	ts := &CustomOAuthProviderTestSuite{
		db:     conn,
		config: globalConfig,
	}
	defer ts.db.Close()

	suite.Run(t, ts)
}

// Test CRUD Operations

func (ts *CustomOAuthProviderTestSuite) TestCreateCustomOAuthProvider() {
	tests := []struct {
		name         string
		providerType ProviderType
	}{
		{
			name:         "Create OAuth2 provider",
			providerType: ProviderTypeOAuth2,
		},
		{
			name:         "Create OIDC provider",
			providerType: ProviderTypeOIDC,
		},
	}

	for _, tt := range tests {
		ts.Run(tt.name, func() {
			provider := ts.createTestProvider(tt.providerType, "test-provider-"+string(tt.providerType))

			require.NotEqual(ts.T(), uuid.Nil, provider.ID)
			require.Equal(ts.T(), tt.providerType, provider.ProviderType)
			require.NotEmpty(ts.T(), provider.CreatedAt)
			require.NotEmpty(ts.T(), provider.UpdatedAt)
		})
	}
}

func (ts *CustomOAuthProviderTestSuite) TestFindCustomOAuthProviderByID() {
	provider := ts.createTestProvider(ProviderTypeOAuth2, "custom:test-oauth2")

	found, err := FindCustomOAuthProviderByID(ts.db, provider.ID)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), provider.ID, found.ID)
	require.Equal(ts.T(), provider.Identifier, found.Identifier)

	// Test not found
	nonExistentID, _ := uuid.NewV4()
	_, err = FindCustomOAuthProviderByID(ts.db, nonExistentID)
	require.Error(ts.T(), err)
	require.True(ts.T(), IsNotFoundError(err))
}

func (ts *CustomOAuthProviderTestSuite) TestFindCustomOAuthProviderByIdentifier() {
	identifier := "custom:test-github-enterprise"
	provider := ts.createTestProvider(ProviderTypeOAuth2, identifier)

	found, err := FindCustomOAuthProviderByIdentifier(ts.db, identifier)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), provider.ID, found.ID)
	require.Equal(ts.T(), identifier, found.Identifier)

	// Test not found
	_, err = FindCustomOAuthProviderByIdentifier(ts.db, "custom:nonexistent")
	require.Error(ts.T(), err)
	require.True(ts.T(), IsNotFoundError(err))
}

func (ts *CustomOAuthProviderTestSuite) TestFindAllCustomOAuthProviders() {
	ts.createTestProvider(ProviderTypeOAuth2, "custom:provider1")
	ts.createTestProvider(ProviderTypeOAuth2, "custom:provider2")
	ts.createTestOIDCProvider("custom:provider3", "https://oidc1.example.com")

	providers, err := FindAllCustomOAuthProviders(ts.db)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), providers, 3)
}

func (ts *CustomOAuthProviderTestSuite) TestFindAllCustomOAuthProvidersByType() {
	ts.createTestProvider(ProviderTypeOAuth2, "custom:oauth2-1")
	ts.createTestProvider(ProviderTypeOAuth2, "custom:oauth2-2")
	ts.createTestOIDCProvider("custom:oidc-1", "https://oidc1.example.com")
	ts.createTestOIDCProvider("custom:oidc-2", "https://oidc2.example.com")

	oauth2Providers, err := FindAllCustomOAuthProvidersByType(ts.db, ProviderTypeOAuth2)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), oauth2Providers, 2)

	oidcProviders, err := FindAllCustomOAuthProvidersByType(ts.db, ProviderTypeOIDC)
	require.NoError(ts.T(), err)
	require.Len(ts.T(), oidcProviders, 2)
}

func (ts *CustomOAuthProviderTestSuite) TestCountCustomOAuthProviders() {
	ts.createTestProvider(ProviderTypeOAuth2, "custom:count1")
	ts.createTestOIDCProvider("custom:count2", "https://count.example.com")

	count, err := CountCustomOAuthProviders(ts.db)
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), 2, count)
}
func (ts *CustomOAuthProviderTestSuite) TestUpdateCustomOAuthProvider() {
	provider := ts.createTestProvider(ProviderTypeOAuth2, "custom:update-test")

	// Update name
	provider.Name = "Updated Name"
	provider.ClientID = "new-client-id"
	provider.Scopes = slices.String{"openid", "profile", "email"}

	err := UpdateCustomOAuthProvider(ts.db, provider)
	require.NoError(ts.T(), err)

	// Verify update
	updated, err := FindCustomOAuthProviderByID(ts.db, provider.ID)
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), "Updated Name", updated.Name)
	assert.Equal(ts.T(), "new-client-id", updated.ClientID)
	assert.Equal(ts.T(), slices.String{"openid", "profile", "email"}, updated.Scopes)
}

func (ts *CustomOAuthProviderTestSuite) TestDeleteCustomOAuthProvider() {
	provider := ts.createTestProvider(ProviderTypeOAuth2, "custom:delete-test")

	err := DeleteCustomOAuthProvider(ts.db, provider.ID)
	require.NoError(ts.T(), err)

	// Verify deletion
	_, err = FindCustomOAuthProviderByID(ts.db, provider.ID)
	require.Error(ts.T(), err)
	require.True(ts.T(), IsNotFoundError(err))
}

// Test Custom Types

func (ts *CustomOAuthProviderTestSuite) TestStringSliceSerialization() {
	provider := &CustomOAuthProvider{
		ProviderType:        ProviderTypeOAuth2,
		Identifier:          "custom:string-slice-test",
		Name:                "String Slice Test",
		ClientID:            "client-id",
		Scopes:              slices.String{"openid", "profile", "email"},
		AcceptableClientIDs: slices.String{"ios-client", "android-client", "web-client"},
		AuthorizationURL:    stringPtr("https://example.com/authorize"),
		TokenURL:            stringPtr("https://example.com/token"),
		UserinfoURL:         stringPtr("https://example.com/userinfo"),
		PKCEEnabled:         true,
		Enabled:             true,
	}

	err := CreateCustomOAuthProvider(ts.db, provider)
	require.NoError(ts.T(), err)

	// Retrieve and verify
	found, err := FindCustomOAuthProviderByID(ts.db, provider.ID)
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), slices.String{"openid", "profile", "email"}, found.Scopes)
	assert.Equal(ts.T(), slices.String{"ios-client", "android-client", "web-client"}, found.AcceptableClientIDs)

	// Test empty slice
	provider.Scopes = slices.String{}
	err = UpdateCustomOAuthProvider(ts.db, provider)
	require.NoError(ts.T(), err)

	found, err = FindCustomOAuthProviderByID(ts.db, provider.ID)
	require.NoError(ts.T(), err)
	assert.Empty(ts.T(), found.Scopes)
}

func (ts *CustomOAuthProviderTestSuite) TestCustomClaimsAllowlistSerialization() {
	provider := &CustomOAuthProvider{
		ProviderType:          ProviderTypeOAuth2,
		Identifier:            "custom:allowlist-test",
		Name:                  "Allowlist Test",
		ClientID:              "client-id",
		AuthorizationURL:      stringPtr("https://example.com/authorize"),
		TokenURL:              stringPtr("https://example.com/token"),
		UserinfoURL:           stringPtr("https://example.com/userinfo"),
		CustomClaimsAllowlist: slices.String{"groups", "org_id", "mail", "sn"},
		PKCEEnabled:           true,
		Enabled:               true,
	}

	err := CreateCustomOAuthProvider(ts.db, provider)
	require.NoError(ts.T(), err)

	// Retrieve and verify the non-empty allowlist round-trips.
	found, err := FindCustomOAuthProviderByID(ts.db, provider.ID)
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), slices.String{"groups", "org_id", "mail", "sn"}, found.CustomClaimsAllowlist)

	// Replacing with an empty allowlist round-trips to an empty slice.
	provider.CustomClaimsAllowlist = slices.String{}
	err = UpdateCustomOAuthProvider(ts.db, provider)
	require.NoError(ts.T(), err)

	found, err = FindCustomOAuthProviderByID(ts.db, provider.ID)
	require.NoError(ts.T(), err)
	assert.Empty(ts.T(), found.CustomClaimsAllowlist)
}

func (ts *CustomOAuthProviderTestSuite) TestCustomClaimsAllowlistDefaultsEmpty() {
	provider := ts.createTestProvider(ProviderTypeOAuth2, "custom:allowlist-default")

	found, err := FindCustomOAuthProviderByID(ts.db, provider.ID)
	require.NoError(ts.T(), err)
	assert.Empty(ts.T(), found.CustomClaimsAllowlist)
}

func (ts *CustomOAuthProviderTestSuite) TestAttributeMappingSerialization() {
	mapping := slices.Map{
		"email":      "user_email",
		"name":       "full_name",
		"avatar_url": "picture",
		"custom_field": map[string]interface{}{
			"nested": "value",
		},
	}

	provider := &CustomOAuthProvider{
		ProviderType:     ProviderTypeOAuth2,
		Identifier:       "custom:mapping-test",
		Name:             "Mapping Test",
		ClientID:         "client-id",
		AuthorizationURL: stringPtr("https://example.com/authorize"),
		TokenURL:         stringPtr("https://example.com/token"),
		UserinfoURL:      stringPtr("https://example.com/userinfo"),
		AttributeMapping: mapping,
		PKCEEnabled:      true,
		Enabled:          true,
	}

	err := CreateCustomOAuthProvider(ts.db, provider)
	require.NoError(ts.T(), err)

	// Retrieve and verify
	found, err := FindCustomOAuthProviderByID(ts.db, provider.ID)
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), "user_email", found.AttributeMapping["email"])
	assert.Equal(ts.T(), "full_name", found.AttributeMapping["name"])
	assert.Equal(ts.T(), "picture", found.AttributeMapping["avatar_url"])
	assert.NotNil(ts.T(), found.AttributeMapping["custom_field"])
}

func (ts *CustomOAuthProviderTestSuite) TestAuthorizationParamsSerialization() {
	params := slices.Map{
		"prompt":       "consent",
		"access_type":  "offline",
		"custom_param": "value",
	}

	provider := &CustomOAuthProvider{
		ProviderType:        ProviderTypeOAuth2,
		Identifier:          "custom:params-test",
		Name:                "Params Test",
		ClientID:            "client-id",
		AuthorizationURL:    stringPtr("https://example.com/authorize"),
		TokenURL:            stringPtr("https://example.com/token"),
		UserinfoURL:         stringPtr("https://example.com/userinfo"),
		AuthorizationParams: params,
		PKCEEnabled:         true,
		Enabled:             true,
	}

	err := CreateCustomOAuthProvider(ts.db, provider)
	require.NoError(ts.T(), err)

	// Retrieve and verify
	found, err := FindCustomOAuthProviderByID(ts.db, provider.ID)
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), "consent", found.AuthorizationParams["prompt"])
	assert.Equal(ts.T(), "offline", found.AuthorizationParams["access_type"])
	assert.Equal(ts.T(), "value", found.AuthorizationParams["custom_param"])
}

func (ts *CustomOAuthProviderTestSuite) TestOIDCDiscoverySerialization() {
	issuer := "https://oidc-discovery-test.example.com"
	discovery := &OIDCDiscovery{
		Issuer:                 issuer,
		AuthorizationEndpoint:  issuer + "/authorize",
		TokenEndpoint:          issuer + "/token",
		UserinfoEndpoint:       issuer + "/userinfo",
		JwksURI:                issuer + "/jwks",
		ScopesSupported:        []string{"openid", "profile", "email"},
		ResponseTypesSupported: []string{"code", "token", "id_token"},
		GrantTypesSupported:    []string{"authorization_code", "refresh_token"},
		SubjectTypesSupported:  []string{"public"},
	}

	provider := &CustomOAuthProvider{
		ProviderType:    ProviderTypeOIDC,
		Identifier:      "custom:oidc-discovery-test",
		Name:            "OIDC Discovery Test",
		ClientID:        "client-id",
		Issuer:          &issuer,
		CachedDiscovery: discovery,
		PKCEEnabled:     true,
		Enabled:         true,
	}

	err := CreateCustomOAuthProvider(ts.db, provider)
	require.NoError(ts.T(), err)

	// Retrieve and verify
	found, err := FindCustomOAuthProviderByID(ts.db, provider.ID)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), found.CachedDiscovery)
	assert.Equal(ts.T(), issuer, found.CachedDiscovery.Issuer)
	assert.Equal(ts.T(), issuer+"/authorize", found.CachedDiscovery.AuthorizationEndpoint)
	assert.Equal(ts.T(), issuer+"/token", found.CachedDiscovery.TokenEndpoint)
	assert.Equal(ts.T(), issuer+"/userinfo", found.CachedDiscovery.UserinfoEndpoint)
	assert.Equal(ts.T(), issuer+"/jwks", found.CachedDiscovery.JwksURI)
	assert.Equal(ts.T(), []string{"openid", "profile", "email"}, found.CachedDiscovery.ScopesSupported)
}

// Test Helper Methods

func (ts *CustomOAuthProviderTestSuite) TestIsOIDC() {
	oauth2Provider := ts.createTestProvider(ProviderTypeOAuth2, "custom:oauth2-check")
	assert.False(ts.T(), oauth2Provider.IsOIDC())
	assert.True(ts.T(), oauth2Provider.IsOAuth2())

	oidcProvider := ts.createTestOIDCProvider("custom:oidc-check", "https://oidc.example.com")
	assert.True(ts.T(), oidcProvider.IsOIDC())
	assert.False(ts.T(), oidcProvider.IsOAuth2())
}

func (ts *CustomOAuthProviderTestSuite) TestGetProviderName() {
	provider := ts.createTestProvider(ProviderTypeOAuth2, "custom:github-enterprise")
	assert.Equal(ts.T(), "custom:github-enterprise", provider.GetProviderName())
}

func (ts *CustomOAuthProviderTestSuite) TestGetDiscoveryURL() {
	issuer1 := "https://oidc-auto.example.com"

	// Test without explicit discovery URL (should construct from issuer)
	provider := &CustomOAuthProvider{
		ProviderType: ProviderTypeOIDC,
		Identifier:   "custom:oidc-auto-discovery",
		Name:         "OIDC Auto Discovery",
		ClientID:     "client-id",
		Issuer:       &issuer1,
		PKCEEnabled:  true,
		Enabled:      true,
	}

	err := CreateCustomOAuthProvider(ts.db, provider)
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), "https://oidc-auto.example.com/.well-known/openid-configuration", provider.GetDiscoveryURL())

	// Test with explicit discovery URL (use different issuer to avoid constraint violation)
	issuer2 := "https://oidc-explicit.example.com"
	explicitDiscoveryURL := "https://oidc-explicit.example.com/.well-known/openid-configuration-custom"
	provider2 := &CustomOAuthProvider{
		ProviderType: ProviderTypeOIDC,
		Identifier:   "custom:oidc-explicit-discovery",
		Name:         "OIDC Explicit Discovery",
		ClientID:     "client-id",
		Issuer:       &issuer2,
		DiscoveryURL: &explicitDiscoveryURL,
		PKCEEnabled:  true,
		Enabled:      true,
	}

	err = CreateCustomOAuthProvider(ts.db, provider2)
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), explicitDiscoveryURL, provider2.GetDiscoveryURL())

	// Test OAuth2 provider returns empty string
	oauth2Provider := ts.createTestProvider(ProviderTypeOAuth2, "custom:oauth2-no-discovery")
	assert.Empty(ts.T(), oauth2Provider.GetDiscoveryURL())
}

// Test Client Secret Encryption/Decryption

func (ts *CustomOAuthProviderTestSuite) TestSetClientSecretEncrypts() {
	provider := &CustomOAuthProvider{
		ProviderType:     ProviderTypeOAuth2,
		Identifier:       "custom:encrypt-test",
		Name:             "Encrypt Test",
		ClientID:         "client-id",
		AuthorizationURL: stringPtr("https://example.com/authorize"),
		TokenURL:         stringPtr("https://example.com/token"),
		UserinfoURL:      stringPtr("https://example.com/userinfo"),
		PKCEEnabled:      true,
		Enabled:          true,
	}

	secret := "my-super-secret-client-secret"
	err := provider.SetClientSecret(secret, ts.config.Security.DBEncryption)
	require.NoError(ts.T(), err)

	// The stored value should NOT be the plaintext secret
	assert.NotEqual(ts.T(), secret, provider.ClientSecret)
	assert.NotEmpty(ts.T(), provider.ClientSecret)
}

func (ts *CustomOAuthProviderTestSuite) TestGetClientSecretDecrypts() {
	provider := &CustomOAuthProvider{
		ProviderType:     ProviderTypeOAuth2,
		Identifier:       "custom:decrypt-test",
		Name:             "Decrypt Test",
		ClientID:         "client-id",
		AuthorizationURL: stringPtr("https://example.com/authorize"),
		TokenURL:         stringPtr("https://example.com/token"),
		UserinfoURL:      stringPtr("https://example.com/userinfo"),
		PKCEEnabled:      true,
		Enabled:          true,
	}

	secret := "my-super-secret-client-secret"
	err := provider.SetClientSecret(secret, ts.config.Security.DBEncryption)
	require.NoError(ts.T(), err)

	// Decrypt and verify we get the original secret back
	decrypted, err := provider.GetClientSecret(ts.config.Security.DBEncryption)
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), secret, decrypted)
}

func (ts *CustomOAuthProviderTestSuite) TestClientSecretRoundTripThroughDB() {
	secret := "my-super-secret-client-secret"

	// Generate ID upfront so encryption AAD matches what's stored in DB
	id, err := uuid.NewV4()
	require.NoError(ts.T(), err)

	provider := &CustomOAuthProvider{
		ID:               id,
		ProviderType:     ProviderTypeOAuth2,
		Identifier:       "custom:roundtrip-test",
		Name:             "Roundtrip Test",
		ClientID:         "client-id",
		AuthorizationURL: stringPtr("https://example.com/authorize"),
		TokenURL:         stringPtr("https://example.com/token"),
		UserinfoURL:      stringPtr("https://example.com/userinfo"),
		PKCEEnabled:      true,
		Enabled:          true,
	}

	err = provider.SetClientSecret(secret, ts.config.Security.DBEncryption)
	require.NoError(ts.T(), err)

	err = CreateCustomOAuthProvider(ts.db, provider)
	require.NoError(ts.T(), err)

	// Retrieve from DB and decrypt
	found, err := FindCustomOAuthProviderByID(ts.db, provider.ID)
	require.NoError(ts.T(), err)

	// Raw value in DB should be encrypted, not plaintext
	assert.NotEqual(ts.T(), secret, found.ClientSecret)

	// Decrypted value should match original
	decrypted, err := found.GetClientSecret(ts.config.Security.DBEncryption)
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), secret, decrypted)
}

func TestGetDiscoveryURLStripsTrailingSlashes(t *testing.T) {
	tests := []struct {
		name     string
		issuer   string
		expected string
	}{
		{
			name:     "no trailing slash",
			issuer:   "https://example.com",
			expected: "https://example.com/.well-known/openid-configuration",
		},
		{
			name:     "single trailing slash",
			issuer:   "https://example.com/",
			expected: "https://example.com/.well-known/openid-configuration",
		},
		{
			name:     "multiple trailing slashes",
			issuer:   "https://example.com///",
			expected: "https://example.com/.well-known/openid-configuration",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			issuer := tt.issuer
			provider := &CustomOAuthProvider{
				ProviderType: ProviderTypeOIDC,
				Issuer:       &issuer,
			}
			assert.Equal(t, tt.expected, provider.GetDiscoveryURL())
		})
	}
}

// Helper functions

func (ts *CustomOAuthProviderTestSuite) createTestProvider(providerType ProviderType, identifier string) *CustomOAuthProvider {
	provider := &CustomOAuthProvider{
		ProviderType: providerType,
		Identifier:   identifier,
		Name:         "Test Provider",
		ClientID:     "test-client-id",
		Scopes:       slices.String{"openid", "profile"},
		PKCEEnabled:  true,
		Enabled:      true,
	}

	switch providerType {
	case ProviderTypeOAuth2:
		authURL := "https://example.com/authorize"
		// #nosec G101 - These are test URLs, not actual credentials
		tokenURL := "https://example.com/token"
		userinfoURL := "https://example.com/userinfo"
		provider.AuthorizationURL = &authURL
		provider.TokenURL = &tokenURL
		provider.UserinfoURL = &userinfoURL
	case ProviderTypeOIDC:
		// For OIDC, generate a unique issuer to avoid constraint violations
		issuer := "https://oidc-" + identifier + ".example.com"
		provider.Issuer = &issuer
	}

	// Encrypt and set client secret before persisting
	err := provider.SetClientSecret("test-client-secret", ts.config.Security.DBEncryption)
	require.NoError(ts.T(), err)

	err = CreateCustomOAuthProvider(ts.db, provider)
	require.NoError(ts.T(), err)

	return provider
}

func (ts *CustomOAuthProviderTestSuite) createTestOIDCProvider(identifier, issuer string) *CustomOAuthProvider {
	provider := &CustomOAuthProvider{
		ProviderType: ProviderTypeOIDC,
		Identifier:   identifier,
		Name:         "Test OIDC Provider",
		ClientID:     "test-client-id",
		Issuer:       &issuer,
		Scopes:       slices.String{"openid", "profile"},
		PKCEEnabled:  true,
		Enabled:      true,
	}

	// Encrypt and set client secret before persisting
	err := provider.SetClientSecret("test-client-secret", ts.config.Security.DBEncryption)
	require.NoError(ts.T(), err)

	err = CreateCustomOAuthProvider(ts.db, provider)
	require.NoError(ts.T(), err)

	return provider
}

func stringPtr(s string) *string {
	return &s
}
