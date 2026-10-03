package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/gobwas/glob"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/models"
)

type MailTestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration
}

func TestMail(t *testing.T) {
	api, config, err := setupAPIForTest()
	require.NoError(t, err)

	ts := &MailTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()

	suite.Run(t, ts)
}

func (ts *MailTestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)

	ts.Config.Mailer.SecureEmailChangeEnabled = true

	// Create User
	u, err := models.NewUser("12345678", "test@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error creating new user model")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error saving new user")
}

func (ts *MailTestSuite) TestValidateEmail() {
	cases := []struct {
		desc          string
		email         string
		expectedEmail string
		expectedError error
	}{
		{
			desc:          "valid email",
			email:         "test@example.com",
			expectedEmail: "test@example.com",
			expectedError: nil,
		},
		{
			desc:          "email should be normalized",
			email:         "TEST@EXAMPLE.COM",
			expectedEmail: "test@example.com",
			expectedError: nil,
		},
		{
			desc:          "empty email should return error",
			email:         "",
			expectedEmail: "",
			expectedError: apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "An email address is required"),
		},
		{
			desc: "email length exceeds 255 characters",
			// email has 256 characters
			email:         "testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttest@example.com",
			expectedEmail: "",
			expectedError: apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "An email address is too long"),
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			email, err := ts.API.validateEmail(c.email)
			require.Equal(ts.T(), c.expectedError, err)
			require.Equal(ts.T(), c.expectedEmail, email)
		})
	}
}

func (ts *MailTestSuite) TestGenerateLink() {
	// create admin jwt
	claims := &AccessTokenClaims{
		Role: "supabase_admin",
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(ts.Config.JWT.Secret))
	require.NoError(ts.T(), err, "Error generating admin jwt")

	ts.setURIAllowListMap("http://localhost:8000/**")
	// create test cases
	cases := []struct {
		Desc             string
		Body             GenerateLinkParams
		ExpectedCode     int
		ExpectedResponse map[string]interface{}
	}{
		{
			Desc: "Generate signup link for new user",
			Body: GenerateLinkParams{
				Email:    "new_user@example.com",
				Password: "secret123",
				Type:     "signup",
			},
			ExpectedCode: http.StatusOK,
			ExpectedResponse: map[string]interface{}{
				"redirect_to": ts.Config.SiteURL,
			},
		},
		{
			Desc: "Generate signup link for existing user",
			Body: GenerateLinkParams{
				Email:    "test@example.com",
				Password: "secret123",
				Type:     "signup",
			},
			ExpectedCode: http.StatusOK,
			ExpectedResponse: map[string]interface{}{
				"redirect_to": ts.Config.SiteURL,
			},
		},
		{
			Desc: "Generate signup link with custom redirect url",
			Body: GenerateLinkParams{
				Email:      "test@example.com",
				Password:   "secret123",
				Type:       "signup",
				RedirectTo: "http://localhost:8000/welcome",
			},
			ExpectedCode: http.StatusOK,
			ExpectedResponse: map[string]interface{}{
				"redirect_to": "http://localhost:8000/welcome",
			},
		},
		{
			Desc: "Generate magic link",
			Body: GenerateLinkParams{
				Email: "test@example.com",
				Type:  "magiclink",
			},
			ExpectedCode: http.StatusOK,
			ExpectedResponse: map[string]interface{}{
				"redirect_to": ts.Config.SiteURL,
			},
		},
		{
			Desc: "Generate invite link",
			Body: GenerateLinkParams{
				Email: "test@example.com",
				Type:  "invite",
			},
			ExpectedCode: http.StatusOK,
			ExpectedResponse: map[string]interface{}{
				"redirect_to": ts.Config.SiteURL,
			},
		},
		{
			Desc: "Generate recovery link",
			Body: GenerateLinkParams{
				Email: "test@example.com",
				Type:  "recovery",
			},
			ExpectedCode: http.StatusOK,
			ExpectedResponse: map[string]interface{}{
				"redirect_to": ts.Config.SiteURL,
			},
		},
		{
			Desc: "Generate email change link",
			Body: GenerateLinkParams{
				Email:    "test@example.com",
				NewEmail: "new@example.com",
				Type:     "email_change_current",
			},
			ExpectedCode: http.StatusOK,
			ExpectedResponse: map[string]interface{}{
				"redirect_to": ts.Config.SiteURL,
			},
		},
		{
			Desc: "Generate email change link",
			Body: GenerateLinkParams{
				Email:    "test@example.com",
				NewEmail: "new@example.com",
				Type:     "email_change_new",
			},
			ExpectedCode: http.StatusOK,
			ExpectedResponse: map[string]interface{}{
				"redirect_to": ts.Config.SiteURL,
			},
		},
	}

	customDomainUrl, err := url.ParseRequestURI("https://example.gotrue.com")
	require.NoError(ts.T(), err)

	originalHosts := ts.API.config.Mailer.ExternalHosts
	ts.API.config.Mailer.ExternalHosts = []string{
		"example.gotrue.com",
	}

	for _, c := range cases {
		ts.Run(c.Desc, func() {
			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(c.Body))
			req := httptest.NewRequest(http.MethodPost, customDomainUrl.String()+"/admin/generate_link", &buffer)
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
			w := httptest.NewRecorder()

			ts.API.handler.ServeHTTP(w, req)

			require.Equal(ts.T(), c.ExpectedCode, w.Code)

			data := make(map[string]interface{})
			require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))

			require.Contains(ts.T(), data, "action_link")
			require.Contains(ts.T(), data, "email_otp")
			require.Contains(ts.T(), data, "hashed_token")
			require.Contains(ts.T(), data, "redirect_to")
			require.Equal(ts.T(), c.Body.Type, data["verification_type"])

			// check if redirect_to is correct
			require.Equal(ts.T(), c.ExpectedResponse["redirect_to"], data["redirect_to"])

			// check if hashed_token matches hash function of email and the raw otp
			require.Equal(ts.T(), crypto.GenerateTokenHash(c.Body.Email, data["email_otp"].(string)), data["hashed_token"])

			// check if the host used in the email link matches the initial request host
			u, err := url.ParseRequestURI(data["action_link"].(string))
			require.NoError(ts.T(), err)
			require.Equal(ts.T(), req.Host, u.Host)
		})
	}

	ts.API.config.Mailer.ExternalHosts = originalHosts
}

func (ts *MailTestSuite) setURIAllowListMap(uris ...string) {
	for _, uri := range uris {
		g := glob.MustCompile(uri, '.', '/')
		ts.Config.URIAllowListMap[uri] = g
	}
}
