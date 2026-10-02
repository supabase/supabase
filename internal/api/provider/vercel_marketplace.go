package provider

import (
	"context"
	"errors"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/supabase/auth/internal/conf"
	"golang.org/x/oauth2"
)

const (
	defaultVercelMarketplaceAPIBase = "api.vercel.com"
	IssuerVercelMarketplace         = "https://marketplace.vercel.com"
)

type vercelMarketplaceProvider struct {
	*oauth2.Config
	oidc    *oidc.Provider
	APIPath string
}

// NewVercelMarketplaceProvider creates a VercelMarketplace account provider via OIDC.
func NewVercelMarketplaceProvider(ctx context.Context, ext conf.OAuthProviderConfiguration, scopes string, cache *OIDCProviderCache) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	apiPath := chooseHost(ext.URL, defaultVercelMarketplaceAPIBase)

	oauthScopes := []string{}

	if scopes != "" {
		oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
	}

	oidcProvider, err := cache.GetProvider(ctx, IssuerVercelMarketplace)
	if err != nil {
		return nil, err
	}

	return &vercelMarketplaceProvider{
		oidc: oidcProvider,
		Config: &oauth2.Config{
			ClientID:     ext.ClientID[0],
			ClientSecret: ext.Secret,
			Endpoint: oauth2.Endpoint{
				AuthURL:  apiPath + "/oauth/v2/authorization",
				TokenURL: apiPath + "/oauth/v2/accessToken",
			},
			Scopes:      oauthScopes,
			RedirectURL: ext.RedirectURI,
		},
		APIPath: apiPath,
	}, nil
}

func (g vercelMarketplaceProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return g.Exchange(ctx, code, opts...)
}

func (g vercelMarketplaceProvider) RequiresPKCE() bool {
	return false
}

func (g vercelMarketplaceProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	idToken := tok.Extra("id_token")
	if tok.AccessToken == "" || idToken == nil {
		return nil, errors.New("vercel_marketplace: no OIDC ID token present in response")
	}

	_, data, err := ParseIDToken(ctx, g.oidc, &oidc.Config{
		ClientID: g.ClientID,
	}, idToken.(string), ParseIDTokenOptions{
		AccessToken: tok.AccessToken,
	})
	if err != nil {
		return nil, err
	}
	return data, nil
}
