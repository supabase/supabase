package provider

import (
	"context"
	"strconv"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"golang.org/x/oauth2"
)

// Gitlab

const defaultGitLabAuthBase = "gitlab.com"

type gitlabProvider struct {
	*oauth2.Config
	Host string
}

type gitlabUser struct {
	Email       string `json:"email"`
	Name        string `json:"name"`
	AvatarURL   string `json:"avatar_url"`
	ConfirmedAt string `json:"confirmed_at"`
	ID          int    `json:"id"`
}

type gitlabUserEmail struct {
	ID    int    `json:"id"`
	Email string `json:"email"`
}

// NewGitlabProvider creates a Gitlab account provider.
func NewGitlabProvider(ext conf.OAuthProviderConfiguration, scopes string) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	oauthScopes := []string{
		"read_user",
	}

	if scopes != "" {
		oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
	}

	host := chooseHost(ext.URL, defaultGitLabAuthBase)
	return &gitlabProvider{
		Config: &oauth2.Config{
			ClientID:     ext.ClientID[0],
			ClientSecret: ext.Secret,
			Endpoint: oauth2.Endpoint{
				AuthURL:  host + "/oauth/authorize",
				TokenURL: host + "/oauth/token",
			},
			RedirectURL: ext.RedirectURI,
			Scopes:      oauthScopes,
		},
		Host: host,
	}, nil
}

func (g gitlabProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return g.Exchange(ctx, code, opts...)
}

func (g gitlabProvider) RequiresPKCE() bool {
	return false
}

func (g gitlabProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	var u gitlabUser

	if err := makeRequest(ctx, tok, g.Config, g.Host+"/api/v4/user", &u); err != nil {
		return nil, err
	}

	data := &UserProvidedData{}

	var emails []*gitlabUserEmail
	if err := makeRequest(ctx, tok, g.Config, g.Host+"/api/v4/user/emails", &emails); err != nil {
		return nil, err
	}

	for _, e := range emails {
		// additional emails from GitLab don't return confirm status
		if e.Email != "" {
			data.Emails = append(data.Emails, Email{Email: e.Email, Verified: false, Primary: false})
		}
	}

	if u.Email != "" {
		verified := u.ConfirmedAt != ""
		data.Emails = append(data.Emails, Email{Email: u.Email, Verified: verified, Primary: true})
	}

	data.Metadata = &Claims{
		Issuer:  g.Host,
		Subject: strconv.Itoa(u.ID),
		Name:    u.Name,
		Picture: u.AvatarURL,

		// To be deprecated
		AvatarURL:  u.AvatarURL,
		FullName:   u.Name,
		ProviderId: strconv.Itoa(u.ID),
	}

	return data, nil
}
