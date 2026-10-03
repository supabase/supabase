package provider

import (
	"context"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"golang.org/x/oauth2"
)

const (
	defaultSpotifyAPIBase  = "api.spotify.com/v1"   // Used to get user data
	defaultSpotifyAuthBase = "accounts.spotify.com" // Used for OAuth flow
)

type spotifyProvider struct {
	*oauth2.Config
	APIPath string
}

type spotifyUser struct {
	DisplayName string             `json:"display_name"`
	Avatars     []spotifyUserImage `json:"images"`
	Email       string             `json:"email"`
	ID          string             `json:"id"`
}

type spotifyUserImage struct {
	Url    string `json:"url"`
	Height int    `json:"height"`
	Width  int    `json:"width"`
}

// NewSpotifyProvider creates a Spotify account provider.
func NewSpotifyProvider(ext conf.OAuthProviderConfiguration, scopes string) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	apiPath := chooseHost(ext.URL, defaultSpotifyAPIBase)
	authPath := chooseHost(ext.URL, defaultSpotifyAuthBase)

	oauthScopes := []string{
		"user-read-email",
	}

	if scopes != "" {
		oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
	}

	return &spotifyProvider{
		Config: &oauth2.Config{
			ClientID:     ext.ClientID[0],
			ClientSecret: ext.Secret,
			Endpoint: oauth2.Endpoint{
				AuthURL:  authPath + "/authorize",
				TokenURL: authPath + "/api/token",
			},
			Scopes:      oauthScopes,
			RedirectURL: ext.RedirectURI,
		},
		APIPath: apiPath,
	}, nil
}

func (g spotifyProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return g.Exchange(ctx, code, opts...)
}

func (g spotifyProvider) RequiresPKCE() bool {
	return false
}

func (g spotifyProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	var u spotifyUser
	if err := makeRequest(ctx, tok, g.Config, g.APIPath+"/me", &u); err != nil {
		return nil, err
	}

	data := &UserProvidedData{}
	if u.Email != "" {
		data.Emails = []Email{{
			Email: u.Email,
			// Spotify dosen't provide data on whether the user's email is verified.
			// https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile
			Verified: false,
			Primary:  true,
		}}
	}

	var avatarURL string

	// Spotify returns a list of avatars, we want to use the largest one
	if len(u.Avatars) >= 1 {
		largestAvatar := u.Avatars[0]

		for _, avatar := range u.Avatars {
			if avatar.Height*avatar.Width > largestAvatar.Height*largestAvatar.Width {
				largestAvatar = avatar
			}
		}

		avatarURL = largestAvatar.Url
	}

	data.Metadata = &Claims{
		Issuer:  g.APIPath,
		Subject: u.ID,
		Name:    u.DisplayName,
		Picture: avatarURL,

		// To be deprecated
		AvatarURL:  avatarURL,
		FullName:   u.DisplayName,
		ProviderId: u.ID,
	}
	return data, nil
}
