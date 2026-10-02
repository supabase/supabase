package provider

import (
	"context"
	"strconv"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"golang.org/x/oauth2"
)

const (
	defaultKakaoAuthBase = "kauth.kakao.com"
	defaultKakaoAPIBase  = "kapi.kakao.com"
	IssuerKakao          = "https://kauth.kakao.com"
)

type kakaoProvider struct {
	*oauth2.Config
	APIHost string
}

type kakaoUser struct {
	ID      int `json:"id"`
	Account struct {
		Profile struct {
			Name            string `json:"nickname"`
			ProfileImageURL string `json:"profile_image_url"`
		} `json:"profile"`
		Email         string `json:"email"`
		EmailValid    bool   `json:"is_email_valid"`
		EmailVerified bool   `json:"is_email_verified"`
	} `json:"kakao_account"`
}

func (p kakaoProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return p.Exchange(ctx, code, opts...)
}

func (p kakaoProvider) RequiresPKCE() bool {
	return false
}

func (p kakaoProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	var u kakaoUser

	if err := makeRequest(ctx, tok, p.Config, p.APIHost+"/v2/user/me", &u); err != nil {
		return nil, err
	}

	data := &UserProvidedData{}

	if u.Account.Email != "" {
		data.Emails = []Email{
			{
				Email:    u.Account.Email,
				Verified: u.Account.EmailVerified && u.Account.EmailValid,
				Primary:  true,
			},
		}
	}

	data.Metadata = &Claims{
		Issuer:  p.APIHost,
		Subject: strconv.Itoa(u.ID),

		Name:              u.Account.Profile.Name,
		PreferredUsername: u.Account.Profile.Name,

		// To be deprecated
		AvatarURL:   u.Account.Profile.ProfileImageURL,
		FullName:    u.Account.Profile.Name,
		ProviderId:  strconv.Itoa(u.ID),
		UserNameKey: u.Account.Profile.Name,
	}
	return data, nil
}

func NewKakaoProvider(ext conf.OAuthProviderConfiguration, scopes string) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	authHost := chooseHost(ext.URL, defaultKakaoAuthBase)
	apiHost := chooseHost(ext.URL, defaultKakaoAPIBase)

	oauthScopes := []string{
		"account_email",
		"profile_image",
		"profile_nickname",
	}

	if scopes != "" {
		oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
	}

	return &kakaoProvider{
		Config: &oauth2.Config{
			ClientID:     ext.ClientID[0],
			ClientSecret: ext.Secret,
			Endpoint: oauth2.Endpoint{
				AuthStyle: oauth2.AuthStyleInParams,
				AuthURL:   authHost + "/oauth/authorize",
				TokenURL:  authHost + "/oauth/token",
			},
			RedirectURL: ext.RedirectURI,
			Scopes:      oauthScopes,
		},
		APIHost: apiHost,
	}, nil
}
