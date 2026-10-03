package api

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/models"
)

func (ts *ExternalTestSuite) TestSignupExternalFigma() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=figma", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.Figma.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.Figma.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("current_user:read", q.Get("scope"))

	assertValidOAuthState(ts, q.Get("state"), "figma")
}

func FigmaTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, userCount *int, code string, email string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/v1/oauth/token":
			*tokenCount++
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			ts.Equal(ts.Config.External.Figma.RedirectURI, r.FormValue("redirect_uri"))

			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"access_token":"figma_token","expires_in":100000,"refresh_token":"figma_token"}`)
		case "/v1/me":
			*userCount++
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprintf(w, `{"id":"figma-test-id","email":"%s","handle":"Figma Test","img_url":"http://example.com/avatar"}`, email)
		default:
			w.WriteHeader(500)
			ts.Fail("unknown figma oauth call %s", r.URL.Path)
		}
	}))

	ts.Config.External.Figma.URL = server.URL

	return server
}

func (ts *ExternalTestSuite) TestSignupExternalFigma_AuthorizationCode() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "figma@example.com"
	server := FigmaTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	u := performAuthorization(ts, "figma", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "figma@example.com", "Figma Test", "figma-test-id", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestSignupExternalFigma_PKCE() {
	tokenCount, userCount := 0, 0
	code := "authcode"

	// for the plain challenge method, the code verifier == code challenge
	// code challenge has to be between 43 - 128 chars for the plain challenge method
	codeVerifier := "testtesttesttesttesttesttesttesttesttesttesttesttesttest"

	email := "figma@example.com"
	server := FigmaTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	cases := []struct {
		desc                string
		codeChallengeMethod string
	}{
		{
			desc:                "SHA256",
			codeChallengeMethod: "s256",
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			var codeChallenge string
			if c.codeChallengeMethod == "s256" {
				hashedCodeVerifier := sha256.Sum256([]byte(codeVerifier))
				codeChallenge = base64.RawURLEncoding.EncodeToString(hashedCodeVerifier[:])
			} else {
				codeChallenge = codeVerifier
			}
			// Check for valid auth code returned
			u := performPKCEAuthorization(ts, "figma", code, codeChallenge, c.codeChallengeMethod)
			m, err := url.ParseQuery(u.RawQuery)
			authCode := m["code"][0]
			require.NoError(ts.T(), err)
			require.NotEmpty(ts.T(), authCode)

			// Check for valid provider access token, mock does not return refresh token
			user, err := models.FindUserByEmailAndAudience(ts.API.db, "figma@example.com", ts.Config.JWT.Aud)
			require.NoError(ts.T(), err)
			require.NotEmpty(ts.T(), user)
			flowState, err := models.FindFlowStateByAuthCode(ts.API.db, authCode)
			require.NoError(ts.T(), err)
			require.Equal(ts.T(), "figma_token", flowState.ProviderAccessToken)

			// Exchange Auth Code for token
			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
				"code_verifier": codeVerifier,
				"auth_code":     authCode,
			}))
			req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=pkce", &buffer)
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), http.StatusOK, w.Code)

			// Validate that access token and provider tokens are present
			data := AccessTokenResponse{}
			require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
			require.NotEmpty(ts.T(), data.Token)
			require.NotEmpty(ts.T(), data.RefreshToken)
			require.NotEmpty(ts.T(), data.ProviderAccessToken)
			require.Equal(ts.T(), data.User.ID, user.ID)
		})
	}
}

func (ts *ExternalTestSuite) TestSignupExternalFigmaDisableSignupErrorWhenNoUser() {
	ts.Config.DisableSignup = true
	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "figma@example.com"
	server := FigmaTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	u := performAuthorization(ts, "figma", code, "")

	assertAuthorizationFailure(ts, u, "Signups not allowed for this instance", "access_denied", "figma@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalFigmaDisableSignupErrorWhenEmptyEmail() {
	ts.Config.DisableSignup = true
	tokenCount, userCount := 0, 0
	code := "authcode"
	email := ""
	server := FigmaTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	u := performAuthorization(ts, "figma", code, "")

	assertAuthorizationFailure(ts, u, "Error getting user email from external provider", "server_error", "figma@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalFigmaDisableSignupSuccessWithPrimaryEmail() {
	ts.Config.DisableSignup = true

	ts.createUser("figma-test-id", "figma@example.com", "Figma Test", "http://example.com/avatar", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "figma@example.com"
	server := FigmaTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	u := performAuthorization(ts, "figma", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "figma@example.com", "Figma Test", "figma-test-id", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalFigmaSuccessWhenMatchingToken() {
	// name and avatar should be populated from Figma API
	ts.createUser("figma-test-id", "figma@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "figma@example.com"
	server := FigmaTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	u := performAuthorization(ts, "figma", code, "invite_token")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "figma@example.com", "Figma Test", "figma-test-id", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalFigmaErrorWhenNoMatchingToken() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "figma@example.com"
	server := FigmaTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	w := performAuthorizationRequest(ts, "figma", "invite_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalFigmaErrorWhenWrongToken() {
	ts.createUser("figma-test-id", "figma@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "figma@example.com"
	server := FigmaTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	w := performAuthorizationRequest(ts, "figma", "wrong_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalFigmaErrorWhenEmailDoesntMatch() {
	ts.createUser("figma-test-id", "figma@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "other@example.com"
	server := FigmaTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	u := performAuthorization(ts, "figma", code, "invite_token")

	assertAuthorizationFailure(ts, u, "Invited email does not match emails from external provider", "invalid_request", "")
}

func (ts *ExternalTestSuite) TestSignupExternalFigmaErrorWhenUserBanned() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	email := "figma@example.com"

	server := FigmaTestSignupSetup(ts, &tokenCount, &userCount, code, email)
	defer server.Close()

	u := performAuthorization(ts, "figma", code, "")
	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "figma@example.com", "Figma Test", "figma-test-id", "http://example.com/avatar")

	user, err := models.FindUserByEmailAndAudience(ts.API.db, "figma@example.com", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)
	t := time.Now().Add(24 * time.Hour)
	user.BannedUntil = &t
	require.NoError(ts.T(), ts.API.db.UpdateOnly(user, "banned_until"))

	u = performAuthorization(ts, "figma", code, "")
	assertAuthorizationFailure(ts, u, "User is banned", "access_denied", "")
}
