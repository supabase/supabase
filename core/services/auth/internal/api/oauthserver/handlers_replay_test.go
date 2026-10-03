package oauthserver

import (
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/api/shared"
	"github.com/supabase/auth/internal/models"
)

func (ts *OAuthClientTestSuite) mintApprovedCode(clientID, userID uuid.UUID) string {
	auth := models.NewOAuthServerAuthorization(models.NewOAuthServerAuthorizationParams{
		ClientID:    clientID,
		RedirectURI: "https://example.com/callback",
		Scope:       "profile",
		TTL:         time.Hour,
	})
	require.NoError(ts.T(), models.CreateOAuthServerAuthorization(ts.DB, auth))
	require.NoError(ts.T(), auth.SetUser(ts.DB, userID))
	require.NoError(ts.T(), auth.Approve(ts.DB))
	return *auth.AuthorizationCode
}

func (ts *OAuthClientTestSuite) TestAuthCodeReplayRace() {
	client, _ := ts.createTestOAuthClient()
	user := ts.createTestUser("replay-race@example.com")
	code := ts.mintApprovedCode(client.ID, user.ID)

	const n = 10
	start := make(chan struct{})
	var wg sync.WaitGroup
	var success int32

	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			req := httptest.NewRequest(http.MethodPost, "/oauth/token", nil)
			ctx := shared.WithOAuthServerClient(req.Context(), client)
			req = req.WithContext(ctx)
			w := httptest.NewRecorder()
			params := &OAuthTokenParams{GrantType: GrantTypeAuthorizationCode, Code: code}

			<-start
			if err := ts.Server.handleAuthorizationCodeGrant(ctx, w, req, params); err == nil {
				atomic.AddInt32(&success, 1)
			}
		}()
	}

	close(start)
	wg.Wait()

	assert.Equal(ts.T(), int32(1), success, "authorization code must be single-use: expected exactly one successful redemption, got %d", success)

	_, err := models.FindOAuthServerAuthorizationByCode(ts.DB, code)
	assert.True(ts.T(), models.IsNotFoundError(err), "authorization code should be consumed after redemption")
}
