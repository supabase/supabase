package provider

import (
	"context"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"golang.org/x/oauth2"
)

const (
	defaultLinkedinAPIBase = "api.linkedin.com"
)

type linkedinProvider struct {
	*oauth2.Config
	APIPath      string
	UserInfoURL  string
	UserEmailUrl string
}

// See https://docs.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin?context=linkedin/consumer/context
// for retrieving a member's profile. This requires the r_liteprofile scope.
type linkedinUser struct {
	ID        string       `json:"id"`
	FirstName linkedinName `json:"firstName"`
	LastName  linkedinName `json:"lastName"`
	AvatarURL struct {
		DisplayImage struct {
			Elements []struct {
				Identifiers []struct {
					Identifier string `json:"identifier"`
				} `json:"identifiers"`
			} `json:"elements"`
		} `json:"displayImage~"`
	} `json:"profilePicture"`
}

func (u *linkedinUser) getAvatarUrl() string {
	avatarURL := ""
	if len(u.AvatarURL.DisplayImage.Elements) > 0 {
		avatarURL = u.AvatarURL.DisplayImage.Elements[0].Identifiers[0].Identifier
	}
	return avatarURL
}

type linkedinName struct {
	Localized       interface{}    `json:"localized"`
	PreferredLocale linkedinLocale `json:"preferredLocale"`
}

type linkedinLocale struct {
	Country  string `json:"country"`
	Language string `json:"language"`
}

// See https://docs.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin?context=linkedin/consumer/context#retrieving-member-email-address
// for retrieving a member email address. This requires the r_email_address scope.
type linkedinElements struct {
	Elements []struct {
		Handle      string `json:"handle"`
		HandleTilde struct {
			EmailAddress string `json:"emailAddress"`
		} `json:"handle~"`
	} `json:"elements"`
}

// NewLinkedinProvider creates a Linkedin account provider.
func NewLinkedinProvider(ext conf.OAuthProviderConfiguration, scopes string) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	apiPath := chooseHost(ext.URL, defaultLinkedinAPIBase)

	oauthScopes := []string{
		"r_emailaddress",
		"r_liteprofile",
	}

	if scopes != "" {
		oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
	}

	return &linkedinProvider{
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

func (g linkedinProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return g.Exchange(ctx, code, opts...)
}

func (g linkedinProvider) RequiresPKCE() bool {
	return false
}

func GetName(name linkedinName) string {
	key := name.PreferredLocale.Language + "_" + name.PreferredLocale.Country
	myMap := name.Localized.(map[string]interface{})
	return myMap[key].(string)
}

func (g linkedinProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	var u linkedinUser
	if err := makeRequest(ctx, tok, g.Config, g.APIPath+"/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))", &u); err != nil {
		return nil, err
	}

	var e linkedinElements
	// Note: Use primary contact api for handling phone numbers
	if err := makeRequest(ctx, tok, g.Config, g.APIPath+"/v2/emailAddress?q=members&projection=(elements*(handle~))", &e); err != nil {
		return nil, err
	}

	data := &UserProvidedData{}

	if e.Elements[0].HandleTilde.EmailAddress != "" {
		// linkedin only returns the primary email which is verified for the r_emailaddress scope.
		data.Emails = []Email{{
			Email:    e.Elements[0].HandleTilde.EmailAddress,
			Primary:  true,
			Verified: true,
		}}
	}

	avatarURL := u.getAvatarUrl()

	data.Metadata = &Claims{
		Issuer:        g.APIPath,
		Subject:       u.ID,
		Name:          strings.TrimSpace(GetName(u.FirstName) + " " + GetName(u.LastName)),
		Picture:       avatarURL,
		Email:         e.Elements[0].HandleTilde.EmailAddress,
		EmailVerified: true,

		// To be deprecated
		AvatarURL:  avatarURL,
		FullName:   strings.TrimSpace(GetName(u.FirstName) + " " + GetName(u.LastName)),
		ProviderId: u.ID,
	}
	return data, nil
}
