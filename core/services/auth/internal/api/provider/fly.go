package provider

import (
	"context"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"golang.org/x/oauth2"
)

const (
	defaultFlyAPIBase = "api.fly.io"
)

type flyProvider struct {
	*oauth2.Config
	APIPath string
}

type flyUser struct {
	ResourceOwnerID string `json:"resource_owner_id"`
	UserID          string `json:"user_id"`
	UserName        string `json:"user_name"`
	Email           string `json:"email"`
	Organizations   []struct {
		ID   string `json:"id"`
		Role string `json:"role"`
	} `json:"organizations"`
	Scope       []string          `json:"scope"`
	Application map[string]string `json:"application"`
	ExpiresIn   int               `json:"expires_in"`
	CreatedAt   int               `json:"created_at"`
}

// NewFlyProvider creates a Fly oauth provider.
func NewFlyProvider(ext conf.OAuthProviderConfiguration, scopes string) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	authHost := chooseHost(ext.URL, defaultFlyAPIBase)

	// Fly only provides the "read" scope.
	// https://fly.io/docs/reference/extensions_api/#single-sign-on-flow
	oauthScopes := []string{
		"read",
	}

	if scopes != "" {
		oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
	}

	return &flyProvider{
		Config: &oauth2.Config{
			ClientID:     ext.ClientID[0],
			ClientSecret: ext.Secret,
			Endpoint: oauth2.Endpoint{
				AuthURL:  authHost + "/oauth/authorize",
				TokenURL: authHost + "/oauth/token",
			},
			RedirectURL: ext.RedirectURI,
			Scopes:      oauthScopes,
		},
		APIPath: authHost,
	}, nil
}

func (p flyProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return p.Exchange(ctx, code, opts...)
}

func (p flyProvider) RequiresPKCE() bool {
	return false
}

func (p flyProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	var u flyUser
	if err := makeRequest(ctx, tok, p.Config, p.APIPath+"/oauth/token/info", &u); err != nil {
		return nil, err
	}

	data := &UserProvidedData{}
	if u.Email != "" {
		data.Emails = []Email{{
			Email:    u.Email,
			Verified: true,
			Primary:  true,
		}}
	}

	data.Metadata = &Claims{
		Issuer:        p.APIPath,
		Subject:       u.UserID,
		FullName:      u.UserName,
		Email:         u.Email,
		EmailVerified: true,
		ProviderId:    u.UserID,
		CustomClaims: map[string]interface{}{
			"resource_owner_id": u.ResourceOwnerID,
			"organizations":     u.Organizations,
			"application":       u.Application,
			"scope":             u.Scope,
			"created_at":        u.CreatedAt,
		},
	}
	return data, nil
}
