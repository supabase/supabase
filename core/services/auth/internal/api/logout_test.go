package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/models"
)

type LogoutTestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration
	token  string
}

func TestLogout(t *testing.T) {
	api, config, err := setupAPIForTest()
	require.NoError(t, err)

	ts := &LogoutTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()

	suite.Run(t, ts)
}

func (ts *LogoutTestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)

	u, err := models.NewUser("", "test@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error creating test user model")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error saving new test user")

	// generate access token to use for logout
	var t string
	s, err := models.NewSession(u.ID, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(s))

	req := httptest.NewRequest(http.MethodPost, "/token?grant_type=password", nil)
	t, _, err = ts.API.generateAccessToken(req, ts.API.db, u, &s.ID, models.PasswordGrant)
	require.NoError(ts.T(), err)
	ts.token = t
}

func (ts *LogoutTestSuite) TestLogoutSuccess() {
	for _, scope := range []string{"", "global", "local", "others"} {
		ts.SetupTest()

		reqURL, err := url.ParseRequestURI("http://localhost/logout")
		require.NoError(ts.T(), err)

		if scope != "" {
			query := reqURL.Query()
			query.Set("scope", scope)
			reqURL.RawQuery = query.Encode()
		}

		req := httptest.NewRequest(http.MethodPost, reqURL.String(), nil)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))
		w := httptest.NewRecorder()

		ts.API.handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusNoContent, w.Code)
	}
}
