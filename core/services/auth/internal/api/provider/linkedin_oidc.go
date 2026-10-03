package provider

import (
	"context"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/supabase/auth/internal/conf"
	"golang.org/x/oauth2"
)

const (
	defaultLinkedinOIDCAPIBase = "api.linkedin.com"
	IssuerLinkedin             = "https://www.linkedin.com/oauth"
)

type linkedinOIDCProvider struct {
	*oauth2.Config
	oidc    *oidc.Provider
	APIPath string
}

// NewLinkedinOIDCProvider creates a Linkedin account provider via OIDC.
func NewLinkedinOIDCProvider(ctx context.Context, ext conf.OAuthProviderConfiguration, scopes string, cache *OIDCProviderCache) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	apiPath := chooseHost(ext.URL, defaultLinkedinOIDCAPIBase)

	oauthScopes := []string{
		"openid",
		"email",
		"profile",
	}

	if scopes != "" {
		oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
	}

	oidcProvider, err := cache.GetProvider(ctx, IssuerLinkedin)
	if err != nil {
		return nil, err
	}

	return &linkedinOIDCProvider{
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

func (g linkedinOIDCProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return g.Exchange(ctx, code, opts...)
}

func (g linkedinOIDCProvider) RequiresPKCE() bool {
	return false
}

func (g linkedinOIDCProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	idToken := tok.Extra("id_token")
	if tok.AccessToken == "" || idToken == nil {
		return &UserProvidedData{}, nil
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
