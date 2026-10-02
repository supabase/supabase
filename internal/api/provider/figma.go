package provider

import (
	"context"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"golang.org/x/oauth2"
)

// Figma
// Reference: https://www.figma.com/developers/api#oauth2

const (
	defaultFigmaAuthBase = "www.figma.com"
	defaultFigmaAPIBase  = "api.figma.com"
)

type figmaProvider struct {
	*oauth2.Config
	APIHost string
}

type figmaUser struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"handle"`
	AvatarURL string `json:"img_url"`
}

// NewFigmaProvider creates a Figma account provider.
func NewFigmaProvider(ext conf.OAuthProviderConfiguration, scopes string) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	authHost := chooseHost(ext.URL, defaultFigmaAuthBase)
	apiHost := chooseHost(ext.URL, defaultFigmaAPIBase)

	oauthScopes := []string{
		"current_user:read",
	}

	if scopes != "" {
		oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
	}

	return &figmaProvider{
		Config: &oauth2.Config{
			ClientID:     ext.ClientID[0],
			ClientSecret: ext.Secret,
			Endpoint: oauth2.Endpoint{
				AuthURL:  authHost + "/oauth",
				TokenURL: apiHost + "/v1/oauth/token",
			},
			RedirectURL: ext.RedirectURI,
			Scopes:      oauthScopes,
		},
		APIHost: apiHost,
	}, nil
}

func (p figmaProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return p.Exchange(ctx, code, opts...)
}

func (p figmaProvider) RequiresPKCE() bool {
	return false
}

func (p figmaProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	var u figmaUser
	if err := makeRequest(ctx, tok, p.Config, p.APIHost+"/v1/me", &u); err != nil {
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
		Issuer:        p.APIHost,
		Subject:       u.ID,
		Name:          u.Name,
		Email:         u.Email,
		EmailVerified: true,

		// To be deprecated
		AvatarURL:  u.AvatarURL,
		FullName:   u.Name,
		ProviderId: u.ID,
	}
	return data, nil
}
