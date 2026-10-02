package provider

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/supabase/auth/internal/conf"
	"golang.org/x/oauth2"
)

const IssuerAzureCommon = "https://login.microsoftonline.com/common/v2.0"
const IssuerAzureOrganizations = "https://login.microsoftonline.com/organizations/v2.0"

// IssuerAzureMicrosoft is the OIDC issuer for microsoft.com accounts:
// https://learn.microsoft.com/en-us/azure/active-directory/develop/id-token-claims-reference#payload-claims
const IssuerAzureMicrosoft = "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0"

const (
	defaultAzureAuthBase = "login.microsoftonline.com/common"
)

type azureProvider struct {
	*oauth2.Config

	// ExpectedIssuer contains the OIDC issuer that should be expected when
	// the authorize flow completes. For example, when using the "common"
	// endpoint the authorization flow will end with an ID token that
	// contains any issuer. In this case, ExpectedIssuer is an empty
	// string, because any issuer is allowed. But if a developer sets up a
	// tenant-specific authorization endpoint, then we must ensure that the
	// ID token received is issued by that specific issuer, and so
	// ExpectedIssuer contains the issuer URL of that tenant.
	ExpectedIssuer string

	cache *OIDCProviderCache
}

var azureIssuerRegexp = regexp.MustCompile("^https://login[.]microsoftonline[.]com/([^/]+)/v2[.]0/?$")
var azureCIAMIssuerRegexp = regexp.MustCompile("^https://[a-z0-9-]+[.]ciamlogin[.]com/([^/]+)/v2[.]0/?$")

func IsAzureIssuer(issuer string) bool {
	return azureIssuerRegexp.MatchString(issuer)
}

func IsAzureCIAMIssuer(issuer string) bool {
	return azureCIAMIssuerRegexp.MatchString(issuer)
}

// NewAzureProvider creates a Azure account provider.
func NewAzureProvider(ext conf.OAuthProviderConfiguration, scopes string, cache *OIDCProviderCache) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	oauthScopes := []string{"openid"}

	if scopes != "" {
		oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
	}

	authHost := chooseHost(ext.URL, defaultAzureAuthBase)
	expectedIssuer := ""

	if ext.URL != "" {
		expectedIssuer = authHost + "/v2.0"

		if (!IsAzureIssuer(expectedIssuer) && !IsAzureCIAMIssuer(expectedIssuer)) || expectedIssuer == IssuerAzureCommon || expectedIssuer == IssuerAzureOrganizations {
			// in tests, the URL is a local server which should not
			// be the expected issuer
			// also, IssuerAzure (common) never actually issues any
			// ID tokens so it needs to be ignored
			expectedIssuer = ""
		}
	}

	return &azureProvider{
		Config: &oauth2.Config{
			ClientID:     ext.ClientID[0],
			ClientSecret: ext.Secret,
			Endpoint: oauth2.Endpoint{
				AuthURL:  authHost + "/oauth2/v2.0/authorize",
				TokenURL: authHost + "/oauth2/v2.0/token",
			},
			RedirectURL: ext.RedirectURI,
			Scopes:      oauthScopes,
		},
		ExpectedIssuer: expectedIssuer,
		cache:          cache,
	}, nil
}

func (g azureProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return g.Exchange(ctx, code, opts...)
}

func (g azureProvider) RequiresPKCE() bool {
	return false
}

func DetectAzureIDTokenIssuer(ctx context.Context, idToken string) (string, error) {
	var payload struct {
		Issuer string `json:"iss"`
	}

	parts := strings.Split(idToken, ".")
	if len(parts) != 3 {
		return "", fmt.Errorf("azure: invalid ID token")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("azure: invalid ID token %w", err)
	}

	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return "", fmt.Errorf("azure: invalid ID token %w", err)
	}

	return payload.Issuer, nil
}

func (g azureProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	idToken := tok.Extra("id_token")

	if idToken != nil {
		issuer, err := DetectAzureIDTokenIssuer(ctx, idToken.(string))
		if err != nil {
			return nil, err
		}

		// Allow basic Azure issuers, except when the expected issuer
		// is configured to be the Azure CIAM issuer, allow CIAM
		// issuers to pass.
		if !IsAzureIssuer(issuer) && (IsAzureCIAMIssuer(g.ExpectedIssuer) && !IsAzureCIAMIssuer(issuer)) {
			return nil, fmt.Errorf("azure: ID token issuer not valid %q", issuer)
		}

		if g.ExpectedIssuer != "" && issuer != g.ExpectedIssuer {
			// Since ExpectedIssuer was set, then the developer had
			// setup GoTrue to use the tenant-specific
			// authorization endpoint, which in-turn means that
			// only those tenant's ID tokens will be accepted.
			return nil, fmt.Errorf("azure: ID token issuer %q does not match expected issuer %q", issuer, g.ExpectedIssuer)
		}

		provider, err := g.cache.GetProvider(ctx, issuer)
		if err != nil {
			return nil, err
		}

		_, data, err := ParseIDToken(ctx, provider, &oidc.Config{
			ClientID: g.ClientID,
		}, idToken.(string), ParseIDTokenOptions{
			AccessToken: tok.AccessToken,
		})
		if err != nil {
			return nil, err
		}

		return data, nil
	}

	// Only ID tokens supported, UserInfo endpoint has a history of being less secure.

	return nil, fmt.Errorf("azure: no OIDC ID token present in response")
}
