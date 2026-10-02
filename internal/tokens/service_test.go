package tokens

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/gofrs/uuid"
	"github.com/golang-jwt/jwt/v5"
	logrustest "github.com/sirupsen/logrus/hooks/test"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
)

type panicHookManager struct {
}

func (m *panicHookManager) InvokeHook(tx *storage.Connection, r *http.Request, input any, output any) error {
	panic("must not be called")
}

type RefreshTokenV2Suite struct {
	suite.Suite

	Conn *storage.Connection

	User *models.User
}

func TestRefreshTokenV2(t *testing.T) {
	ts := &RefreshTokenV2Suite{}

	conn, err := test.SetupDBConnection(ts.config())
	require.NoError(t, err)

	ts.Conn = conn
	defer conn.Close()

	suite.Run(t, ts)
}

func (ts *RefreshTokenV2Suite) SetupTest() {
	models.TruncateAll(ts.Conn)
	u, err := models.NewUser("", "test@example.com", "password", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.Conn.Create(u))

	ts.User = u
}

func (ts *RefreshTokenV2Suite) config() *conf.GlobalConfiguration {
	config, err := confload.LoadGlobal("../../hack/test.env")
	if err != nil {
		panic("failed to load config")
	}

	config.Security.RefreshTokenAlgorithmVersion = 2

	return config
}

func (ts *RefreshTokenV2Suite) TestNormalUse() {
	config := ts.config()
	require.Equal(ts.T(), 2, config.Security.RefreshTokenAlgorithmVersion)

	config.Security.RefreshTokenRotationEnabled = false
	config.Security.RefreshTokenReuseInterval = 1
	config.Security.RefreshTokenAllowReuse = false

	clock := time.Now()

	srv := NewService(config, &panicHookManager{})
	srv.SetTimeFunc(func() time.Time {
		return clock
	})

	req, err := http.NewRequest("POST", "https://example.com/", nil)
	require.NoError(ts.T(), err)

	req = req.WithContext(context.Background())
	responseHeaders := make(http.Header)

	at, err := srv.IssueRefreshToken(
		req,
		responseHeaders,
		ts.Conn,
		ts.User,
		models.PasswordGrant,
		models.GrantParams{},
	)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), at)

	prt, err := crypto.ParseRefreshToken(at.RefreshToken)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), prt)
	require.Equal(ts.T(), int64(0), prt.Counter)

	session, err := models.FindSessionByID(ts.Conn, prt.SessionID, false)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), session.UserID.String(), ts.User.ID.String())
	require.NotNil(ts.T(), session.RefreshTokenCounter)
	require.NotNil(ts.T(), session.RefreshTokenHmacKey)
	require.Equal(ts.T(), int64(0), *session.RefreshTokenCounter)

	require.Equal(ts.T(), session.UserID.String(), responseHeaders.Get("sb-auth-user-id"))
	require.Equal(ts.T(), session.ID.String(), responseHeaders.Get("sb-auth-session-id"))
	require.Equal(ts.T(), "0", responseHeaders.Get("sb-auth-refresh-token-counter"))

	refreshTokenToUse := at.RefreshToken

	// 128 is used here to force multi-byte encoding of the refresh token counter
	for i := 1; i < 128; i += 1 {
		clock = clock.Add(time.Duration(config.Security.RefreshTokenReuseInterval)*time.Second + time.Duration(100)*time.Millisecond)
		responseHeaders := make(http.Header)

		nrt, err := srv.RefreshTokenGrant(context.Background(), ts.Conn, req, responseHeaders, RefreshTokenGrantParams{
			RefreshToken: refreshTokenToUse,
		})
		require.NoError(ts.T(), err)

		pnrt, err := crypto.ParseRefreshToken(nrt.RefreshToken)
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), pnrt)
		require.Equal(ts.T(), pnrt.SessionID.String(), prt.SessionID.String())
		require.Equal(ts.T(), int64(i), pnrt.Counter)

		refreshedSession, err := models.FindSessionByID(ts.Conn, pnrt.SessionID, false)
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), refreshedSession.RefreshTokenCounter)
		require.NotNil(ts.T(), refreshedSession.RefreshTokenHmacKey)
		require.Equal(ts.T(), int64(i), *refreshedSession.RefreshTokenCounter)

		require.Equal(ts.T(), session.UserID.String(), responseHeaders.Get("sb-auth-user-id"))
		require.Equal(ts.T(), session.ID.String(), responseHeaders.Get("sb-auth-session-id"))
		require.Equal(ts.T(), strconv.FormatInt(int64(i), 10), responseHeaders.Get("sb-auth-refresh-token-counter"))

		refreshTokenToUse = nrt.RefreshToken
	}
}

func (ts *RefreshTokenV2Suite) TestUpdatesLastSignInAt() {
	config := ts.config()
	require.Equal(ts.T(), 2, config.Security.RefreshTokenAlgorithmVersion)

	require.Nil(ts.T(), ts.User.LastSignInAt)

	clock := time.Now()

	srv := NewService(config, &panicHookManager{})
	srv.SetTimeFunc(func() time.Time {
		return clock
	})

	req, err := http.NewRequest("POST", "https://example.com/", nil)
	require.NoError(ts.T(), err)

	req = req.WithContext(context.Background())
	responseHeaders := make(http.Header)

	_, err = srv.IssueRefreshToken(
		req,
		responseHeaders,
		ts.Conn,
		ts.User,
		models.PasswordGrant,
		models.GrantParams{},
	)
	require.NoError(ts.T(), err)

	dbUser, err := models.FindUserByID(ts.Conn, ts.User.ID)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), dbUser.LastSignInAt)
	require.WithinDuration(ts.T(), clock, *dbUser.LastSignInAt, time.Second)
}

func (ts *RefreshTokenV2Suite) TestOAuthServerRefreshRecordsAdditiveLoginMetric() {
	config := ts.config()

	oauthClient := &models.OAuthServerClient{
		ID:                      uuid.Must(uuid.NewV4()),
		ClientSecretHash:        "test-hash",
		RegistrationType:        "dynamic",
		ClientType:              models.OAuthServerClientTypeConfidential,
		TokenEndpointAuthMethod: "client_secret_basic",
		RedirectURIs:            "https://example.com/callback",
		GrantTypes:              "authorization_code,refresh_token",
	}
	require.NoError(ts.T(), models.CreateOAuthServerClient(ts.Conn, oauthClient))
	clientID := oauthClient.ID

	srv := NewService(config, &panicHookManager{})

	req, err := http.NewRequest("POST", "https://example.com/", nil)
	require.NoError(ts.T(), err)
	req = req.WithContext(context.Background())
	responseHeaders := make(http.Header)

	at, err := srv.IssueRefreshToken(
		req,
		responseHeaders,
		ts.Conn,
		ts.User,
		models.OAuthProviderAuthorizationCode,
		models.GrantParams{OAuthClientID: &clientID},
	)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), at)

	hook := logrustest.NewGlobal()
	defer hook.Reset()

	responseHeaders = make(http.Header)
	nrt, err := srv.RefreshTokenGrant(context.Background(), ts.Conn, req, responseHeaders, RefreshTokenGrantParams{
		RefreshToken: at.RefreshToken,
		ClientID:     &clientID,
	})
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), nrt)

	var sawGenericToken, sawOAuthServerRefresh bool
	for _, entry := range hook.AllEntries() {
		if entry.Data["action"] != "login" {
			continue
		}
		switch entry.Data["login_method"] {
		case "token":
			sawGenericToken = true
			require.NotContains(ts.T(), entry.Data, "client_id")
		case "oauth_server":
			sawOAuthServerRefresh = true
			require.Equal(ts.T(), clientID.String(), entry.Data["client_id"])
			require.Equal(ts.T(), "refresh_token", entry.Data["grant_type"])
		}
	}
	require.True(ts.T(), sawGenericToken, "existing generic token refresh login event must still fire")
	require.True(ts.T(), sawOAuthServerRefresh, "additive oauth_server login event must fire with client_id and grant_type=refresh_token")
}

func (ts *RefreshTokenV2Suite) TestMaliciousReuse() {
	config := ts.config()
	require.Equal(ts.T(), 2, config.Security.RefreshTokenAlgorithmVersion)

	config.Security.RefreshTokenRotationEnabled = false
	config.Security.RefreshTokenReuseInterval = 1
	config.Security.RefreshTokenAllowReuse = false

	clock := time.Now()

	srv := NewService(config, &panicHookManager{})
	srv.SetTimeFunc(func() time.Time {
		return clock
	})

	req, err := http.NewRequest("POST", "https://example.com/", nil)
	require.NoError(ts.T(), err)
	responseHeaders := make(http.Header)

	req = req.WithContext(context.Background())

	at, err := srv.IssueRefreshToken(
		req,
		responseHeaders,
		ts.Conn,
		ts.User,
		models.PasswordGrant,
		models.GrantParams{},
	)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), at)

	prt, err := crypto.ParseRefreshToken(at.RefreshToken)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), prt)
	require.Equal(ts.T(), int64(0), prt.Counter)

	session, err := models.FindSessionByID(ts.Conn, prt.SessionID, false)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), session.UserID.String(), ts.User.ID.String())
	require.NotNil(ts.T(), session.RefreshTokenCounter)
	require.NotNil(ts.T(), session.RefreshTokenHmacKey)
	require.Equal(ts.T(), int64(0), *session.RefreshTokenCounter)

	require.Equal(ts.T(), session.UserID.String(), responseHeaders.Get("sb-auth-user-id"))
	require.Equal(ts.T(), session.ID.String(), responseHeaders.Get("sb-auth-session-id"))
	require.Equal(ts.T(), "0", responseHeaders.Get("sb-auth-refresh-token-counter"))

	refreshTokenToUse := at.RefreshToken

	refreshTokens := []string{at.RefreshToken}

	// run through a few regular refresh tokens
	for i := 1; i < 4; i += 1 {
		clock = clock.Add(time.Duration(config.Security.RefreshTokenReuseInterval)*time.Second + time.Duration(100)*time.Millisecond)
		responseHeaders := make(http.Header)

		nrt, err := srv.RefreshTokenGrant(context.Background(), ts.Conn, req, responseHeaders, RefreshTokenGrantParams{
			RefreshToken: refreshTokenToUse,
		})
		require.NoError(ts.T(), err)

		pnrt, err := crypto.ParseRefreshToken(nrt.RefreshToken)
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), pnrt)
		require.Equal(ts.T(), pnrt.SessionID.String(), prt.SessionID.String())
		require.Equal(ts.T(), int64(i), pnrt.Counter)

		refreshedSession, err := models.FindSessionByID(ts.Conn, pnrt.SessionID, false)
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), refreshedSession.RefreshTokenCounter)
		require.NotNil(ts.T(), refreshedSession.RefreshTokenHmacKey)
		require.Equal(ts.T(), int64(i), *refreshedSession.RefreshTokenCounter)

		require.Equal(ts.T(), session.UserID.String(), responseHeaders.Get("sb-auth-user-id"))
		require.Equal(ts.T(), session.ID.String(), responseHeaders.Get("sb-auth-session-id"))
		require.Equal(ts.T(), strconv.FormatInt(int64(i), 10), responseHeaders.Get("sb-auth-refresh-token-counter"))

		refreshTokenToUse = nrt.RefreshToken
		refreshTokens = append(refreshTokens, nrt.RefreshToken)
	}

	clock = clock.Add(time.Duration(config.Security.RefreshTokenReuseInterval)*time.Second + time.Duration(100)*time.Millisecond)

	// all but the last two must fail refreshing
	for _, refreshToken := range refreshTokens[:len(refreshTokens)-2] {
		responseHeaders := make(http.Header)

		nrt, err := srv.RefreshTokenGrant(context.Background(), ts.Conn, req, responseHeaders, RefreshTokenGrantParams{
			RefreshToken: refreshToken,
		})
		require.Error(ts.T(), err)
		require.Nil(ts.T(), nrt)
		require.Equal(ts.T(), session.UserID.String(), responseHeaders.Get("sb-auth-user-id"))
		require.Equal(ts.T(), session.ID.String(), responseHeaders.Get("sb-auth-session-id"))

		refreshedSession, err := models.FindSessionByID(ts.Conn, prt.SessionID, false)
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), refreshedSession.RefreshTokenCounter)
		require.NotNil(ts.T(), refreshedSession.RefreshTokenHmacKey)
		require.Equal(ts.T(), int64(len(refreshTokens)-1), *refreshedSession.RefreshTokenCounter)
	}

	// make sure that the last two allow refreshing
	for _, refreshToken := range refreshTokens[len(refreshTokens)-2:] {
		clock = clock.Add(time.Duration(config.Security.RefreshTokenReuseInterval)*time.Second + time.Duration(100)*time.Millisecond)

		responseHeaders := make(http.Header)

		nrt, err := srv.RefreshTokenGrant(context.Background(), ts.Conn, req, responseHeaders, RefreshTokenGrantParams{
			RefreshToken: refreshToken,
		})
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), nrt)
	}

	session, err = models.FindSessionByID(ts.Conn, prt.SessionID, false)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), int64(len(refreshTokens)), *session.RefreshTokenCounter)

	// now update service to use rotation, meaning that after the first reuse
	config.Security.RefreshTokenRotationEnabled = true

	srv = NewService(config, &panicHookManager{})
	srv.SetTimeFunc(func() time.Time {
		return clock
	})

	clock = clock.Add(time.Duration(config.Security.RefreshTokenReuseInterval)*time.Second + time.Duration(100)*time.Millisecond)

	responseHeaders = make(http.Header)

	// reuse the first refresh token, causing the session to be completely deleted
	rrt, err := srv.RefreshTokenGrant(context.Background(), ts.Conn, req, responseHeaders, RefreshTokenGrantParams{
		RefreshToken: refreshTokens[0],
	})
	require.Error(ts.T(), err)
	require.Nil(ts.T(), rrt)

	deletedSession, err := models.FindSessionByID(ts.Conn, prt.SessionID, false)
	require.Error(ts.T(), err)
	require.True(ts.T(), models.IsNotFoundError(err))
	require.Nil(ts.T(), deletedSession)
}

func (ts *RefreshTokenV2Suite) TestConcurrentReuse() {
	config := ts.config()
	require.Equal(ts.T(), 2, config.Security.RefreshTokenAlgorithmVersion)

	config.Security.RefreshTokenRotationEnabled = true
	config.Security.RefreshTokenReuseInterval = 1
	config.Security.RefreshTokenAllowReuse = false

	clock := time.Now()

	srv := NewService(config, &panicHookManager{})
	srv.SetTimeFunc(func() time.Time {
		return clock
	})

	req, err := http.NewRequest("POST", "https://example.com/", nil)
	require.NoError(ts.T(), err)
	responseHeaders := make(http.Header)

	req = req.WithContext(context.Background())

	at, err := srv.IssueRefreshToken(
		req,
		responseHeaders,
		ts.Conn,
		ts.User,
		models.PasswordGrant,
		models.GrantParams{},
	)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), at)

	prt, err := crypto.ParseRefreshToken(at.RefreshToken)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), prt)
	require.Equal(ts.T(), int64(0), prt.Counter)

	session, err := models.FindSessionByID(ts.Conn, prt.SessionID, false)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), session.UserID.String(), ts.User.ID.String())
	require.NotNil(ts.T(), session.RefreshTokenCounter)
	require.NotNil(ts.T(), session.RefreshTokenHmacKey)
	require.Equal(ts.T(), int64(0), *session.RefreshTokenCounter)

	require.Equal(ts.T(), session.UserID.String(), responseHeaders.Get("sb-auth-user-id"))
	require.Equal(ts.T(), session.ID.String(), responseHeaders.Get("sb-auth-session-id"))
	require.Equal(ts.T(), "0", responseHeaders.Get("sb-auth-refresh-token-counter"))

	refreshTokenToUse := at.RefreshToken
	refreshTokens := []string{at.RefreshToken}

	// refresh the token serially a few times, to mimic a more real-world scenario
	for i := 1; i < 4; i += 1 {
		clock = clock.Add(time.Duration(config.Security.RefreshTokenReuseInterval)*time.Second + time.Duration(100)*time.Millisecond)
		responseHeaders := make(http.Header)

		nrt, err := srv.RefreshTokenGrant(context.Background(), ts.Conn, req, responseHeaders, RefreshTokenGrantParams{
			RefreshToken: refreshTokenToUse,
		})
		require.NoError(ts.T(), err)

		pnrt, err := crypto.ParseRefreshToken(nrt.RefreshToken)
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), pnrt)
		require.Equal(ts.T(), pnrt.SessionID.String(), prt.SessionID.String())
		require.Equal(ts.T(), int64(i), pnrt.Counter)

		refreshedSession, err := models.FindSessionByID(ts.Conn, pnrt.SessionID, false)
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), refreshedSession.RefreshTokenCounter)
		require.NotNil(ts.T(), refreshedSession.RefreshTokenHmacKey)
		require.Equal(ts.T(), int64(i), *refreshedSession.RefreshTokenCounter)

		refreshTokenToUse = nrt.RefreshToken
		refreshTokens = append(refreshTokens, nrt.RefreshToken)
	}

	clock = clock.Add(time.Duration(config.Security.RefreshTokenReuseInterval)*time.Second + time.Duration(100)*time.Millisecond)

	var wg sync.WaitGroup

	endTimeChan := make(chan time.Time)
	defer close(endTimeChan)

	// in CI this can cause quite a bit of issues due to the limited number of connections to the database
	concurrency := 20
	wg.Add(concurrency + 2)

	endTimes := make([]time.Time, 0, concurrency+1)

	go func() {
		defer wg.Done()
		endTimes = append(endTimes, time.Now())

		for i := 0; i < concurrency; i += 1 {
			endTimes = append(endTimes, <-endTimeChan)
		}
	}()

	causesChan := make(chan string)
	defer close(causesChan)

	causes := make([]string, 0, concurrency)

	go func() {
		defer wg.Done()

		for i := 0; i < concurrency; i += 1 {
			causes = append(causes, <-causesChan)
		}
	}()

	for i := 0; i < concurrency; i += 1 {
		go func() {
			defer wg.Done()

			responseHeaders := make(http.Header)
			nrt, err := srv.RefreshTokenGrant(context.Background(), ts.Conn, req, responseHeaders, RefreshTokenGrantParams{
				RefreshToken: refreshTokenToUse,
			})
			endTimeChan <- time.Now()

			require.NoError(ts.T(), err)
			causesChan <- responseHeaders.Get("sb-auth-refresh-token-reuse-cause")

			pnrt, err := crypto.ParseRefreshToken(nrt.RefreshToken)
			require.NoError(ts.T(), err)
			require.NotNil(ts.T(), pnrt)
			require.Equal(ts.T(), pnrt.SessionID.String(), prt.SessionID.String())
			require.Equal(ts.T(), int64(len(refreshTokens)), pnrt.Counter)

			require.Equal(ts.T(), session.UserID.String(), responseHeaders.Get("sb-auth-user-id"))
			require.Equal(ts.T(), session.ID.String(), responseHeaders.Get("sb-auth-session-id"))
			require.Equal(ts.T(), strconv.FormatInt(int64(len(refreshTokens)), 10), responseHeaders.Get("sb-auth-refresh-token-counter"))

			refreshedSession, err := models.FindSessionByID(ts.Conn, pnrt.SessionID, false)
			require.NoError(ts.T(), err)
			require.NotNil(ts.T(), refreshedSession.RefreshTokenCounter)
			require.NotNil(ts.T(), refreshedSession.RefreshTokenHmacKey)
			require.Equal(ts.T(), int64(len(refreshTokens)), *refreshedSession.RefreshTokenCounter)
		}()
	}

	wg.Wait()

	// check that the session exists and was not refreshed concurrency times, but only once
	session, err = models.FindSessionByID(ts.Conn, prt.SessionID, false)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), session.UserID.String(), ts.User.ID.String())
	require.NotNil(ts.T(), session.RefreshTokenCounter)
	require.NotNil(ts.T(), session.RefreshTokenHmacKey)
	require.Equal(ts.T(), int64(len(refreshTokens)), *session.RefreshTokenCounter)

	// ensure that the end times are naturally sorted, indicating an exclusive lock was used
	for i := 1; i < len(endTimes); i += 1 {
		require.True(ts.T(), endTimes[i-1].Before(endTimes[i]))
	}

	// first refresh is OK
	require.Equal(ts.T(), "", causes[0])

	// second refresh is either concurrent-refresh or fail-to-save
	for _, cause := range causes[1:] {
		require.Equal(ts.T(), "concurrent-refresh,fail-to-save", cause)
	}
}

func (ts *RefreshTokenV2Suite) TestFailToSaveReuse() {
	config := ts.config()
	require.Equal(ts.T(), 2, config.Security.RefreshTokenAlgorithmVersion)

	config.Security.RefreshTokenRotationEnabled = false
	config.Security.RefreshTokenReuseInterval = 1

	clock := time.Now()

	srv := NewService(config, &panicHookManager{})
	srv.SetTimeFunc(func() time.Time {
		return clock
	})

	req, err := http.NewRequest("POST", "https://example.com/", nil)
	require.NoError(ts.T(), err)
	responseHeaders := make(http.Header)

	req = req.WithContext(context.Background())

	at, err := srv.IssueRefreshToken(
		req,
		responseHeaders,
		ts.Conn,
		ts.User,
		models.PasswordGrant,
		models.GrantParams{},
	)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), at)

	prt, err := crypto.ParseRefreshToken(at.RefreshToken)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), prt)
	require.Equal(ts.T(), int64(0), prt.Counter)

	session, err := models.FindSessionByID(ts.Conn, prt.SessionID, false)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), session.UserID.String(), ts.User.ID.String())
	require.NotNil(ts.T(), session.RefreshTokenCounter)
	require.NotNil(ts.T(), session.RefreshTokenHmacKey)
	require.Equal(ts.T(), int64(0), *session.RefreshTokenCounter)

	require.Equal(ts.T(), session.UserID.String(), responseHeaders.Get("sb-auth-user-id"))
	require.Equal(ts.T(), session.ID.String(), responseHeaders.Get("sb-auth-session-id"))
	require.Equal(ts.T(), "0", responseHeaders.Get("sb-auth-refresh-token-counter"))

	refreshTokens := []string{at.RefreshToken}

	// a few regular refresh token calls to prime a real world scenario
	for i := 1; i < 4; i += 1 {
		clock = clock.Add(time.Duration(config.Security.RefreshTokenReuseInterval)*time.Second + time.Duration(100)*time.Millisecond)
		responseHeaders := make(http.Header)

		nrt, err := srv.RefreshTokenGrant(context.Background(), ts.Conn, req, responseHeaders, RefreshTokenGrantParams{
			RefreshToken: refreshTokens[len(refreshTokens)-1],
		})
		require.NoError(ts.T(), err)

		pnrt, err := crypto.ParseRefreshToken(nrt.RefreshToken)
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), pnrt)
		require.Equal(ts.T(), pnrt.SessionID.String(), prt.SessionID.String())
		require.Equal(ts.T(), int64(i), pnrt.Counter)

		require.Equal(ts.T(), session.UserID.String(), responseHeaders.Get("sb-auth-user-id"))
		require.Equal(ts.T(), session.ID.String(), responseHeaders.Get("sb-auth-session-id"))
		require.Equal(ts.T(), strconv.FormatInt(int64(i), 10), responseHeaders.Get("sb-auth-refresh-token-counter"))
		require.Equal(ts.T(), "", responseHeaders.Get("sb-auth-refresh-token-reuse-cause"))

		refreshedSession, err := models.FindSessionByID(ts.Conn, pnrt.SessionID, false)
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), refreshedSession.RefreshTokenCounter)
		require.NotNil(ts.T(), refreshedSession.RefreshTokenHmacKey)
		require.Equal(ts.T(), int64(i), *refreshedSession.RefreshTokenCounter)

		refreshTokens = append(refreshTokens, nrt.RefreshToken)
	}

	for i := 0; i < 10; i += 1 {
		// ensure refreshes occur outside of the allowed reuse interval
		clock = clock.Add(time.Duration(config.Security.RefreshTokenReuseInterval)*time.Second + time.Duration(100)*time.Millisecond)
		responseHeaders := make(http.Header)

		nrt, err := srv.RefreshTokenGrant(context.Background(), ts.Conn, req, responseHeaders, RefreshTokenGrantParams{
			RefreshToken: refreshTokens[len(refreshTokens)-2],
		})
		require.NoError(ts.T(), err)

		pnrt, err := crypto.ParseRefreshToken(nrt.RefreshToken)
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), pnrt)
		require.Equal(ts.T(), pnrt.SessionID.String(), prt.SessionID.String())

		// key assertion, ensuring the refresh token returned from the "failed to save" scenario is always the currently active refresh token
		require.Equal(ts.T(), int64(len(refreshTokens)-1), pnrt.Counter)

		require.Equal(ts.T(), session.UserID.String(), responseHeaders.Get("sb-auth-user-id"))
		require.Equal(ts.T(), session.ID.String(), responseHeaders.Get("sb-auth-session-id"))
		require.Equal(ts.T(), strconv.FormatInt(int64(len(refreshTokens)-1), 10), responseHeaders.Get("sb-auth-refresh-token-counter"))
		require.Equal(ts.T(), "fail-to-save", responseHeaders.Get("sb-auth-refresh-token-reuse-cause"))

		refreshedSession, err := models.FindSessionByID(ts.Conn, pnrt.SessionID, false)
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), refreshedSession.RefreshTokenCounter)
		require.NotNil(ts.T(), refreshedSession.RefreshTokenHmacKey)
		require.Equal(ts.T(), int64(len(refreshTokens)-1), *refreshedSession.RefreshTokenCounter)
	}
}

func (ts *RefreshTokenV2Suite) TestDBEncryption() {
	config := ts.config()
	require.Equal(ts.T(), 2, config.Security.RefreshTokenAlgorithmVersion)

	config.Security.RefreshTokenRotationEnabled = false
	config.Security.RefreshTokenReuseInterval = 1
	config.Security.RefreshTokenAllowReuse = false

	encryptionKeyA := make([]byte, 32)
	encryptionKeyB := make([]byte, 32)

	rand.Read(encryptionKeyA)
	rand.Read(encryptionKeyB)
	config.Security.DBEncryption.Encrypt = true
	config.Security.DBEncryption.DecryptionKeys = map[string]string{
		"A": base64.RawURLEncoding.EncodeToString(encryptionKeyA),
		"B": base64.RawURLEncoding.EncodeToString(encryptionKeyB),
	}
	config.Security.DBEncryption.EncryptionKeyID = "A"
	config.Security.DBEncryption.EncryptionKey = config.Security.DBEncryption.DecryptionKeys[config.Security.DBEncryption.EncryptionKeyID]

	clock := time.Now()

	srv := NewService(config, &panicHookManager{})
	srv.SetTimeFunc(func() time.Time {
		return clock
	})

	req, err := http.NewRequest("POST", "https://example.com/", nil)
	require.NoError(ts.T(), err)

	req = req.WithContext(context.Background())
	responseHeaders := make(http.Header)

	at, err := srv.IssueRefreshToken(
		req,
		responseHeaders,
		ts.Conn,
		ts.User,
		models.PasswordGrant,
		models.GrantParams{},
	)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), at)

	prt, err := crypto.ParseRefreshToken(at.RefreshToken)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), prt)
	require.Equal(ts.T(), int64(0), prt.Counter)

	session, err := models.FindSessionByID(ts.Conn, prt.SessionID, false)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), session.UserID.String(), ts.User.ID.String())
	require.NotNil(ts.T(), session.RefreshTokenCounter)
	require.NotNil(ts.T(), session.RefreshTokenHmacKey)
	require.Equal(ts.T(), int64(0), *session.RefreshTokenCounter)

	// key assertion
	require.True(ts.T(), strings.Contains(*session.RefreshTokenHmacKey, "\"key_id\":\"A\""))

	require.Equal(ts.T(), session.UserID.String(), responseHeaders.Get("sb-auth-user-id"))
	require.Equal(ts.T(), session.ID.String(), responseHeaders.Get("sb-auth-session-id"))
	require.Equal(ts.T(), "0", responseHeaders.Get("sb-auth-refresh-token-counter"))

	refreshTokenToUse := at.RefreshToken

	var encryptedStrings []string

	for i := 1; i < 3; i += 1 {
		clock = clock.Add(time.Duration(config.Security.RefreshTokenReuseInterval)*time.Second + time.Duration(100)*time.Millisecond)
		responseHeaders := make(http.Header)

		// switch the encryption key to trigger re-encryption
		if i%2 == 0 {
			config.Security.DBEncryption.EncryptionKeyID = "A"
		} else {
			config.Security.DBEncryption.EncryptionKeyID = "B"
		}
		config.Security.DBEncryption.EncryptionKey = config.Security.DBEncryption.DecryptionKeys[config.Security.DBEncryption.EncryptionKeyID]

		srv := NewService(config, &panicHookManager{})
		srv.SetTimeFunc(func() time.Time {
			return clock
		})

		nrt, err := srv.RefreshTokenGrant(context.Background(), ts.Conn, req, responseHeaders, RefreshTokenGrantParams{
			RefreshToken: refreshTokenToUse,
		})
		require.NoError(ts.T(), err)

		pnrt, err := crypto.ParseRefreshToken(nrt.RefreshToken)
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), pnrt)
		require.Equal(ts.T(), pnrt.SessionID.String(), prt.SessionID.String())
		require.Equal(ts.T(), int64(i), pnrt.Counter)

		refreshedSession, err := models.FindSessionByID(ts.Conn, pnrt.SessionID, false)
		require.NoError(ts.T(), err)
		require.NotNil(ts.T(), refreshedSession.RefreshTokenCounter)
		require.NotNil(ts.T(), refreshedSession.RefreshTokenHmacKey)
		require.Equal(ts.T(), int64(i), *refreshedSession.RefreshTokenCounter)

		require.Equal(ts.T(), session.UserID.String(), responseHeaders.Get("sb-auth-user-id"))
		require.Equal(ts.T(), session.ID.String(), responseHeaders.Get("sb-auth-session-id"))
		require.Equal(ts.T(), strconv.FormatInt(int64(i), 10), responseHeaders.Get("sb-auth-refresh-token-counter"))

		refreshTokenToUse = nrt.RefreshToken
		encryptedStrings = append(encryptedStrings, *refreshedSession.RefreshTokenHmacKey)
	}

	require.Equal(ts.T(), 2, len(encryptedStrings))
	require.NotEqual(ts.T(), encryptedStrings[0], encryptedStrings[1])
	require.True(ts.T(), strings.Contains(encryptedStrings[0], "\"key_id\":\"B\""))
	require.True(ts.T(), strings.Contains(encryptedStrings[1], "\"key_id\":\"A\""))
}

func (ts *RefreshTokenV2Suite) TestInvalidRefreshTokens() {
	config := ts.config()
	require.Equal(ts.T(), 2, config.Security.RefreshTokenAlgorithmVersion)

	config.Security.RefreshTokenRotationEnabled = false
	config.Security.RefreshTokenReuseInterval = 1
	config.Security.RefreshTokenAllowReuse = false

	clock := time.Now()

	srv := NewService(config, &panicHookManager{})
	srv.SetTimeFunc(func() time.Time {
		return clock
	})

	req, err := http.NewRequest("POST", "https://example.com/", nil)
	require.NoError(ts.T(), err)

	req = req.WithContext(context.Background())
	responseHeaders := make(http.Header)

	at, err := srv.IssueRefreshToken(
		req,
		responseHeaders,
		ts.Conn,
		ts.User,
		models.PasswordGrant,
		models.GrantParams{},
	)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), at)

	prt, err := crypto.ParseRefreshToken(at.RefreshToken)
	require.NoError(ts.T(), err)

	session, err := models.FindSessionByID(ts.Conn, prt.SessionID, false)
	require.NoError(ts.T(), err)

	key, _, err := session.GetRefreshTokenHmacKey(config.Security.DBEncryption)
	require.NoError(ts.T(), err)

	// tamper with counter
	prt.Counter += 1
	tamperedRefreshToken := prt.Encode(key)

	responseHeaders = make(http.Header)
	nrt, err := srv.RefreshTokenGrant(context.Background(), ts.Conn, req, responseHeaders, RefreshTokenGrantParams{
		RefreshToken: tamperedRefreshToken,
	})
	require.Error(ts.T(), err)
	require.Nil(ts.T(), nrt)

	require.Equal(ts.T(), prt.SessionID.String(), responseHeaders.Get("sb-auth-session-id"))

	// tamper with signature
	prt.Counter = 0
	tamperedRefreshToken = prt.Encode(make([]byte, 32))

	responseHeaders = make(http.Header)
	nrt, err = srv.RefreshTokenGrant(context.Background(), ts.Conn, req, responseHeaders, RefreshTokenGrantParams{
		RefreshToken: tamperedRefreshToken,
	})
	require.Error(ts.T(), err)
	require.Nil(ts.T(), nrt)

	require.Equal(ts.T(), "", responseHeaders.Get("sb-auth-session-id"))

	// remove the session
	err = models.LogoutSession(ts.Conn, prt.SessionID)
	require.NoError(ts.T(), err)

	responseHeaders = make(http.Header)
	nrt, err = srv.RefreshTokenGrant(context.Background(), ts.Conn, req, responseHeaders, RefreshTokenGrantParams{
		RefreshToken: at.RefreshToken,
	})
	require.Error(ts.T(), err)
	require.Nil(ts.T(), nrt)

	require.Equal(ts.T(), "", responseHeaders.Get("sb-auth-session-id"))
}

// parseIDTokenClaims parses an ID token and returns the claims as a map
func parseIDTokenClaims(idToken string, config *conf.GlobalConfiguration) (jwt.MapClaims, error) {
	claims := jwt.MapClaims{}
	p := jwt.NewParser(jwt.WithValidMethods(config.JWT.ValidMethods))
	_, err := p.ParseWithClaims(idToken, claims, func(token *jwt.Token) (interface{}, error) {
		// Get the key ID from the token header
		if kid, ok := token.Header["kid"]; ok {
			if kidStr, ok := kid.(string); ok {
				// Find the public key by kid for asymmetric verification
				key, err := conf.FindPublicKeyByKid(context.Background(), kidStr, &config.JWT)
				if err != nil {
					return nil, err
				}
				return key, nil
			}
		}
		// Fallback to symmetric key (HS256) - this should fail for ID tokens
		return []byte(config.JWT.Secret), nil
	})
	if err != nil {
		return nil, err
	}
	return claims, nil
}

// IDTokenTestSuite tests ID token generation with different scopes
type IDTokenTestSuite struct {
	suite.Suite
	Conn   *storage.Connection
	User   *models.User
	Config *conf.GlobalConfiguration
}

func TestIDTokenGeneration(t *testing.T) {
	ts := &IDTokenTestSuite{}

	config, err := confload.LoadGlobal("../../hack/test_asymmetric.env")
	require.NoError(t, err)

	conn, err := test.SetupDBConnection(config)
	require.NoError(t, err)

	ts.Conn = conn
	ts.Config = config
	defer conn.Close()

	suite.Run(t, ts)
}

func (ts *IDTokenTestSuite) SetupTest() {
	models.TruncateAll(ts.Conn)
	u, err := models.NewUser("", "test@example.com", "password", "authenticated", nil)
	require.NoError(ts.T(), err)

	// Set user properties for testing scope-based claims
	u.Email = "test@example.com"
	u.EmailConfirmedAt = &u.CreatedAt
	u.Phone = "1234567890"
	u.PhoneConfirmedAt = &u.CreatedAt

	// Set user metadata for profile claims
	u.UserMetaData = map[string]interface{}{
		"full_name": "Test User",
		"name":      "Test User",
	}

	require.NoError(ts.T(), ts.Conn.Create(u))
	ts.User = u
}

func (ts *IDTokenTestSuite) TestIDTokenWithAllScopes() {
	srv := NewService(ts.Config, &panicHookManager{})

	clientID := uuid.Must(uuid.NewV4())
	params := GenerateIDTokenParams{
		User:     ts.User,
		ClientID: clientID,
		Nonce:    "test-nonce",
		Scopes:   []string{models.ScopeOpenID, models.ScopeEmail, models.ScopeProfile, models.ScopePhone},
	}

	idToken, err := srv.GenerateIDToken(context.Background(), params)
	require.NoError(ts.T(), err)
	require.NotEmpty(ts.T(), idToken)

	// Parse and verify claims
	claims, err := parseIDTokenClaims(idToken, ts.Config)
	require.NoError(ts.T(), err)

	// Should have email claims
	require.NotNil(ts.T(), claims["email"], "email claim should be present with email scope")
	require.NotNil(ts.T(), claims["email_verified"], "email_verified claim should be present with email scope")

	// Should have profile claims
	require.NotNil(ts.T(), claims["name"], "name claim should be present with profile scope")

	// Should have phone claims
	require.NotNil(ts.T(), claims["phone_number"], "phone_number claim should be present with phone scope")
	require.NotNil(ts.T(), claims["phone_number_verified"], "phone_number_verified claim should be present with phone scope")
}

func (ts *IDTokenTestSuite) TestIDTokenWithOnlyOpenIDScope() {
	srv := NewService(ts.Config, &panicHookManager{})

	clientID := uuid.Must(uuid.NewV4())
	params := GenerateIDTokenParams{
		User:     ts.User,
		ClientID: clientID,
		Nonce:    "test-nonce",
		Scopes:   []string{models.ScopeOpenID},
	}

	idToken, err := srv.GenerateIDToken(context.Background(), params)
	require.NoError(ts.T(), err)
	require.NotEmpty(ts.T(), idToken)

	// Parse and verify claims
	claims, err := parseIDTokenClaims(idToken, ts.Config)
	require.NoError(ts.T(), err)

	// Should have basic claims
	require.NotNil(ts.T(), claims["sub"], "sub claim should always be present")
	require.NotNil(ts.T(), claims["aud"], "aud claim should always be present")

	// Should NOT have scope-specific claims
	email, hasEmail := claims["email"]
	require.False(ts.T(), hasEmail || (email != nil && email != ""), "email claim should not be present without email scope")

	require.Nil(ts.T(), claims["name"], "name claim should not be present without profile scope")

	phoneNumber, hasPhone := claims["phone_number"]
	require.False(ts.T(), hasPhone || (phoneNumber != nil && phoneNumber != ""), "phone_number claim should not be present without phone scope")
}

func (ts *IDTokenTestSuite) TestIDTokenWithEmailScope() {
	srv := NewService(ts.Config, &panicHookManager{})

	clientID := uuid.Must(uuid.NewV4())
	params := GenerateIDTokenParams{
		User:     ts.User,
		ClientID: clientID,
		Nonce:    "test-nonce",
		Scopes:   []string{models.ScopeOpenID, models.ScopeEmail},
	}

	idToken, err := srv.GenerateIDToken(context.Background(), params)
	require.NoError(ts.T(), err)
	require.NotEmpty(ts.T(), idToken)

	// Parse and verify claims
	claims, err := parseIDTokenClaims(idToken, ts.Config)
	require.NoError(ts.T(), err)

	// Should have email claims
	require.NotNil(ts.T(), claims["email"], "email claim should be present with email scope")
	require.NotNil(ts.T(), claims["email_verified"], "email_verified claim should be present with email scope")

	// Should NOT have profile/phone claims
	require.Nil(ts.T(), claims["name"], "name claim should not be present without profile scope")

	phoneNumber, hasPhone := claims["phone_number"]
	require.False(ts.T(), hasPhone || (phoneNumber != nil && phoneNumber != ""), "phone_number claim should not be present without phone scope")
}

func (ts *IDTokenTestSuite) TestIDTokenWithProfileScope() {
	srv := NewService(ts.Config, &panicHookManager{})

	clientID := uuid.Must(uuid.NewV4())
	params := GenerateIDTokenParams{
		User:     ts.User,
		ClientID: clientID,
		Nonce:    "test-nonce",
		Scopes:   []string{models.ScopeOpenID, models.ScopeProfile},
	}

	idToken, err := srv.GenerateIDToken(context.Background(), params)
	require.NoError(ts.T(), err)
	require.NotEmpty(ts.T(), idToken)

	// Parse and verify claims
	claims, err := parseIDTokenClaims(idToken, ts.Config)
	require.NoError(ts.T(), err)

	// Should have profile claims
	require.NotNil(ts.T(), claims["name"], "name claim should be present with profile scope")

	// Should NOT have email/phone claims
	email, hasEmail := claims["email"]
	require.False(ts.T(), hasEmail || (email != nil && email != ""), "email claim should not be present without email scope")

	phoneNumber, hasPhone := claims["phone_number"]
	require.False(ts.T(), hasPhone || (phoneNumber != nil && phoneNumber != ""), "phone_number claim should not be present without phone scope")
}

func (ts *IDTokenTestSuite) TestIDTokenWithPhoneScope() {
	srv := NewService(ts.Config, &panicHookManager{})

	clientID := uuid.Must(uuid.NewV4())
	params := GenerateIDTokenParams{
		User:     ts.User,
		ClientID: clientID,
		Nonce:    "test-nonce",
		Scopes:   []string{models.ScopeOpenID, models.ScopePhone},
	}

	idToken, err := srv.GenerateIDToken(context.Background(), params)
	require.NoError(ts.T(), err)
	require.NotEmpty(ts.T(), idToken)

	// Parse and verify claims
	claims, err := parseIDTokenClaims(idToken, ts.Config)
	require.NoError(ts.T(), err)

	// Should have phone claims
	require.NotNil(ts.T(), claims["phone_number"], "phone_number claim should be present with phone scope")
	require.NotNil(ts.T(), claims["phone_number_verified"], "phone_number_verified claim should be present with phone scope")

	// Should NOT have email/profile claims
	email, hasEmail := claims["email"]
	require.False(ts.T(), hasEmail || (email != nil && email != ""), "email claim should not be present without email scope")

	require.Nil(ts.T(), claims["name"], "name claim should not be present without profile scope")
}

func (ts *IDTokenTestSuite) TestIDTokenWithMultipleScopes() {
	srv := NewService(ts.Config, &panicHookManager{})

	clientID := uuid.Must(uuid.NewV4())
	params := GenerateIDTokenParams{
		User:     ts.User,
		ClientID: clientID,
		Nonce:    "test-nonce",
		Scopes:   []string{models.ScopeOpenID, models.ScopeEmail, models.ScopeProfile},
	}

	idToken, err := srv.GenerateIDToken(context.Background(), params)
	require.NoError(ts.T(), err)
	require.NotEmpty(ts.T(), idToken)

	// Parse and verify claims
	claims, err := parseIDTokenClaims(idToken, ts.Config)
	require.NoError(ts.T(), err)

	// Should have email claims
	require.NotNil(ts.T(), claims["email"], "email claim should be present with email scope")
	require.NotNil(ts.T(), claims["email_verified"], "email_verified claim should be present with email scope")

	// Should have profile claims
	require.NotNil(ts.T(), claims["name"], "name claim should be present with profile scope")

	// Should NOT have phone claims
	phoneNumber, hasPhone := claims["phone_number"]
	require.False(ts.T(), hasPhone || (phoneNumber != nil && phoneNumber != ""), "phone_number claim should not be present without phone scope")
}

func TestAMRClaimUnmarshal(t *testing.T) {
	t.Run("mixed string and object formats", func(t *testing.T) {
		var claim AMRClaim
		before := time.Now().Unix()

		err := json.Unmarshal([]byte(`["password", {"method":"totp","timestamp":123,"provider":"webauthn"}]`), &claim)
		require.NoError(t, err)
		require.Len(t, claim, 2)

		require.Equal(t, "password", claim[0].Method)
		require.GreaterOrEqual(t, claim[0].Timestamp, before)
		require.LessOrEqual(t, claim[0].Timestamp, time.Now().Unix())
		require.Empty(t, claim[0].Provider, "string format should not have provider")

		require.Equal(t, "totp", claim[1].Method)
		require.Equal(t, int64(123), claim[1].Timestamp)
		require.Equal(t, "webauthn", claim[1].Provider, "provider should be preserved from object format")
	})

	t.Run("object with provider", func(t *testing.T) {
		var claim AMRClaim
		err := json.Unmarshal([]byte(`[{"method":"sso","timestamp":456,"provider":"saml"}]`), &claim)
		require.NoError(t, err)
		require.Len(t, claim, 1)
		require.Equal(t, "sso", claim[0].Method)
		require.Equal(t, int64(456), claim[0].Timestamp)
		require.Equal(t, "saml", claim[0].Provider, "provider should be preserved")
	})

	t.Run("object without provider", func(t *testing.T) {
		var claim AMRClaim
		err := json.Unmarshal([]byte(`[{"method":"password","timestamp":789}]`), &claim)
		require.NoError(t, err)
		require.Len(t, claim, 1)
		require.Equal(t, "password", claim[0].Method)
		require.Equal(t, int64(789), claim[0].Timestamp)
		require.Empty(t, claim[0].Provider, "provider should be empty when not provided")
	})

	t.Run("all strings", func(t *testing.T) {
		var claim AMRClaim
		before := time.Now().Unix()
		err := json.Unmarshal([]byte(`["password", "totp"]`), &claim)
		require.NoError(t, err)
		require.Len(t, claim, 2)
		require.Equal(t, "password", claim[0].Method)
		require.Equal(t, "totp", claim[1].Method)
		require.GreaterOrEqual(t, claim[0].Timestamp, before)
		require.Empty(t, claim[0].Provider)
		require.Empty(t, claim[1].Provider)
	})

	t.Run("all objects", func(t *testing.T) {
		var claim AMRClaim
		err := json.Unmarshal([]byte(`[{"method":"password","timestamp":100},{"method":"totp","timestamp":200,"provider":"webauthn"}]`), &claim)
		require.NoError(t, err)
		require.Len(t, claim, 2)
		require.Equal(t, "password", claim[0].Method)
		require.Equal(t, int64(100), claim[0].Timestamp)
		require.Empty(t, claim[0].Provider)
		require.Equal(t, "totp", claim[1].Method)
		require.Equal(t, int64(200), claim[1].Timestamp)
		require.Equal(t, "webauthn", claim[1].Provider, "provider should be preserved")
	})
}

func (ts *RefreshTokenV2Suite) TestRefreshTokenVersionUpgrade() {
	config := ts.config()

	require.Equal(ts.T(), 2, config.Security.RefreshTokenAlgorithmVersion)

	// start out with version 1, to issue a session with the old refresh tokens
	// which then will be upgraded to the new one
	config.Security.RefreshTokenAlgorithmVersion = 1
	config.Security.RefreshTokenRotationEnabled = false
	config.Security.RefreshTokenReuseInterval = 1
	config.Security.RefreshTokenAllowReuse = false

	clock := time.Now()

	srv := NewService(config, &panicHookManager{})
	srv.SetTimeFunc(func() time.Time {
		return clock
	})

	req, err := http.NewRequest("POST", "https://example.com/", nil)
	require.NoError(ts.T(), err)

	req = req.WithContext(context.Background())
	responseHeaders := make(http.Header)

	at, err := srv.IssueRefreshToken(
		req,
		responseHeaders,
		ts.Conn,
		ts.User,
		models.PasswordGrant,
		models.GrantParams{},
	)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), at)

	refreshTokenToUse := at.RefreshToken

	// now set the algorithm to 2 and start upgrading
	config.Security.RefreshTokenAlgorithmVersion = 2
	config.Security.RefreshTokenUpgradePercentage = 100

	clock = clock.Add(time.Duration(config.Security.RefreshTokenReuseInterval)*time.Second + time.Duration(100)*time.Millisecond)
	responseHeaders = make(http.Header)

	nrt, err := srv.RefreshTokenGrant(context.Background(), ts.Conn, req, responseHeaders, RefreshTokenGrantParams{
		RefreshToken: refreshTokenToUse,
	})
	require.NoError(ts.T(), err)

	pnrt, err := crypto.ParseRefreshToken(nrt.RefreshToken)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), pnrt)
	require.Equal(ts.T(), int64(0), pnrt.Counter)

	refreshedSession, err := models.FindSessionByID(ts.Conn, pnrt.SessionID, false)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), refreshedSession.RefreshTokenCounter)
	require.NotNil(ts.T(), refreshedSession.RefreshTokenHmacKey)
	require.Equal(ts.T(), int64(0), *refreshedSession.RefreshTokenCounter)

	require.Equal(ts.T(), refreshedSession.UserID.String(), responseHeaders.Get("sb-auth-user-id"))
	require.Equal(ts.T(), refreshedSession.ID.String(), responseHeaders.Get("sb-auth-session-id"))
	require.Equal(ts.T(), "0", responseHeaders.Get("sb-auth-refresh-token-counter"))
}

// TestAsRedirectURL tests that AsRedirectURL includes the Supabase Auth identifier
func TestAsRedirectURL(t *testing.T) {
	response := &AccessTokenResponse{
		Token:        "test_access_token",
		TokenType:    "bearer",
		ExpiresIn:    3600,
		ExpiresAt:    1234567890,
		RefreshToken: "test_refresh_token",
	}

	extraParams := url.Values{}
	extraParams.Set("provider_token", "provider_access_token")

	redirectURL := response.AsRedirectURL("https://example.com/callback", extraParams)

	// Parse the URL
	u, err := url.Parse(redirectURL)
	require.NoError(t, err)

	// Parse the fragment
	fragment, err := url.ParseQuery(u.Fragment)
	require.NoError(t, err)

	// Verify all expected parameters are present
	require.Equal(t, "test_access_token", fragment.Get("access_token"))
	require.Equal(t, "bearer", fragment.Get("token_type"))
	require.Equal(t, "3600", fragment.Get("expires_in"))
	require.Equal(t, "1234567890", fragment.Get("expires_at"))
	require.Equal(t, "test_refresh_token", fragment.Get("refresh_token"))
	require.Equal(t, "provider_access_token", fragment.Get("provider_token"))

	// Verify Supabase Auth identifier is present
	require.Contains(t, fragment, "sb", "Fragment should contain Supabase Auth identifier 'sb'")
	require.Equal(t, "", fragment.Get("sb"), "Supabase Auth identifier should have empty value")
}

func TestGenerateAccessTokenAllowLowAAL(t *testing.T) {
	config, err := confload.LoadGlobal("../../hack/test.env")
	require.NoError(t, err)

	conn, err := test.SetupDBConnection(config)
	require.NoError(t, err)
	defer conn.Close()

	allowLowAAL := 5 * time.Minute

	req, err := http.NewRequest("POST", "https://example.com/", nil)
	require.NoError(t, err)

	now := time.Now().UTC().Truncate(time.Second)

	t.Run("AAL1 session for MFA user uses AllowLowAAL expiry", func(t *testing.T) {
		models.TruncateAll(conn)

		u, err := models.NewUser("", "test@example.com", "password", "authenticated", nil)
		require.NoError(t, err)
		require.NoError(t, conn.Create(u))

		// Add a verified TOTP factor so HighestPossibleAAL() returns AAL2
		factor := models.NewFactor(u, "my-totp", models.TOTP, models.FactorStateVerified)
		require.NoError(t, conn.Create(factor))
		require.NoError(t, conn.Eager().Find(u, u.ID))

		session, err := models.NewSession(u.ID, nil)
		require.NoError(t, err)
		// Session stays at AAL1 (default)
		require.NoError(t, conn.Create(session))

		cfg := *config
		cfg.Sessions.AllowLowAAL = &allowLowAAL

		srv := NewService(&cfg, &panicHookManager{})
		srv.SetTimeFunc(func() time.Time { return now })

		_, expiresAt, err := srv.GenerateAccessToken(req, conn, GenerateAccessTokenParams{
			User:                 u,
			SessionID:            &session.ID,
			AuthenticationMethod: models.PasswordGrant,
		})
		require.NoError(t, err)
		require.Equal(t, session.CreatedAt.UTC().Add(allowLowAAL).Unix(), expiresAt)
	})

	t.Run("AAL2 session for MFA user uses standard JWT expiry", func(t *testing.T) {
		models.TruncateAll(conn)

		u, err := models.NewUser("", "test2@example.com", "password", "authenticated", nil)
		require.NoError(t, err)
		require.NoError(t, conn.Create(u))

		factor := models.NewFactor(u, "my-totp", models.TOTP, models.FactorStateVerified)
		require.NoError(t, conn.Create(factor))
		require.NoError(t, conn.Eager().Find(u, u.ID))

		session, err := models.NewSession(u.ID, &factor.ID)
		require.NoError(t, err)
		aal2 := models.AAL2.String()
		session.AAL = &aal2
		require.NoError(t, conn.Create(session))
		require.NoError(t, models.AddClaimToSession(conn, session.ID, models.TOTPSignIn))

		cfg := *config
		cfg.Sessions.AllowLowAAL = &allowLowAAL

		srv := NewService(&cfg, &panicHookManager{})
		srv.SetTimeFunc(func() time.Time { return now })

		_, expiresAt, err := srv.GenerateAccessToken(req, conn, GenerateAccessTokenParams{
			User:                 u,
			SessionID:            &session.ID,
			AuthenticationMethod: models.PasswordGrant,
		})
		require.NoError(t, err)
		require.Equal(t, now.Add(time.Second*time.Duration(config.JWT.Exp)).Unix(), expiresAt)
	})

	t.Run("AAL1 session without AllowLowAAL uses standard JWT expiry", func(t *testing.T) {
		models.TruncateAll(conn)

		u, err := models.NewUser("", "test3@example.com", "password", "authenticated", nil)
		require.NoError(t, err)
		require.NoError(t, conn.Create(u))

		factor := models.NewFactor(u, "my-totp", models.TOTP, models.FactorStateVerified)
		require.NoError(t, conn.Create(factor))
		require.NoError(t, conn.Eager().Find(u, u.ID))

		session, err := models.NewSession(u.ID, nil)
		require.NoError(t, err)
		require.NoError(t, conn.Create(session))

		cfg := *config
		cfg.Sessions.AllowLowAAL = nil

		srv := NewService(&cfg, &panicHookManager{})
		srv.SetTimeFunc(func() time.Time { return now })

		_, expiresAt, err := srv.GenerateAccessToken(req, conn, GenerateAccessTokenParams{
			User:                 u,
			SessionID:            &session.ID,
			AuthenticationMethod: models.PasswordGrant,
		})
		require.NoError(t, err)
		require.Equal(t, now.Add(time.Second*time.Duration(config.JWT.Exp)).Unix(), expiresAt)
	})
}
