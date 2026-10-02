package utilities

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// withTestFetcher installs a test fetcher for the duration of the test and
// restores the production default on cleanup.
func withTestFetcher(t *testing.T, fn func(ctx context.Context, discoveryURL string) (*http.Response, error)) {
	t.Helper()
	t.Cleanup(SetOIDCDiscoveryHTTPFetcherForTest(fn))
}

// plainHTTPFetcher is a fetcher that does a normal GET without SSRF validation,
// suitable for httptest loopback servers.
func plainHTTPFetcher() func(ctx context.Context, discoveryURL string) (*http.Response, error) {
	client := &http.Client{}
	return func(ctx context.Context, discoveryURL string) (*http.Response, error) {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, discoveryURL, nil)
		if err != nil {
			return nil, err
		}
		return client.Do(req)
	}
}

func TestFetchAndValidateOIDCDiscovery_HappyPath(t *testing.T) {
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"issuer":                                server.URL,
			"authorization_endpoint":                server.URL + "/authorize",
			"token_endpoint":                        server.URL + "/token",
			"userinfo_endpoint":                     server.URL + "/userinfo",
			"jwks_uri":                              server.URL + "/jwks",
			"scopes_supported":                      []string{"openid", "email"},
			"response_types_supported":              []string{"code"},
			"grant_types_supported":                 []string{"authorization_code"},
			"subject_types_supported":               []string{"public"},
			"id_token_signing_alg_values_supported": []string{"RS256", "ES256"},
		})
	}))
	defer server.Close()

	withTestFetcher(t, plainHTTPFetcher())

	doc, err := FetchAndValidateOIDCDiscovery(context.Background(), server.URL+"/.well-known/openid-configuration", server.URL)
	require.NoError(t, err)
	require.NotNil(t, doc)
	assert.Equal(t, server.URL, doc.Issuer)
	assert.Equal(t, server.URL+"/authorize", doc.AuthorizationEndpoint)
	assert.Equal(t, server.URL+"/token", doc.TokenEndpoint)
	assert.Equal(t, server.URL+"/userinfo", doc.UserinfoEndpoint)
	assert.Equal(t, server.URL+"/jwks", doc.JwksURI)
	assert.Equal(t, []string{"openid", "email"}, doc.ScopesSupported)
	assert.Equal(t, []string{"code"}, doc.ResponseTypesSupported)
	assert.Equal(t, []string{"authorization_code"}, doc.GrantTypesSupported)
	assert.Equal(t, []string{"public"}, doc.SubjectTypesSupported)
	assert.Equal(t, []string{"RS256", "ES256"}, doc.IDTokenSigningAlgValuesSupported)
}

func TestFetchAndValidateOIDCDiscovery_Non200Status(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "nope", http.StatusInternalServerError)
	}))
	defer server.Close()

	withTestFetcher(t, plainHTTPFetcher())

	_, err := FetchAndValidateOIDCDiscovery(context.Background(), server.URL+"/discovery", server.URL)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "500")
}

func TestFetchAndValidateOIDCDiscovery_BodyExceedsCap(t *testing.T) {
	// Serve a JSON body larger than MaxOIDCDiscoveryResponseSize so the
	// LimitReader truncates mid-object and json.Decode fails.
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"issuer":"x","filler":"`))
		w.Write([]byte(strings.Repeat("A", MaxOIDCDiscoveryResponseSize+1024)))
		w.Write([]byte(`"}`))
	}))
	defer server.Close()

	withTestFetcher(t, plainHTTPFetcher())

	_, err := FetchAndValidateOIDCDiscovery(context.Background(), server.URL+"/discovery", "x")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "decode")
}

func TestFetchAndValidateOIDCDiscovery_InvalidJSON(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`not json at all`))
	}))
	defer server.Close()

	withTestFetcher(t, plainHTTPFetcher())

	_, err := FetchAndValidateOIDCDiscovery(context.Background(), server.URL+"/discovery", "anything")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "decode")
}

func TestFetchAndValidateOIDCDiscovery_IssuerMismatch(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"issuer":                 "https://wrong-issuer.example.com",
			"authorization_endpoint": "https://x/authorize",
			"token_endpoint":         "https://x/token",
			"jwks_uri":               "https://x/jwks",
		})
	}))
	defer server.Close()

	withTestFetcher(t, plainHTTPFetcher())

	_, err := FetchAndValidateOIDCDiscovery(context.Background(), server.URL+"/discovery", "https://expected.example.com")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "issuer mismatch")
}

func TestFetchAndValidateOIDCDiscovery_FetcherError(t *testing.T) {
	sentinel := errors.New("boom")
	withTestFetcher(t, func(ctx context.Context, discoveryURL string) (*http.Response, error) {
		return nil, sentinel
	})

	_, err := FetchAndValidateOIDCDiscovery(context.Background(), "https://example.com/discovery", "https://example.com")
	require.Error(t, err)
	assert.ErrorIs(t, err, sentinel)
}
