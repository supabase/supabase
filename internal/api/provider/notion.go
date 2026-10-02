package provider

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/utilities"
	"golang.org/x/oauth2"
)

const (
	defaultNotionApiBase = "api.notion.com"
	notionApiVersion     = "2021-08-16"
)

type notionProvider struct {
	*oauth2.Config
	APIPath string
}

type notionUser struct {
	Bot struct {
		Owner struct {
			User struct {
				ID        string `json:"id"`
				Name      string `json:"name"`
				AvatarURL string `json:"avatar_url"`
				Person    struct {
					Email string `json:"email"`
				} `json:"person"`
			} `json:"user"`
		} `json:"owner"`
	} `json:"bot"`
}

// NewNotionProvider creates a Notion account provider.
func NewNotionProvider(ext conf.OAuthProviderConfiguration) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	authHost := chooseHost(ext.URL, defaultNotionApiBase)

	return &notionProvider{
		Config: &oauth2.Config{
			ClientID:     ext.ClientID[0],
			ClientSecret: ext.Secret,
			Endpoint: oauth2.Endpoint{
				AuthURL:  authHost + "/v1/oauth/authorize",
				TokenURL: authHost + "/v1/oauth/token",
			},
			RedirectURL: ext.RedirectURI,
		},
		APIPath: authHost,
	}, nil
}

func (g notionProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return g.Exchange(ctx, code, opts...)
}

func (g notionProvider) RequiresPKCE() bool {
	return false
}

func (g notionProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	var u notionUser

	// Perform http request, because we need to set the Notion-Version header
	req, err := http.NewRequest("GET", g.APIPath+"/v1/users/me", nil)

	if err != nil {
		return nil, err
	}

	// set headers
	req.Header.Set("Notion-Version", notionApiVersion)
	req.Header.Set("Authorization", "Bearer "+tok.AccessToken)

	client := &http.Client{Timeout: defaultTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer utilities.SafeClose(resp.Body)

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return nil, fmt.Errorf("a %v error occurred with retrieving user from notion", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(body, &u)
	if err != nil {
		return nil, err
	}

	data := &UserProvidedData{}
	if u.Bot.Owner.User.Person.Email != "" {
		data.Emails = []Email{{
			Email:    u.Bot.Owner.User.Person.Email,
			Verified: true, // Notion dosen't provide data on if email is verified.
			Primary:  true,
		}}
	}

	data.Metadata = &Claims{
		Issuer:  g.APIPath,
		Subject: u.Bot.Owner.User.ID,
		Name:    u.Bot.Owner.User.Name,
		Picture: u.Bot.Owner.User.AvatarURL,

		// To be deprecated
		AvatarURL:  u.Bot.Owner.User.AvatarURL,
		FullName:   u.Bot.Owner.User.Name,
		ProviderId: u.Bot.Owner.User.ID,
	}
	return data, nil
}
