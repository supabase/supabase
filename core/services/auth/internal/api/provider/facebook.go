package provider

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"golang.org/x/oauth2"
)

const IssuerFacebook = "https://www.facebook.com"

const (
	defaultFacebookAuthBase  = "www.facebook.com"
	defaultFacebookTokenBase = "graph.facebook.com" //#nosec G101 -- Not a secret value.
	defaultFacebookAPIBase   = "graph.facebook.com"
)

type facebookProvider struct {
	*oauth2.Config
	ProfileURL string
}

type facebookUser struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Alias     string `json:"name"`
	Avatar    struct {
		Data struct {
			URL string `json:"url"`
		} `json:"data"`
	} `json:"picture"`
}

// NewFacebookProvider creates a Facebook account provider.
func NewFacebookProvider(ext conf.OAuthProviderConfiguration, scopes string) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	authHost := chooseHost(ext.URL, defaultFacebookAuthBase)
	tokenHost := chooseHost(ext.URL, defaultFacebookTokenBase)
	profileURL := chooseHost(ext.URL, defaultFacebookAPIBase) + "/me?fields=email,first_name,last_name,name,picture"

	oauthScopes := []string{
		"email",
	}

	if scopes != "" {
		oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
	}

	return &facebookProvider{
		Config: &oauth2.Config{
			ClientID:     ext.ClientID[0],
			ClientSecret: ext.Secret,
			RedirectURL:  ext.RedirectURI,
			Endpoint: oauth2.Endpoint{
				AuthURL:  authHost + "/dialog/oauth",
				TokenURL: tokenHost + "/oauth/access_token",
			},
			Scopes: oauthScopes,
		},
		ProfileURL: profileURL,
	}, nil
}

func (p facebookProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return p.Exchange(ctx, code, opts...)
}

func (p facebookProvider) RequiresPKCE() bool {
	return false
}

func (p facebookProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	hash := hmac.New(sha256.New, []byte(p.ClientSecret))
	hash.Write([]byte(tok.AccessToken))
	appsecretProof := hex.EncodeToString(hash.Sum(nil))

	var u facebookUser
	url := p.ProfileURL + "&appsecret_proof=" + appsecretProof
	if err := makeRequest(ctx, tok, p.Config, url, &u); err != nil {
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
		Issuer:   p.ProfileURL,
		Subject:  u.ID,
		Name:     strings.TrimSpace(u.FirstName + " " + u.LastName),
		NickName: u.Alias,
		Picture:  u.Avatar.Data.URL,

		// To be deprecated
		Slug:       u.Alias,
		AvatarURL:  u.Avatar.Data.URL,
		FullName:   strings.TrimSpace(u.FirstName + " " + u.LastName),
		ProviderId: u.ID,
	}

	return data, nil
}
