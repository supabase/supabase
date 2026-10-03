package oauthserver

import (
	"net/http"
	"net/http/httptest"

	logrustest "github.com/sirupsen/logrus/hooks/test"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/api/shared"
)

func (ts *OAuthClientTestSuite) TestAuthorizationCodeGrantRecordsOAuthServerLoginMetric() {
	client, _ := ts.createTestOAuthClient()
	user := ts.createTestUser("oauth-server-metering@example.com")
	code := ts.mintApprovedCode(client.ID, user.ID)

	hook := logrustest.NewGlobal()
	defer hook.Reset()

	req := httptest.NewRequest(http.MethodPost, "/oauth/token", nil)
	ctx := shared.WithOAuthServerClient(req.Context(), client)
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()
	params := &OAuthTokenParams{GrantType: GrantTypeAuthorizationCode, Code: code}

	err := ts.Server.handleAuthorizationCodeGrant(ctx, w, req, params)
	require.NoError(ts.T(), err)

	found := false
	for _, entry := range hook.AllEntries() {
		if entry.Data["action"] == "login" && entry.Data["login_method"] == "oauth_server" {
			require.Equal(ts.T(), client.ID.String(), entry.Data["client_id"])
			require.Equal(ts.T(), "authorization_code", entry.Data["grant_type"])
			require.Equal(ts.T(), user.ID.String(), entry.Data["user_id"])
			found = true
		}
	}
	require.True(ts.T(), found, "expected an oauth_server login metering event for the authorization_code grant")
}
