package utilities

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// OIDCDiscoveryFetchTimeout bounds the discovery fetch so a slow or hung
// upstream cannot wedge an auth request indefinitely.
const OIDCDiscoveryFetchTimeout = 10 * time.Second

// MaxOIDCDiscoveryResponseSize caps how much of the discovery body we'll read.
// Defends against an attacker (or a buggy upstream) serving an unbounded body.
const MaxOIDCDiscoveryResponseSize = 1 << 20 // 1 MB

// OIDCDiscoveryDocument is the wire-format representation of an OIDC discovery
// document. It's the superset of fields needed by both the admin path (which
// persists to models.OIDCDiscovery) and the runtime path (which builds an
// *oidc.Provider). Storage and runtime concerns are kept out of this type.
type OIDCDiscoveryDocument struct {
	Issuer                           string   `json:"issuer"`
	AuthorizationEndpoint            string   `json:"authorization_endpoint"`
	TokenEndpoint                    string   `json:"token_endpoint"`
	UserinfoEndpoint                 string   `json:"userinfo_endpoint,omitempty"`
	JwksURI                          string   `json:"jwks_uri"`
	ScopesSupported                  []string `json:"scopes_supported,omitempty"`
	ResponseTypesSupported           []string `json:"response_types_supported,omitempty"`
	GrantTypesSupported              []string `json:"grant_types_supported,omitempty"`
	SubjectTypesSupported            []string `json:"subject_types_supported,omitempty"`
	IDTokenSigningAlgValuesSupported []string `json:"id_token_signing_alg_values_supported,omitempty"`
}

// oidcDiscoveryHTTPFetcher is the underlying fetcher used by
// FetchAndValidateOIDCDiscovery. Tests swap it via SetOIDCDiscoveryHTTPFetcherForTest
// to bypass the SSRF-protected default (which refuses httptest loopback URLs).
var oidcDiscoveryHTTPFetcher = func(ctx context.Context, discoveryURL string) (*http.Response, error) {
	return FetchURLWithTimeout(ctx, discoveryURL, OIDCDiscoveryFetchTimeout)
}

// SetOIDCDiscoveryHTTPFetcherForTest replaces the HTTP fetcher used by
// FetchAndValidateOIDCDiscovery and returns a function that restores the
// previous fetcher. Test-only — the production default applies SSRF protection
// (rejects loopback, private IPs, non-HTTPS), which test servers cannot satisfy.
func SetOIDCDiscoveryHTTPFetcherForTest(fn func(ctx context.Context, discoveryURL string) (*http.Response, error)) (restore func()) {
	prev := oidcDiscoveryHTTPFetcher
	oidcDiscoveryHTTPFetcher = fn
	return func() { oidcDiscoveryHTTPFetcher = prev }
}

// FetchAndValidateOIDCDiscovery fetches an OIDC discovery document from
// discoveryURL, decodes it, and verifies its issuer matches expectedIssuer
// (per OpenID Connect Discovery 1.0, Section 4.3). Errors are returned as
// plain Go errors; callers wrap them into their own error types.
func FetchAndValidateOIDCDiscovery(ctx context.Context, discoveryURL, expectedIssuer string) (*OIDCDiscoveryDocument, error) {
	resp, err := oidcDiscoveryHTTPFetcher(ctx, discoveryURL)
	if err != nil {
		return nil, fmt.Errorf("oidc: discovery request to %s failed: %w", discoveryURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("oidc: discovery request to %s returned %s", discoveryURL, resp.Status)
	}

	var doc OIDCDiscoveryDocument
	if err := json.NewDecoder(io.LimitReader(resp.Body, MaxOIDCDiscoveryResponseSize)).Decode(&doc); err != nil {
		return nil, fmt.Errorf("oidc: failed to decode discovery document from %s: %w", discoveryURL, err)
	}

	if doc.Issuer != expectedIssuer {
		return nil, fmt.Errorf("oidc: issuer mismatch, expected %q got %q", expectedIssuer, doc.Issuer)
	}

	return &doc, nil
}
