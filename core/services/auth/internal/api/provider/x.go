package provider

import (
	"context"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"golang.org/x/oauth2"
)

// X (formerly Twitter) API v2 OAuth 2.0 endpoints
// See: https://developer.x.com/en/docs/authentication/oauth-2-0/authorization-code
const (
	defaultXAuthBase = "x.com"
	defaultXAPIBase  = "api.x.com"
)

type xProvider struct {
	*oauth2.Config
	APIHost string
}

// xUser represents the user object from X API v2
// See: https://developer.x.com/en/docs/twitter-api/users/lookup/api-reference/get-users-me
type xUser struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Username        string `json:"username"`
	ConfirmedEmail  string `json:"confirmed_email"`
	ProfileImageURL string `json:"profile_image_url"`
	URL             string `json:"url"`
	CreatedAt       string `json:"created_at"`
}

// xUserResponse is the wrapper for the X API v2 response
type xUserResponse struct {
	Data xUser `json:"data"`
}

// NewXProvider creates an X (formerly Twitter) v2 OAuth 2.0 provider.
// This uses OAuth 2.0 with PKCE instead of OAuth 1.0a.
// See: https://developer.x.com/en/docs/authentication/oauth-2-0/authorization-code
func NewXProvider(ext conf.OAuthProviderConfiguration, scopes string) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	authHost := chooseHost(ext.URL, defaultXAuthBase)
	apiHost := chooseHost(ext.URL, defaultXAPIBase)

	// Default scopes for user authentication
	// users.email: Access to the user's email address (confirmed_email field)
	// users.read: Read user profile information
	// tweet.read: Required scope for OAuth 2.0 user context even if not accessing tweets
	// offline.access: Get refresh tokens for long-lived access
	// See: https://developer.x.com/en/docs/authentication/oauth-2-0/authorization-code
	// and: https://docs.x.com/fundamentals/authentication/guides/v2-authentication-mapping
	oauthScopes := []string{
		"users.email",
		"tweet.read",
		"users.read",
		"offline.access",
	}

	if scopes != "" {
		oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
	}

	return &xProvider{
		Config: &oauth2.Config{
			ClientID:     ext.ClientID[0],
			ClientSecret: ext.Secret,
			Endpoint: oauth2.Endpoint{
				AuthURL:  authHost + "/i/oauth2/authorize",
				TokenURL: apiHost + "/2/oauth2/token",
			},
			RedirectURL: ext.RedirectURI,
			Scopes:      oauthScopes,
		},
		APIHost: apiHost,
	}, nil
}

func (x xProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return x.Exchange(ctx, code, opts...)
}

func (x xProvider) RequiresPKCE() bool {
	return true
}

func (x xProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	var resp xUserResponse

	// See: https://developer.x.com/en/docs/twitter-api/users/lookup/api-reference/get-users-me
	userInfoURL := x.APIHost + "/2/users/me?user.fields=id,name,username,confirmed_email,profile_image_url,url,created_at"

	if err := makeRequest(ctx, tok, x.Config, userInfoURL, &resp); err != nil {
		return nil, err
	}

	u := resp.Data

	data := &UserProvidedData{
		Metadata: &Claims{
			Issuer:            x.APIHost,
			Subject:           u.ID,
			Name:              u.Name,
			PreferredUsername: u.Username,
			Picture:           u.ProfileImageURL,
			Profile:           "https://x.com/" + u.Username,
			Website:           u.URL,

			// Custom claims for X specific data
			CustomClaims: map[string]any{
				"created_at": u.CreatedAt,
			},

			// To be deprecated
			AvatarURL:   u.ProfileImageURL,
			FullName:    u.Name,
			ProviderId:  u.ID,
			UserNameKey: u.Username,
		},
	}

	if u.ConfirmedEmail != "" {
		data.Emails = []Email{{
			Email: u.ConfirmedEmail,
			// X returns only confirmed emails
			Verified: true,
			Primary:  true,
		}}
	}

	return data, nil
}
