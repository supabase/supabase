package provider

import (
	"context"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"golang.org/x/oauth2"
)

const defaultSlackOIDCApiBase = "slack.com"

type slackOIDCProvider struct {
	*oauth2.Config
	APIPath string
}

type slackOIDCUser struct {
	ID            string `json:"https://slack.com/user_id"`
	TeamID        string `json:"https://slack.com/team_id"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name"`
	AvatarURL     string `json:"picture"`
}

// NewSlackOIDCProvider creates a Slack account provider with Sign in with Slack.
func NewSlackOIDCProvider(ext conf.OAuthProviderConfiguration, scopes string) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	apiPath := chooseHost(ext.URL, defaultSlackOIDCApiBase) + "/api"
	authPath := chooseHost(ext.URL, defaultSlackOIDCApiBase) + "/openid"

	// these are required scopes for slack's OIDC flow
	// see https://api.slack.com/authentication/sign-in-with-slack#implementation
	oauthScopes := []string{
		"profile",
		"email",
		"openid",
	}

	if scopes != "" {
		oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
	}

	return &slackOIDCProvider{
		Config: &oauth2.Config{
			ClientID:     ext.ClientID[0],
			ClientSecret: ext.Secret,
			Endpoint: oauth2.Endpoint{
				AuthURL:  authPath + "/connect/authorize",
				TokenURL: apiPath + "/openid.connect.token",
			},
			Scopes:      oauthScopes,
			RedirectURL: ext.RedirectURI,
		},
		APIPath: apiPath,
	}, nil
}

func (g slackOIDCProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return g.Exchange(ctx, code, opts...)
}

func (g slackOIDCProvider) RequiresPKCE() bool {
	return false
}

func (g slackOIDCProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	var u slackOIDCUser
	if err := makeRequest(ctx, tok, g.Config, g.APIPath+"/openid.connect.userInfo", &u); err != nil {
		return nil, err
	}

	data := &UserProvidedData{}
	if u.Email != "" {
		data.Emails = []Email{{
			Email: u.Email,
			// email_verified is returned as part of the response
			// see: https://api.slack.com/authentication/sign-in-with-slack#response
			Verified: u.EmailVerified,
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
