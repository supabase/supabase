package provider

import (
	"context"
	"encoding/json"
	"errors"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"golang.org/x/oauth2"
)

// Keycloak
type keycloakProvider struct {
	*oauth2.Config
	Host string
}

type keycloakUser struct {
	Name          string                 `json:"name"`
	Sub           string                 `json:"sub"`
	Email         string                 `json:"email"`
	EmailVerified bool                   `json:"email_verified"`
	RawClaims     map[string]interface{} `json:"-"`
}

func (u *keycloakUser) UnmarshalJSON(data []byte) error {
	if err := json.Unmarshal(data, &u.RawClaims); err != nil {
		return err
	}

	// Extract known fields
	if v, ok := u.RawClaims["name"].(string); ok {
		u.Name = v
	}
	if v, ok := u.RawClaims["sub"].(string); ok {
		u.Sub = v
	}
	if v, ok := u.RawClaims["email"].(string); ok {
		u.Email = v
	}
	if v, ok := u.RawClaims["email_verified"].(bool); ok {
		u.EmailVerified = v
	}

	return nil
}

// NewKeycloakProvider creates a Keycloak account provider.
func NewKeycloakProvider(ext conf.OAuthProviderConfiguration, scopes string) (OAuthProvider, error) {
	if err := ext.ValidateOAuth(); err != nil {
		return nil, err
	}

	oauthScopes := []string{
		"profile",
		"email",
	}

	if scopes != "" {
		oauthScopes = append(oauthScopes, strings.Split(scopes, ",")...)
	}

	if ext.URL == "" {
		return nil, errors.New("unable to find URL for the Keycloak provider")
	}

	extURLlen := len(ext.URL)
	if ext.URL[extURLlen-1] == '/' {
		ext.URL = ext.URL[:extURLlen-1]
	}

	return &keycloakProvider{
		Config: &oauth2.Config{
			ClientID:     ext.ClientID[0],
			ClientSecret: ext.Secret,
			Endpoint: oauth2.Endpoint{
				AuthURL:  ext.URL + "/protocol/openid-connect/auth",
				TokenURL: ext.URL + "/protocol/openid-connect/token",
			},
			RedirectURL: ext.RedirectURI,
			Scopes:      oauthScopes,
		},
		Host: ext.URL,
	}, nil
}

func (g keycloakProvider) GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error) {
	return g.Exchange(ctx, code, opts...)
}

func (g keycloakProvider) RequiresPKCE() bool {
	return false
}

func (g keycloakProvider) GetUserData(ctx context.Context, tok *oauth2.Token) (*UserProvidedData, error) {
	var u keycloakUser

	if err := makeRequest(ctx, tok, g.Config, g.Host+"/protocol/openid-connect/userinfo", &u); err != nil {
		return nil, err
	}

	customClaims := make(map[string]interface{})
	standardClaims := map[string]bool{
		"name": true, "sub": true, "email": true, "email_verified": true,
	}

	for k, v := range u.RawClaims {
		if !standardClaims[k] {
			customClaims[k] = v
		}
	}

	data := &UserProvidedData{}
	if u.Email != "" {
		data.Emails = []Email{{
			Email:    u.Email,
			Verified: u.EmailVerified,
			Primary:  true,
		}}
	}

	data.Metadata = &Claims{
		Issuer:        g.Host,
		Subject:       u.Sub,
		Name:          u.Name,
		Email:         u.Email,
		EmailVerified: u.EmailVerified,
		CustomClaims:  customClaims,

		// To be deprecated
		FullName:   u.Name,
		ProviderId: u.Sub,
	}

	return data, nil

}
