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

func (ts *ExternalTestSuite) TestSignupExternalGithub() {
	req := httptest.NewRequest(http.MethodGet, "http://localhost/authorize?provider=github", nil)
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	ts.Require().Equal(http.StatusFound, w.Code)
	u, err := url.Parse(w.Header().Get("Location"))
	ts.Require().NoError(err, "redirect url parse failed")
	q := u.Query()
	ts.Equal(ts.Config.External.Github.RedirectURI, q.Get("redirect_uri"))
	ts.Equal(ts.Config.External.Github.ClientID, []string{q.Get("client_id")})
	ts.Equal("code", q.Get("response_type"))
	ts.Equal("user:email", q.Get("scope"))

	assertValidOAuthState(ts, q.Get("state"), "github")
}

func GitHubTestSignupSetup(ts *ExternalTestSuite, tokenCount *int, userCount *int, code string, emails string) *httptest.Server {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/login/oauth/access_token":
			*tokenCount++
			ts.Equal(code, r.FormValue("code"))
			ts.Equal("authorization_code", r.FormValue("grant_type"))
			ts.Equal(ts.Config.External.Github.RedirectURI, r.FormValue("redirect_uri"))

			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"access_token":"github_token","expires_in":100000}`)
		case "/api/v3/user":
			*userCount++
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, `{"id":123, "name":"GitHub Test","avatar_url":"http://example.com/avatar"}`)
		case "/api/v3/user/emails":
			w.Header().Add("Content-Type", "application/json")
			fmt.Fprint(w, emails)
		default:
			w.WriteHeader(500)
			ts.Fail("unknown github oauth call %s", r.URL.Path)
		}
	}))

	ts.Config.External.Github.URL = server.URL

	return server
}

func (ts *ExternalTestSuite) TestSignupExternalGitHub_AuthorizationCode() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `[{"email":"github@example.com", "primary": true, "verified": true}]`
	server := GitHubTestSignupSetup(ts, &tokenCount, &userCount, code, emails)
	defer server.Close()

	u := performAuthorization(ts, "github", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "github@example.com", "GitHub Test", "123", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestSignupExternalGitHub_PKCE() {
	tokenCount, userCount := 0, 0
	code := "authcode"

	// for the plain challenge method, the code verifier == code challenge
	// code challenge has to be between 43 - 128 chars for the plain challenge method
	codeVerifier := "testtesttesttesttesttesttesttesttesttesttesttesttesttest"

	emails := `[{"email":"github@example.com", "primary": true, "verified": true}]`
	server := GitHubTestSignupSetup(ts, &tokenCount, &userCount, code, emails)
	defer server.Close()

	cases := []struct {
		desc                string
		codeChallengeMethod string
	}{
		{
			desc:                "SHA256",
			codeChallengeMethod: "s256",
		},
		{
			desc:                "Plain",
			codeChallengeMethod: "plain",
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
			u := performPKCEAuthorization(ts, "github", code, codeChallenge, c.codeChallengeMethod)
			m, err := url.ParseQuery(u.RawQuery)
			authCode := m["code"][0]
			require.NoError(ts.T(), err)
			require.NotEmpty(ts.T(), authCode)

			// Check for valid provider access token, mock does not return refresh token
			user, err := models.FindUserByEmailAndAudience(ts.API.db, "github@example.com", ts.Config.JWT.Aud)
			require.NoError(ts.T(), err)
			require.NotEmpty(ts.T(), user)
			flowState, err := models.FindFlowStateByAuthCode(ts.API.db, authCode)
			require.NoError(ts.T(), err)
			require.Equal(ts.T(), "github_token", flowState.ProviderAccessToken)

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

func (ts *ExternalTestSuite) TestSignupExternalGitHubDisableSignupErrorWhenNoUser() {
	ts.Config.DisableSignup = true
	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `[{"email":"github@example.com", "primary": true, "verified": true}]`
	server := GitHubTestSignupSetup(ts, &tokenCount, &userCount, code, emails)
	defer server.Close()

	u := performAuthorization(ts, "github", code, "")

	assertAuthorizationFailure(ts, u, "Signups not allowed for this instance", "access_denied", "github@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalGitHubDisableSignupErrorWhenEmptyEmail() {
	ts.Config.DisableSignup = true
	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `[{"primary": true, "verified": true}]`
	server := GitHubTestSignupSetup(ts, &tokenCount, &userCount, code, emails)
	defer server.Close()

	u := performAuthorization(ts, "github", code, "")

	assertAuthorizationFailure(ts, u, "Error getting user email from external provider", "server_error", "github@example.com")
}

func (ts *ExternalTestSuite) TestSignupExternalGitHubDisableSignupSuccessWithPrimaryEmail() {
	ts.Config.DisableSignup = true

	ts.createUser("123", "github@example.com", "GitHub Test", "http://example.com/avatar", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `[{"email":"github@example.com", "primary": true, "verified": true}]`
	server := GitHubTestSignupSetup(ts, &tokenCount, &userCount, code, emails)
	defer server.Close()

	u := performAuthorization(ts, "github", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "github@example.com", "GitHub Test", "123", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestSignupExternalGitHubDisableSignupSuccessWithNonPrimaryEmail() {
	ts.Config.DisableSignup = true

	ts.createUser("123", "secondary@example.com", "GitHub Test", "http://example.com/avatar", "")

	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `[{"email":"primary@example.com", "primary": true, "verified": true},{"email":"secondary@example.com", "primary": false, "verified": true}]`
	server := GitHubTestSignupSetup(ts, &tokenCount, &userCount, code, emails)
	defer server.Close()

	u := performAuthorization(ts, "github", code, "")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "secondary@example.com", "GitHub Test", "123", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalGitHubSuccessWhenMatchingToken() {
	// name and avatar should be populated from GitHub API
	ts.createUser("123", "github@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `[{"email":"github@example.com", "primary": true, "verified": true}]`
	server := GitHubTestSignupSetup(ts, &tokenCount, &userCount, code, emails)
	defer server.Close()

	u := performAuthorization(ts, "github", code, "invite_token")

	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "github@example.com", "GitHub Test", "123", "http://example.com/avatar")
}

func (ts *ExternalTestSuite) TestInviteTokenExternalGitHubErrorWhenNoMatchingToken() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `[{"email":"github@example.com", "primary": true, "verified": true}]`
	server := GitHubTestSignupSetup(ts, &tokenCount, &userCount, code, emails)
	defer server.Close()

	w := performAuthorizationRequest(ts, "github", "invite_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalGitHubErrorWhenWrongToken() {
	ts.createUser("123", "github@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `[{"email":"github@example.com", "primary": true, "verified": true}]`
	server := GitHubTestSignupSetup(ts, &tokenCount, &userCount, code, emails)
	defer server.Close()

	w := performAuthorizationRequest(ts, "github", "wrong_token")
	ts.Require().Equal(http.StatusNotFound, w.Code)
}

func (ts *ExternalTestSuite) TestInviteTokenExternalGitHubErrorWhenEmailDoesntMatch() {
	ts.createUser("123", "github@example.com", "", "", "invite_token")

	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `[{"email":"other@example.com", "primary": true, "verified": true}]`
	server := GitHubTestSignupSetup(ts, &tokenCount, &userCount, code, emails)
	defer server.Close()

	u := performAuthorization(ts, "github", code, "invite_token")

	assertAuthorizationFailure(ts, u, "Invited email does not match emails from external provider", "invalid_request", "")
}

func (ts *ExternalTestSuite) TestSignupExternalGitHubErrorWhenVerifiedFalse() {
	ts.Config.Mailer.AllowUnverifiedEmailSignIns = false
	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `[{"email":"github@example.com", "primary": true, "verified": false}]`
	server := GitHubTestSignupSetup(ts, &tokenCount, &userCount, code, emails)
	defer server.Close()

	u := performAuthorization(ts, "github", code, "")

	assertAuthorizationFailure(ts, u, "Unverified email with github. A confirmation email has been sent to your github email", "access_denied", "")
}

func (ts *ExternalTestSuite) TestSignupExternalGitHubErrorWhenUserBanned() {
	tokenCount, userCount := 0, 0
	code := "authcode"
	emails := `[{"email":"github@example.com", "primary": true, "verified": true}]`
	server := GitHubTestSignupSetup(ts, &tokenCount, &userCount, code, emails)
	defer server.Close()

	u := performAuthorization(ts, "github", code, "")
	assertAuthorizationSuccess(ts, u, tokenCount, userCount, "github@example.com", "GitHub Test", "123", "http://example.com/avatar")

	user, err := models.FindUserByEmailAndAudience(ts.API.db, "github@example.com", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)
	t := time.Now().Add(24 * time.Hour)
	user.BannedUntil = &t
	require.NoError(ts.T(), ts.API.db.UpdateOnly(user, "banned_until"))

	u = performAuthorization(ts, "github", code, "")
	assertAuthorizationFailure(ts, u, "User is banned", "access_denied", "")
}
