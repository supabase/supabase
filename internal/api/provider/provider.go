package provider

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/supabase/auth/internal/utilities"
	"golang.org/x/oauth2"
)

var defaultTimeout time.Duration = time.Second * 10

func init() {
	timeoutStr := os.Getenv("GOTRUE_INTERNAL_HTTP_TIMEOUT")
	if timeoutStr != "" {
		if timeout, err := time.ParseDuration(timeoutStr); err != nil {
			log.Fatalf("error loading GOTRUE_INTERNAL_HTTP_TIMEOUT: %v", err.Error()) // #nosec G706
		} else if timeout != 0 {
			defaultTimeout = timeout
		}
	}
}

type audience []string

func (a *audience) UnmarshalJSON(b []byte) error {
	var s string
	if json.Unmarshal(b, &s) == nil {
		*a = audience{s}
		return nil
	}
	var auds []string
	if err := json.Unmarshal(b, &auds); err != nil {
		return err
	}
	*a = auds
	return nil
}

// UnixTimeOrString accepts either:
// - number: seconds since epoch (OIDC NumericDate)
// - string: RFC3339 timestamp
type UnixTimeOrString time.Time

func (t UnixTimeOrString) MarshalJSON() ([]byte, error) {
	return time.Time(t).MarshalJSON()
}

func (t *UnixTimeOrString) UnmarshalJSON(b []byte) error {
	// null
	if bytes.Equal(b, []byte("null")) {
		*t = UnixTimeOrString(time.Time{})
		return nil
	}

	// number (possibly float)
	var f float64
	if err := json.Unmarshal(b, &f); err == nil {
		sec := int64(f)
		*t = UnixTimeOrString(time.Unix(sec, 0).UTC())
		return nil
	}

	// string (RFC3339)
	var s string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}
	if s == "" {
		*t = UnixTimeOrString(time.Time{})
		return nil
	}
	if sec, err := time.Parse(time.RFC3339, s); err == nil {
		*t = UnixTimeOrString(sec.UTC())
		return nil
	}
	return &time.ParseError{Layout: time.RFC3339, Value: s}
}

type Claims struct {
	// Reserved claims
	Issuer  string   `json:"iss,omitempty" structs:"iss,omitempty"`
	Subject string   `json:"sub,omitempty" structs:"sub,omitempty"`
	Aud     audience `json:"aud,omitempty" structs:"aud,omitempty"`
	Iat     float64  `json:"iat,omitempty" structs:"iat,omitempty"`
	Exp     float64  `json:"exp,omitempty" structs:"exp,omitempty"`

	// Default profile claims
	Name              string            `json:"name,omitempty" structs:"name,omitempty"`
	FamilyName        string            `json:"family_name,omitempty" structs:"family_name,omitempty"`
	GivenName         string            `json:"given_name,omitempty" structs:"given_name,omitempty"`
	MiddleName        string            `json:"middle_name,omitempty" structs:"middle_name,omitempty"`
	NickName          string            `json:"nickname,omitempty" structs:"nickname,omitempty"`
	PreferredUsername string            `json:"preferred_username,omitempty" structs:"preferred_username,omitempty"`
	Profile           string            `json:"profile,omitempty" structs:"profile,omitempty"`
	Picture           string            `json:"picture,omitempty" structs:"picture,omitempty"`
	Website           string            `json:"website,omitempty" structs:"website,omitempty"`
	Gender            string            `json:"gender,omitempty" structs:"gender,omitempty"`
	Birthdate         string            `json:"birthdate,omitempty" structs:"birthdate,omitempty"`
	ZoneInfo          string            `json:"zoneinfo,omitempty" structs:"zoneinfo,omitempty"`
	Locale            string            `json:"locale,omitempty" structs:"locale,omitempty"`
	UpdatedAt         *UnixTimeOrString `json:"updated_at,omitempty" structs:"updated_at,omitempty"`
	Email             string            `json:"email,omitempty" structs:"email,omitempty"`
	EmailVerified     bool              `json:"email_verified,omitempty" structs:"email_verified"`
	Phone             string            `json:"phone,omitempty" structs:"phone,omitempty"`
	PhoneVerified     bool              `json:"phone_verified,omitempty" structs:"phone_verified"`

	// Custom profile claims that are provider specific
	CustomClaims map[string]interface{} `json:"custom_claims,omitempty" structs:"custom_claims,omitempty"`

	// TODO: Deprecate in next major release
	FullName    string `json:"full_name,omitempty" structs:"full_name,omitempty"`
	AvatarURL   string `json:"avatar_url,omitempty" structs:"avatar_url,omitempty"`
	Slug        string `json:"slug,omitempty" structs:"slug,omitempty"`
	ProviderId  string `json:"provider_id,omitempty" structs:"provider_id,omitempty"`
	UserNameKey string `json:"user_name,omitempty" structs:"user_name,omitempty"`
}

// Email is a struct that provides information on whether an email is verified or is the primary email address
type Email struct {
	Email    string
	Verified bool
	Primary  bool
}

// UserProvidedData is a struct that contains the user's data returned from the oauth provider
type UserProvidedData struct {
	Emails   []Email
	Metadata *Claims
}

// Provider is an interface for interacting with external account providers
type Provider interface {
	AuthCodeURL(string, ...oauth2.AuthCodeOption) string
}

// OAuthProvider specifies additional methods needed for providers using OAuth
type OAuthProvider interface {
	AuthCodeURL(string, ...oauth2.AuthCodeOption) string
	GetUserData(context.Context, *oauth2.Token) (*UserProvidedData, error)
	GetOAuthToken(ctx context.Context, code string, opts ...oauth2.AuthCodeOption) (*oauth2.Token, error)
	RequiresPKCE() bool
}

func chooseHost(base, defaultHost string) string {
	if base == "" {
		return "https://" + defaultHost
	}

	baseLen := len(base)
	if base[baseLen-1] == '/' {
		return base[:baseLen-1]
	}

	return base
}

func makeRequest(ctx context.Context, tok *oauth2.Token, g *oauth2.Config, url string, dst interface{}) error {
	client := g.Client(ctx, tok)
	client.Timeout = defaultTimeout
	res, err := client.Get(url)
	if err != nil {
		return err
	}
	defer utilities.SafeClose(res.Body)

	bodyBytes, _ := io.ReadAll(res.Body)
	res.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	if res.StatusCode < http.StatusOK || res.StatusCode >= http.StatusMultipleChoices {
		return httpError(res.StatusCode, "%s", string(bodyBytes))
	}

	if err := json.NewDecoder(res.Body).Decode(dst); err != nil {
		return err
	}

	return nil
}
