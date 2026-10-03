package api

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
)

type TokenOIDCTestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration
}

func TestTokenOIDC(t *testing.T) {
	api, config, err := setupAPIForTest()
	require.NoError(t, err)

	ts := &TokenOIDCTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()

	suite.Run(t, ts)
}

func SetupTestOIDCProvider(ts *TokenOIDCTestSuite) *httptest.Server {
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/.well-known/openid-configuration":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"issuer":"` + server.URL + `","authorization_endpoint":"` + server.URL + `/authorize","token_endpoint":"` + server.URL + `/token","jwks_uri":"` + server.URL + `/jwks"}`))
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	return server
}

func (ts *TokenOIDCTestSuite) TestGetProvider() {
	server := SetupTestOIDCProvider(ts)
	defer server.Close()

	params := &IdTokenGrantParams{
		IdToken:     "test-id-token",
		AccessToken: "test-access-token",
		Nonce:       "test-nonce",
		Provider:    server.URL,
		ClientID:    "test-client-id",
		Issuer:      server.URL,
	}

	ts.Config.External.AllowedIdTokenIssuers = []string{server.URL}

	req := httptest.NewRequest(http.MethodPost, "http://localhost", nil)
	oidcProvider, skipNonceCheck, providerType, acceptableClientIds, emailOptional, err := params.getProvider(context.Background(), ts.API.db, ts.Config, req, ts.API.oidcCache)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), oidcProvider)
	require.False(ts.T(), skipNonceCheck)
	require.False(ts.T(), emailOptional)
	require.Equal(ts.T(), params.Provider, providerType)
	require.NotEmpty(ts.T(), acceptableClientIds)
}

// createFakeIDToken creates a fake JWT token with a specific issuer claim for testing
// WARNING: This is for testing purposes only and creates an unsigned token
func createFakeIDToken(issuer string, sub string) string {
	header := map[string]interface{}{
		"alg": "RS256",
		"typ": "JWT",
	}

	payload := map[string]interface{}{
		"iss": issuer,
		"sub": sub,
		"aud": "test-client-id",
		"exp": 9999999999,
		"iat": 1234567890,
	}

	headerJSON, _ := json.Marshal(header)
	payloadJSON, _ := json.Marshal(payload)

	headerEncoded := base64.RawURLEncoding.EncodeToString(headerJSON)
	payloadEncoded := base64.RawURLEncoding.EncodeToString(payloadJSON)

	// Note: signature is fake, but the issuer detection only looks at the payload
	return headerEncoded + "." + payloadEncoded + ".fake-signature"
}

func (ts *TokenOIDCTestSuite) TestGetProviderAppleWithIncorrectIssuer() {
	incorrectIssuer := SetupTestOIDCProvider(ts)
	defer incorrectIssuer.Close()

	ts.Config.External.Apple.Enabled = true
	ts.Config.External.Apple.ClientID = []string{"com.example.app"}

	// Create a token with an invalid issuer
	nonAppleToken := createFakeIDToken(incorrectIssuer.URL, "user123")

	// provider="apple" but with an incorrect issuer in the token
	params := &IdTokenGrantParams{
		IdToken:  nonAppleToken,
		Provider: "apple",
		Issuer:   incorrectIssuer.URL,
	}

	req := httptest.NewRequest(http.MethodPost, "http://localhost", nil)
	_, _, _, _, _, err := params.getProvider(context.Background(), ts.API.db, ts.Config, req, ts.API.oidcCache)

	require.Error(ts.T(), err)
	require.Contains(ts.T(), err.Error(), "not an Apple ID token issuer")
}

// TestGetProviderAzureWithNonAzureTokenIssuer tests that Azure provider only
// accepts tokens from login.microsoftonline.com and sts.windows.net
func (ts *TokenOIDCTestSuite) TestGetProviderAzureWithNonAzureTokenIssuer() {
	ts.Config.External.Azure.Enabled = true
	ts.Config.External.Azure.ClientID = []string{"test-client-id"}

	// Create a token with an incorrect issuer
	nonAzureIssuer := "https://non-azure-issuer.example.com"
	nonAzureToken := createFakeIDToken(nonAzureIssuer, "user123")

	params := &IdTokenGrantParams{
		IdToken:  nonAzureToken,
		Provider: "azure",
		Issuer:   nonAzureIssuer,
	}

	req := httptest.NewRequest(http.MethodPost, "http://localhost", nil)
	_, _, _, _, _, err := params.getProvider(context.Background(), ts.API.db, ts.Config, req, ts.API.oidcCache)

	// This should fail - the token's issuer is not an accepted issuer
	require.Error(ts.T(), err)
	require.Contains(ts.T(), err.Error(), "not an Azure ID token issuer")
}

// TestGetProviderAppleWithInvalidIssuerInToken tests that Apple provider rejects
// tokens when the actual token issuer does not match the expected issuer
func (ts *TokenOIDCTestSuite) TestGetProviderAppleWithNonAppleIssuerInToken() {
	ts.Config.External.Apple.Enabled = true
	ts.Config.External.Apple.ClientID = []string{"com.example.app"}

	// Create a token with an incorrect issuer
	nonAppleIssuer := "https://non-apple-issuer.example.com"
	nonAppleToken := createFakeIDToken(nonAppleIssuer, "user123")

	params := &IdTokenGrantParams{
		IdToken:  nonAppleToken,
		Provider: "apple",
		Issuer:   "https://appleid.apple.com",
	}

	req := httptest.NewRequest(http.MethodPost, "http://localhost", nil)
	_, _, _, _, _, err := params.getProvider(context.Background(), ts.API.db, ts.Config, req, ts.API.oidcCache)

	// This should fail - the token's actual issuer is not appleid.apple.com
	require.Error(ts.T(), err)
	require.Contains(ts.T(), err.Error(), "not an Apple ID token issuer")
}
