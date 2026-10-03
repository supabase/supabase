package provider

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"golang.org/x/oauth2"
)

const (
	defaultDiscordAPIBase = "discord.com"
)

type discordProvider struct {
	*oauth2.Config
	APIPath string
}

type discordUser struct {
	Avatar        string `json:"avatar"`
	Discriminator string `json:"discriminator"`
	Email         string `json:"email"`
	ID            string `json:"id"`
	Name          string `json:"username"`
	GlobalName    string `json:"global_name"`
	Verified      bool   `json:"verified"`
}

// NewDiscordProvider creates a Discord account provider.
func NewDiscordProvider(ext conf.OAuthProviderConfiguration, scopes string) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	apiPath := chooseHost(ext.URL, defaultDiscordAPIBase) + "/api"

	oauthScopes := []string{
		"email",
		"identify",
	}

	if scopes != "" {
		oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
	}

	return &discordProvider{
		Config: &oauth2.Config{
			ClientID:     ext.ClientID[0],
			ClientSecret: ext.Secret,
			Endpoint: oauth2.Endpoint{
				AuthURL:  apiPath + "/oauth2/authorize",
				TokenURL: apiPath + "/oauth2/token",
			},
			Scopes:      oauthScopes,
			RedirectURL: ext.RedirectURI,
		},
		APIPath: apiPath,
	}, nil
}

func (g discordProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return g.Exchange(ctx, code, opts...)
}

func (g discordProvider) RequiresPKCE() bool {
	return false
}

func (g discordProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	var u discordUser
	if err := makeRequest(ctx, tok, g.Config, g.APIPath+"/users/@me", &u); err != nil {
		return nil, err
	}

	data := &UserProvidedData{}
	if u.Email != "" {
		data.Emails = []Email{{
			Email:    u.Email,
			Verified: u.Verified,
			Primary:  true,
		}}
	}

	var avatarURL string
	extension := "png"
	if u.Avatar == "" {
		if intDiscriminator, err := strconv.Atoi(u.Discriminator); err != nil {
			return nil, err
		} else {
			// https://discord.com/developers/docs/reference#image-formatting-cdn-endpoints:
			// In the case of the Default User Avatar endpoint, the value for
			// user_discriminator in the path should be the user's discriminator modulo 5
			avatarURL = fmt.Sprintf("https://cdn.discordapp.com/embed/avatars/%d.%s", intDiscriminator%5, extension)
		}
	} else {
		// https://discord.com/developers/docs/reference#image-formatting:
		// "In the case of endpoints that support GIFs, the hash will begin with a_
		// if it is available in GIF format."
		if strings.HasPrefix(u.Avatar, "a_") {
			extension = "gif"
		}
		avatarURL = fmt.Sprintf("https://cdn.discordapp.com/avatars/%s/%s.%s", u.ID, u.Avatar, extension)
	}

	data.Metadata = &Claims{
		Issuer:  g.APIPath,
		Subject: u.ID,
		Name:    fmt.Sprintf("%v#%v", u.Name, u.Discriminator),
		Picture: avatarURL,
		CustomClaims: map[string]interface{}{
			"global_name": u.GlobalName,
		},

		// To be deprecated
		AvatarURL:  avatarURL,
		FullName:   u.Name,
		ProviderId: u.ID,
	}

	return data, nil
}
