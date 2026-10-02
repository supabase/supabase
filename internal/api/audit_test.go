package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/models"
)

type AuditTestSuite struct {
	suite.Suite
	API    *API
	Config *conf.GlobalConfiguration

	token string
}

func TestAudit(t *testing.T) {
	api, config, err := setupAPIForTest()
	require.NoError(t, err)

	ts := &AuditTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()

	suite.Run(t, ts)
}

func (ts *AuditTestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)
	ts.token = ts.makeSuperAdmin("")
}

func (ts *AuditTestSuite) makeSuperAdmin(email string) string {
	u, err := models.NewUser("", email, "test", ts.Config.JWT.Aud, map[string]interface{}{"full_name": "Test User"})
	require.NoError(ts.T(), err, "Error making new user")

	u.Role = "supabase_admin"
	require.NoError(ts.T(), ts.API.db.Create(u))

	session, err := models.NewSession(u.ID, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(session))

	var token string

	req := httptest.NewRequest(http.MethodPost, "/token?grant_type=password", nil)
	token, _, err = ts.API.generateAccessToken(req, ts.API.db, u, &session.ID, models.PasswordGrant)
	require.NoError(ts.T(), err, "Error generating access token")

	p := jwt.NewParser(jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Name}))
	_, err = p.Parse(token, func(token *jwt.Token) (interface{}, error) {
		return []byte(ts.Config.JWT.Secret), nil
	})
	require.NoError(ts.T(), err, "Error parsing token")

	return token
}

func (ts *AuditTestSuite) TestAuditGet() {
	ts.prepareDeleteEvent()
	// CHECK FOR AUDIT LOG

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/admin/audit", nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	assert.Equal(ts.T(), "</admin/audit?page=1>; rel=\"last\"", w.Header().Get("Link"))
	assert.Equal(ts.T(), "1", w.Header().Get("X-Total-Count"))

	logs := []models.AuditLogEntry{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&logs))

	require.Len(ts.T(), logs, 1)
	require.Contains(ts.T(), logs[0].Payload, "actor_username")
	assert.Equal(ts.T(), "supabase_admin", logs[0].Payload["actor_username"])
	traits, ok := logs[0].Payload["traits"].(map[string]interface{})
	require.True(ts.T(), ok)
	require.Contains(ts.T(), traits, "user_email")
	assert.Equal(ts.T(), "test-delete@example.com", traits["user_email"])
}

func (ts *AuditTestSuite) TestAuditFilters() {
	ts.prepareDeleteEvent()

	queries := []string{
		"/admin/audit?query=action:user_deleted",
		"/admin/audit?query=type:team",
		"/admin/audit?query=author:admin",
	}

	for _, q := range queries {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, q, nil)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

		ts.API.handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusOK, w.Code)

		logs := []models.AuditLogEntry{}
		require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&logs))

		require.Len(ts.T(), logs, 1)
		require.Contains(ts.T(), logs[0].Payload, "actor_username")
		assert.Equal(ts.T(), "supabase_admin", logs[0].Payload["actor_username"])
		traits, ok := logs[0].Payload["traits"].(map[string]interface{})
		require.True(ts.T(), ok)
		require.Contains(ts.T(), traits, "user_email")
		assert.Equal(ts.T(), "test-delete@example.com", traits["user_email"])
	}
}

func (ts *AuditTestSuite) prepareDeleteEvent() {
	// DELETE USER
	u, err := models.NewUser("12345678", "test-delete@example.com", "test", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	// Setup request
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/admin/users/%s", u.ID), nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)
}
