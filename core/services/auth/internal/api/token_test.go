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
	"os"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/models"
)

type TokenTestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration

	RefreshToken *models.RefreshToken
	User         *models.User
}

func TestToken(t *testing.T) {
	os.Setenv("GOTRUE_RATE_LIMIT_HEADER", "My-Custom-Header")
	api, config, err := setupAPIForTest()
	require.NoError(t, err)

	ts := &TokenTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()

	suite.Run(t, ts)
}

func (ts *TokenTestSuite) SetupTest() {
	ts.RefreshToken = nil
	models.TruncateAll(ts.API.db)

	// Create user & refresh token
	u, err := models.NewUser("", "test@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error creating test user model")
	t := time.Now()
	u.EmailConfirmedAt = &t
	u.BannedUntil = nil
	require.NoError(ts.T(), ts.API.db.Create(u), "Error saving new test user")

	ts.User = u
	ts.RefreshToken, err = models.GrantAuthenticatedUser(ts.API.db, u, models.GrantParams{})
	require.NoError(ts.T(), err, "Error creating refresh token")
	ts.Config.Hook.CustomAccessToken.Enabled = false

}

func (ts *TokenTestSuite) TestSessionTimebox() {
	timebox := 10 * time.Second

	ts.API.config.Sessions.Timebox = &timebox
	ts.API.overrideTime = func() time.Time {
		return time.Now().Add(timebox).Add(time.Second)
	}

	defer func() {
		ts.API.overrideTime = nil
		ts.API.config.Sessions.Timebox = nil
	}()

	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"refresh_token": ts.RefreshToken.Token,
	}))

	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=refresh_token", &buffer)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

	var firstResult struct {
		ErrorCode string `json:"error_code"`
		Message   string `json:"msg"`
	}

	assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))
	assert.Equal(ts.T(), apierrors.ErrorCodeSessionExpired, firstResult.ErrorCode)
	assert.Equal(ts.T(), "Invalid Refresh Token: Session Expired", firstResult.Message)
}

func (ts *TokenTestSuite) TestSessionInactivityTimeout() {
	inactivityTimeout := 10 * time.Second

	ts.API.config.Sessions.InactivityTimeout = &inactivityTimeout
	ts.API.overrideTime = func() time.Time {
		return time.Now().Add(inactivityTimeout).Add(time.Second)
	}

	defer func() {
		ts.API.config.Sessions.InactivityTimeout = nil
		ts.API.overrideTime = nil
	}()

	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"refresh_token": ts.RefreshToken.Token,
	}))

	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=refresh_token", &buffer)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

	var firstResult struct {
		ErrorCode string `json:"error_code"`
		Message   string `json:"msg"`
	}

	assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))
	assert.Equal(ts.T(), apierrors.ErrorCodeSessionExpired, firstResult.ErrorCode)
	assert.Equal(ts.T(), "Invalid Refresh Token: Session Expired (Inactivity)", firstResult.Message)
}

func (ts *TokenTestSuite) TestFailedToSaveRefreshTokenResultCase() {
	var buffer bytes.Buffer

	// first refresh
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"refresh_token": ts.RefreshToken.Token,
	}))

	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=refresh_token", &buffer)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var firstResult struct {
		RefreshToken string `json:"refresh_token"`
	}

	assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))
	assert.NotEmpty(ts.T(), firstResult.RefreshToken)

	// pretend that the browser wasn't able to save the firstResult,
	// run again with the first refresh token
	buffer = bytes.Buffer{}

	// second refresh with the reused refresh token
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"refresh_token": ts.RefreshToken.Token,
	}))

	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var secondResult struct {
		RefreshToken string `json:"refresh_token"`
	}

	assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&secondResult))
	assert.NotEmpty(ts.T(), secondResult.RefreshToken)

	// new refresh token is not being issued but the active one from
	// the first refresh that failed to save is stored
	assert.Equal(ts.T(), firstResult.RefreshToken, secondResult.RefreshToken)
}

func (ts *TokenTestSuite) TestSingleSessionPerUserNoTags() {
	ts.API.config.Sessions.SinglePerUser = true
	defer func() {
		ts.API.config.Sessions.SinglePerUser = false
	}()

	firstRefreshToken := ts.RefreshToken

	// just in case to give some delay between first and second session creation
	time.Sleep(10 * time.Millisecond)

	secondRefreshToken, err := models.GrantAuthenticatedUser(ts.API.db, ts.User, models.GrantParams{})

	require.NoError(ts.T(), err)

	require.NotEqual(ts.T(), *firstRefreshToken.SessionId, *secondRefreshToken.SessionId)
	require.Equal(ts.T(), firstRefreshToken.UserID, secondRefreshToken.UserID)

	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"refresh_token": firstRefreshToken.Token,
	}))

	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=refresh_token", &buffer)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()

	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusBadRequest, w.Code)
	assert.True(ts.T(), ts.API.config.Sessions.SinglePerUser)

	var firstResult struct {
		ErrorCode string `json:"error_code"`
		Message   string `json:"msg"`
	}

	assert.NoError(ts.T(), json.NewDecoder(w.Result().Body).Decode(&firstResult))
	assert.Equal(ts.T(), apierrors.ErrorCodeSessionExpired, firstResult.ErrorCode)
	assert.Equal(ts.T(), "Invalid Refresh Token: Session Expired (Revoked by Newer Login)", firstResult.Message)
}

func (ts *TokenTestSuite) TestRateLimitTokenRefresh() {
	var buffer bytes.Buffer
	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=refresh_token", &buffer)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("My-Custom-Header", "1.2.3.4")

	// It rate limits after 30 requests
	for i := 0; i < 30; i++ {
		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)
		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)
	}
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusTooManyRequests, w.Code)

	// It ignores X-Forwarded-For by default
	req.Header.Set("X-Forwarded-For", "1.1.1.1")
	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusTooManyRequests, w.Code)

	// It doesn't rate limit a new value for the limited header
	req = httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=refresh_token", &buffer)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("My-Custom-Header", "5.6.7.8")
	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusBadRequest, w.Code)
}

func (ts *TokenTestSuite) TestRateLimitWeb3() {
	var buffer bytes.Buffer
	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("My-Custom-Header", "1.2.3.4")

	// It rate limits after 30 requests
	for i := 0; i < 30; i++ {
		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)
		assert.Equal(ts.T(), http.StatusBadRequest, w.Code)
	}
	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusTooManyRequests, w.Code)

	// It ignores X-Forwarded-For by default
	req.Header.Set("X-Forwarded-For", "1.1.1.1")
	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusTooManyRequests, w.Code)

	// It doesn't rate limit a new value for the limited header
	req = httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=web3", &buffer)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("My-Custom-Header", "5.6.7.8")
	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusBadRequest, w.Code)
}

func (ts *TokenTestSuite) TestTokenPasswordGrantSuccess() {
	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"email":    "test@example.com",
		"password": "password",
	}))

	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=password", &buffer)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusOK, w.Code)
}

func (ts *TokenTestSuite) TestTokenRefreshTokenGrantSuccess() {
	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"refresh_token": ts.RefreshToken.Token,
	}))

	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=refresh_token", &buffer)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusOK, w.Code)
}

func (ts *TokenTestSuite) TestTokenPasswordGrantFailure() {
	u := ts.createBannedUser()

	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"email":    u.GetEmail(),
		"password": "password",
	}))

	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=password", &buffer)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusBadRequest, w.Code)
}

func (ts *TokenTestSuite) TestTokenPKCEGrantFailure() {
	authCode := "1234563"
	codeVerifier := "4a9505b9-0857-42bb-ab3c-098b4d28ddc2"
	invalidAuthCode := authCode + "123"
	invalidVerifier := codeVerifier + "123"
	codeChallenge := sha256.Sum256([]byte(codeVerifier))
	challenge := base64.RawURLEncoding.EncodeToString(codeChallenge[:])
	flowState, err := models.NewFlowState(models.FlowStateParams{
		ProviderType:         "github",
		AuthenticationMethod: models.OAuth,
		CodeChallenge:        challenge,
		CodeChallengeMethod:  "s256",
	})
	require.NoError(ts.T(), err)
	flowState.AuthCode = &authCode
	require.NoError(ts.T(), ts.API.db.Create(flowState))
	cases := []struct {
		desc             string
		authCode         string
		codeVerifier     string
		grantType        string
		expectedHTTPCode int
	}{
		{
			desc:         "Invalid Authcode",
			authCode:     invalidAuthCode,
			codeVerifier: codeVerifier,
		},
		{
			desc:         "Invalid code verifier",
			authCode:     authCode,
			codeVerifier: invalidVerifier,
		},
		{
			desc:         "Invalid auth code and verifier",
			authCode:     invalidAuthCode,
			codeVerifier: invalidVerifier,
		},
	}
	for _, v := range cases {
		ts.Run(v.desc, func() {
			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
				"code_verifier": v.codeVerifier,
				"auth_code":     v.authCode,
			}))
			req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=pkce", &buffer)
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)
			assert.Equal(ts.T(), http.StatusNotFound, w.Code)
		})
	}
}

func (ts *TokenTestSuite) TestTokenRefreshTokenGrantFailure() {
	_ = ts.createBannedUser()

	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"refresh_token": ts.RefreshToken.Token,
	}))

	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=refresh_token", &buffer)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusBadRequest, w.Code)
}

func (ts *TokenTestSuite) TestRefreshTokenReuseRevocation() {
	originalSecurity := ts.API.config.Security

	ts.API.config.Security.RefreshTokenRotationEnabled = true
	ts.API.config.Security.RefreshTokenReuseInterval = 0

	defer func() {
		ts.API.config.Security = originalSecurity
	}()

	refreshTokens := []string{
		ts.RefreshToken.Token,
	}

	for i := 0; i < 3; i += 1 {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"refresh_token": refreshTokens[len(refreshTokens)-1],
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=refresh_token", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusOK, w.Code)

		var response struct {
			RefreshToken string `json:"refresh_token"`
		}

		require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&response))

		refreshTokens = append(refreshTokens, response.RefreshToken)
	}

	// ensure that the 4 refresh tokens are setup correctly
	for i, refreshToken := range refreshTokens {
		_, anyToken, _, err := models.FindUserWithRefreshToken(ts.API.db, ts.Config.Security.DBEncryption, refreshToken, false)
		require.NoError(ts.T(), err)

		token := anyToken.(*models.RefreshToken)

		if i == len(refreshTokens)-1 {
			require.False(ts.T(), token.Revoked)
		} else {
			require.True(ts.T(), token.Revoked)
		}
	}

	// try to reuse the first (earliest) refresh token which should trigger the family revocation logic
	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"refresh_token": refreshTokens[0],
	}))

	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=refresh_token", &buffer)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)

	assert.Equal(ts.T(), http.StatusBadRequest, w.Code)

	var response struct {
		ErrorCode string `json:"error_code"`
		Message   string `json:"msg"`
	}

	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&response))
	require.Equal(ts.T(), apierrors.ErrorCodeRefreshTokenAlreadyUsed, response.ErrorCode)
	require.Equal(ts.T(), "Invalid Refresh Token: Already Used", response.Message)

	// ensure that the refresh tokens are marked as revoked in the database
	for _, refreshToken := range refreshTokens {
		_, anyToken, _, err := models.FindUserWithRefreshToken(ts.API.db, ts.Config.Security.DBEncryption, refreshToken, false)
		require.NoError(ts.T(), err)

		token := anyToken.(*models.RefreshToken)
		require.True(ts.T(), token.Revoked)
	}

	// finally ensure that none of the refresh tokens can be reused any
	// more, starting with the previously valid one
	for i := len(refreshTokens) - 1; i >= 0; i -= 1 {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"refresh_token": refreshTokens[i],
		}))

		req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=refresh_token", &buffer)
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		ts.API.handler.ServeHTTP(w, req)

		assert.Equal(ts.T(), http.StatusBadRequest, w.Code, "For refresh token %d", i)

		var response struct {
			ErrorCode string `json:"error_code"`
			Message   string `json:"msg"`
		}

		require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&response))
		require.Equal(ts.T(), apierrors.ErrorCodeRefreshTokenAlreadyUsed, response.ErrorCode, "For refresh token %d", i)
		require.Equal(ts.T(), "Invalid Refresh Token: Already Used", response.Message, "For refresh token %d", i)
	}
}

func (ts *TokenTestSuite) createBannedUser() *models.User {
	u, err := models.NewUser("", "banned@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error creating test user model")
	t := time.Now()
	u.EmailConfirmedAt = &t
	t = t.Add(24 * time.Hour)
	u.BannedUntil = &t
	require.NoError(ts.T(), ts.API.db.Create(u), "Error saving new test banned user")

	ts.RefreshToken, err = models.GrantAuthenticatedUser(ts.API.db, u, models.GrantParams{})
	require.NoError(ts.T(), err, "Error creating refresh token")

	return u
}

func (ts *TokenTestSuite) TestTokenRefreshWithExpiredSession() {
	var err error

	now := time.Now().UTC().Add(-1 * time.Second)

	ts.RefreshToken, err = models.GrantAuthenticatedUser(ts.API.db, ts.User, models.GrantParams{
		SessionNotAfter: &now,
	})
	require.NoError(ts.T(), err, "Error creating refresh token")

	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"refresh_token": ts.RefreshToken.Token,
	}))

	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=refresh_token", &buffer)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusBadRequest, w.Code)
}

func (ts *TokenTestSuite) TestTokenRefreshWithUnexpiredSession() {
	var err error

	now := time.Now().UTC().Add(1 * time.Second)

	ts.RefreshToken, err = models.GrantAuthenticatedUser(ts.API.db, ts.User, models.GrantParams{
		SessionNotAfter: &now,
	})
	require.NoError(ts.T(), err, "Error creating refresh token")

	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"refresh_token": ts.RefreshToken.Token,
	}))

	req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=refresh_token", &buffer)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusOK, w.Code)
}

func (ts *TokenTestSuite) TestMagicLinkPKCESignIn() {
	var buffer bytes.Buffer
	// Send OTP
	codeVerifier := "4a9505b9-0857-42bb-ab3c-098b4d28ddc2"
	codeChallenge := sha256.Sum256([]byte(codeVerifier))
	challenge := base64.RawURLEncoding.EncodeToString(codeChallenge[:])

	req := httptest.NewRequest(http.MethodPost, "/otp", &buffer)
	req.Header.Set("Content-Type", "application/json")
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(OtpParams{
		Email:               "test@example.com",
		CreateUser:          true,
		CodeChallengeMethod: "s256",
		CodeChallenge:       challenge,
	}))
	req = httptest.NewRequest(http.MethodPost, "/otp", &buffer)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	u, err := models.FindUserByEmailAndAudience(ts.API.db, "test@example.com", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)

	// Verify OTP
	requestUrl := fmt.Sprintf("http://localhost/verify?type=%v&token=%v", "magiclink", u.RecoveryToken)
	req = httptest.NewRequest(http.MethodGet, requestUrl, &buffer)
	req.Header.Set("Content-Type", "application/json")

	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusSeeOther, w.Code)
	rURL, _ := w.Result().Location()

	u, err = models.FindUserByEmailAndAudience(ts.API.db, "test@example.com", ts.Config.JWT.Aud)
	require.NoError(ts.T(), err)
	assert.True(ts.T(), u.IsConfirmed())

	f, err := url.ParseQuery(rURL.RawQuery)
	require.NoError(ts.T(), err)
	authCode := f.Get("code")
	assert.NotEmpty(ts.T(), authCode)
	// Extract token and sign in
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"code_verifier": codeVerifier,
		"auth_code":     authCode,
	}))
	req = httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=pkce", &buffer)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	verifyResp := &AccessTokenResponse{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&verifyResp))
	require.NotEmpty(ts.T(), verifyResp.Token)

}

func (ts *TokenTestSuite) TestPasswordVerificationHook() {
	type verificationHookTestcase struct {
		desc            string
		uri             string
		hookFunctionSQL string
		expectedCode    int
	}
	cases := []verificationHookTestcase{
		{
			desc: "Default success",
			uri:  "pg-functions://postgres/auth/password_verification_hook",
			hookFunctionSQL: `
                create or replace function password_verification_hook(input jsonb)
                returns jsonb as $$
                begin
                    return jsonb_build_object('decision', 'continue');
                end; $$ language plpgsql;`,
			expectedCode: http.StatusOK,
		}, {
			desc: "Reject- Enabled",
			uri:  "pg-functions://postgres/auth/password_verification_hook_reject",
			hookFunctionSQL: `
                create or replace function password_verification_hook_reject(input jsonb)
                returns jsonb as $$
                begin
                    return jsonb_build_object('decision', 'reject', 'message', 'You shall not pass!');
                end; $$ language plpgsql;`,
			expectedCode: http.StatusBadRequest,
		},
	}
	for _, c := range cases {
		ts.T().Run(c.desc, func(t *testing.T) {
			ts.Config.Hook.PasswordVerificationAttempt.Enabled = true
			ts.Config.Hook.PasswordVerificationAttempt.URI = c.uri
			require.NoError(ts.T(), ts.Config.Hook.PasswordVerificationAttempt.PopulateExtensibilityPoint())

			err := ts.API.db.RawQuery(c.hookFunctionSQL).Exec()
			require.NoError(t, err)
			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
				"email":    "test@example.com",
				"password": "password",
			}))

			req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=password", &buffer)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)

			assert.Equal(ts.T(), c.expectedCode, w.Code)
			cleanupHookSQL := fmt.Sprintf("drop function if exists %s", ts.Config.Hook.PasswordVerificationAttempt.HookName)
			require.NoError(ts.T(), ts.API.db.RawQuery(cleanupHookSQL).Exec())
			// Reset so it doesn't affect other tests
			ts.Config.Hook.PasswordVerificationAttempt.Enabled = false

		})
	}

}

func (ts *TokenTestSuite) TestCustomAccessToken() {
	type customAccessTokenTestcase struct {
		desc            string
		uri             string
		hookFunctionSQL string
		expectedClaims  map[string]interface{}
		shouldError     bool
	}
	cases := []customAccessTokenTestcase{
		{
			desc: "Add a new claim",
			uri:  "pg-functions://postgres/auth/custom_access_token_add_claim",
			hookFunctionSQL: ` create or replace function custom_access_token_add_claim(input jsonb) returns jsonb as $$ declare result jsonb; begin if jsonb_typeof(jsonb_object_field(input, 'claims')) is null then result := jsonb_build_object('error', jsonb_build_object('http_code', 400, 'message', 'Input does not contain claims field')); return result; end if;
    input := jsonb_set(input, '{claims,newclaim}', '"newvalue"', true);
    result := jsonb_build_object('claims', input->'claims');
    return result;
end; $$ language plpgsql;`,
			expectedClaims: map[string]interface{}{
				"newclaim": "newvalue",
			},
		}, {
			desc: "Delete the Role claim",
			uri:  "pg-functions://postgres/auth/custom_access_token_delete_claim",
			hookFunctionSQL: `
create or replace function custom_access_token_delete_claim(input jsonb)
returns jsonb as $$
declare
    result jsonb;
begin
    input := jsonb_set(input, '{claims}', (input->'claims') - 'role');
    result := jsonb_build_object('claims', input->'claims');
    return result;
end; $$ language plpgsql;`,
			expectedClaims: map[string]interface{}{},
			shouldError:    true,
		}, {
			desc: "Delete a non-required claim (UserMetadata)",
			uri:  "pg-functions://postgres/auth/custom_access_token_delete_usermetadata",
			hookFunctionSQL: `
create or replace function custom_access_token_delete_usermetadata(input jsonb)
returns jsonb as $$
declare
    result jsonb;
begin
    input := jsonb_set(input, '{claims}', (input->'claims') - 'user_metadata');
    result := jsonb_build_object('claims', input->'claims');
    return result;
end; $$ language plpgsql;`,
			// Not used
			expectedClaims: map[string]interface{}{
				"user_metadata": nil,
			},
			shouldError: false,
		}, {
			desc: "Modify amr to be array of strings",
			uri:  "pg-functions://postgres/auth/custom_access_token_amr_strings",
			hookFunctionSQL: `
create or replace function custom_access_token_amr_strings(input jsonb)
returns jsonb as $$
declare
    result jsonb;
begin
    input := jsonb_set(input, '{claims,amr}', '["password", "mfa"]'::jsonb);
    result := jsonb_build_object('claims', input->'claims');
    return result;
end; $$ language plpgsql;`,
			expectedClaims: map[string]interface{}{
				"amr": []interface{}{"password", "mfa"},
			},
			shouldError: false,
		}, {
			desc: "Modify amr to be array of objects",
			uri:  "pg-functions://postgres/auth/custom_access_token_amr_objects",
			hookFunctionSQL: `
create or replace function custom_access_token_amr_objects(input jsonb)
returns jsonb as $$
declare
    result jsonb;
begin
    input := jsonb_set(input, '{claims,amr}', '[{"method": "password"}, {"method": "mfa"}]'::jsonb);
    result := jsonb_build_object('claims', input->'claims');
    return result;
end; $$ language plpgsql;`,
			expectedClaims: map[string]interface{}{
				"amr": []interface{}{
					map[string]interface{}{"method": "password"},
					map[string]interface{}{"method": "mfa"},
				},
			},
			shouldError: false,
		},
	}
	for _, c := range cases {
		ts.T().Run(c.desc, func(t *testing.T) {
			ts.Config.Hook.CustomAccessToken.Enabled = true
			ts.Config.Hook.CustomAccessToken.URI = c.uri
			require.NoError(t, ts.Config.Hook.CustomAccessToken.PopulateExtensibilityPoint())

			err := ts.API.db.RawQuery(c.hookFunctionSQL).Exec()
			require.NoError(t, err)

			var buffer bytes.Buffer
			require.NoError(t, json.NewEncoder(&buffer).Encode(map[string]interface{}{
				"refresh_token": ts.RefreshToken.Token,
			}))

			req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=refresh_token", &buffer)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)

			var tokenResponse struct {
				AccessToken string `json:"access_token"`
			}
			require.NoError(t, json.NewDecoder(w.Result().Body).Decode(&tokenResponse))
			if c.shouldError {
				require.Equal(t, http.StatusInternalServerError, w.Code)
			} else {
				parts := strings.Split(tokenResponse.AccessToken, ".")
				require.Equal(t, 3, len(parts), "Token should have 3 parts")

				payload, err := base64.RawURLEncoding.DecodeString(parts[1])
				require.NoError(t, err)

				var responseClaims map[string]interface{}
				require.NoError(t, json.Unmarshal(payload, &responseClaims))

				for key, expectedValue := range c.expectedClaims {
					if expectedValue == nil {
						// Since c.shouldError is false here, we only need to check if the claim should be removed
						_, exists := responseClaims[key]
						assert.False(t, exists, "Claim should be removed")
					} else {
						assert.Equal(t, expectedValue, responseClaims[key])
					}
				}
			}

			cleanupHookSQL := fmt.Sprintf("drop function if exists %s", ts.Config.Hook.CustomAccessToken.HookName)
			require.NoError(t, ts.API.db.RawQuery(cleanupHookSQL).Exec())
			ts.Config.Hook.CustomAccessToken.Enabled = false
		})
	}
}

func (ts *TokenTestSuite) TestAllowSelectAuthenticationMethods() {

	companyUser, err := models.NewUser("12345678", "test@company.com", "password", ts.Config.JWT.Aud, nil)
	t := time.Now()
	companyUser.EmailConfirmedAt = &t
	require.NoError(ts.T(), err, "Error creating test user model")
	require.NoError(ts.T(), ts.API.db.Create(companyUser), "Error saving new test user")

	type allowSelectAuthMethodsTestcase struct {
		desc           string
		uri            string
		email          string
		expectedError  string
		expectedStatus int
	}

	// Common hook function SQL definition
	hookFunctionSQL := `
create or replace function auth.custom_access_token(event jsonb) returns jsonb language plpgsql as $$
declare
    email_claim text;
    authentication_method text;
begin
    email_claim := event->'claims'->>'email';
    authentication_method := event->>'authentication_method';

    if authentication_method = 'password' and email_claim not like '%@company.com' then
        return jsonb_build_object(
            'error', jsonb_build_object(
                'http_code', 403,
                'message', 'only members on company.com can access with password authentication'
            )
        );
    end if;

    return event;
end;
$$;`

	cases := []allowSelectAuthMethodsTestcase{
		{
			desc:           "Error for non-protected domain with password authentication",
			uri:            "pg-functions://postgres/auth/custom_access_token",
			email:          "test@example.com",
			expectedError:  "only members on company.com can access with password authentication",
			expectedStatus: http.StatusForbidden,
		},
		{
			desc:           "Allow access for protected domain with password authentication",
			uri:            "pg-functions://postgres/auth/custom_access_token",
			email:          companyUser.Email.String(),
			expectedError:  "",
			expectedStatus: http.StatusOK,
		},
	}

	for _, c := range cases {
		ts.T().Run(c.desc, func(t *testing.T) {
			// Enable and set up the custom access token hook
			ts.Config.Hook.CustomAccessToken.Enabled = true
			ts.Config.Hook.CustomAccessToken.URI = c.uri
			require.NoError(t, ts.Config.Hook.CustomAccessToken.PopulateExtensibilityPoint())

			// Execute the common hook function SQL
			err := ts.API.db.RawQuery(hookFunctionSQL).Exec()
			require.NoError(t, err)

			var buffer bytes.Buffer

			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
				"email":    c.email,
				"password": "password",
			}))

			req := httptest.NewRequest(http.MethodPost, "http://localhost/token?grant_type=password", &buffer)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)

			require.Equal(t, c.expectedStatus, w.Code, "Unexpected HTTP status code")
			if c.expectedError != "" {
				require.Contains(t, w.Body.String(), c.expectedError, "Expected error message not found")
			} else {
				require.NotContains(t, w.Body.String(), "error", "Unexpected error occurred")
			}

			// Delete the function and cleanup
			cleanupHookSQL := fmt.Sprintf("drop function if exists %s", ts.Config.Hook.CustomAccessToken.HookName)
			require.NoError(t, ts.API.db.RawQuery(cleanupHookSQL).Exec())
			ts.Config.Hook.CustomAccessToken.Enabled = false
		})
	}
}

func TestRefreshTokenGrantParamsValidate(t *testing.T) {
	examples := []string{
		"",
		"01234567890",
		"AAAAAAAAAAAA",
		"------------",
		"0000000000000",
	}

	p := &RefreshTokenGrantParams{}

	for _, example := range examples {
		p.RefreshToken = example
		require.Error(t, p.Validate())
	}

	p.RefreshToken = "0123456abcde"
	require.NoError(t, p.Validate())

	p.RefreshToken = (&crypto.RefreshToken{}).Encode(make([]byte, 32))
	require.NoError(t, p.Validate())
}
