package provider

import (
	"context"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"golang.org/x/oauth2"
)

const defaultSlackApiBase = "slack.com"

type slackProvider struct {
	*oauth2.Config
	APIPath string
}

type slackUser struct {
	ID        string `json:"https://slack.com/user_id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	AvatarURL string `json:"picture"`
	TeamID    string `json:"https://slack.com/team_id"`
}

// NewSlackProvider creates a Slack account provider with Legacy Slack OAuth.
func NewSlackProvider(ext conf.OAuthProviderConfiguration, scopes string) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	apiPath := chooseHost(ext.URL, defaultSlackApiBase) + "/api"
	authPath := chooseHost(ext.URL, defaultSlackApiBase) + "/oauth"

	oauthScopes := []string{
		"profile",
		"email",
		"openid",
	}

	if scopes != "" {
		oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
	}

	return &slackProvider{
		Config: &oauth2.Config{
			ClientID:     ext.ClientID[0],
			ClientSecret: ext.Secret,
			Endpoint: oauth2.Endpoint{
				AuthURL:  authPath + "/authorize",
				TokenURL: apiPath + "/oauth.access",
			},
			Scopes:      oauthScopes,
			RedirectURL: ext.RedirectURI,
		},
		APIPath: apiPath,
	}, nil
}

func (g slackProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return g.Exchange(ctx, code, opts...)
}

func (g slackProvider) RequiresPKCE() bool {
	return false
}

func (g slackProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	var u slackUser
	if err := makeRequest(ctx, tok, g.Config, g.APIPath+"/openid.connect.userInfo", &u); err != nil {
		return nil, err
	}

	data := &UserProvidedData{}
	if u.Email != "" {
		data.Emails = []Email{{
			Email:    u.Email,
			Verified: true, // Slack doesn't provide data on if email is verified.
			Primary:  true,
		}}
	}

	data.Metadata = &Claims{
		Issuer:  g.APIPath,
		Subject: u.ID,
		Name:    u.Name,
		Picture: u.AvatarURL,
		CustomClaims: map[string]interface{}{
			"https://slack.com/team_id": u.TeamID,
		},

		// To be deprecated
		AvatarURL:  u.AvatarURL,
		FullName:   u.Name,
		ProviderId: u.ID,
	}
	return data, nil
}
