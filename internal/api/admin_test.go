package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofrs/uuid"
	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/models"
)

type AdminTestSuite struct {
	suite.Suite
	User   *models.User
	API    *API
	Config *conf.GlobalConfiguration

	token string
}

func TestAdmin(t *testing.T) {
	api, config, err := setupAPIForTest()
	require.NoError(t, err)

	ts := &AdminTestSuite{
		API:    api,
		Config: config,
	}
	defer api.db.Close()

	suite.Run(t, ts)
}

func (ts *AdminTestSuite) SetupTest() {
	models.TruncateAll(ts.API.db)
	ts.Config.External.Email.Enabled = true
	claims := &AccessTokenClaims{
		Role: "supabase_admin",
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(ts.Config.JWT.Secret))
	require.NoError(ts.T(), err, "Error generating admin jwt")
	ts.token = token
}

// TestAdminUsersUnauthorized tests API /admin/users route without authentication
func (ts *AdminTestSuite) TestAdminUsersUnauthorized() {
	req := httptest.NewRequest(http.MethodGet, "/admin/users", nil)
	w := httptest.NewRecorder()

	ts.API.handler.ServeHTTP(w, req)
	assert.Equal(ts.T(), http.StatusUnauthorized, w.Code)
}

// TestAdminUsers tests API /admin/users route
func (ts *AdminTestSuite) TestAdminUsers() {
	// Setup request
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/admin/users", nil)

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	assert.Equal(ts.T(), "</admin/users?page=0>; rel=\"last\"", w.Header().Get("Link"))
	assert.Equal(ts.T(), "0", w.Header().Get("X-Total-Count"))
}

// TestAdminUsers tests API /admin/users route
func (ts *AdminTestSuite) TestAdminUsers_Pagination() {
	u, err := models.NewUser("12345678", "test1@example.com", "test", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	u, err = models.NewUser("987654321", "test2@example.com", "test", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	// Setup request
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/admin/users?per_page=1", nil)

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	assert.Equal(ts.T(), "</admin/users?page=2&per_page=1>; rel=\"next\", </admin/users?page=2&per_page=1>; rel=\"last\"", w.Header().Get("Link"))
	assert.Equal(ts.T(), "2", w.Header().Get("X-Total-Count"))

	data := make(map[string]interface{})
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
	for _, user := range data["users"].([]interface{}) {
		assert.NotEmpty(ts.T(), user)
	}
}

// TestAdminUsers tests API /admin/users route
func (ts *AdminTestSuite) TestAdminUsers_SortAsc() {
	u, err := models.NewUser("", "test1@example.com", "test", ts.Config.JWT.Aud, nil)
	u.CreatedAt = time.Now().Add(-time.Minute)
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	u, err = models.NewUser("", "test2@example.com", "test", ts.Config.JWT.Aud, nil)
	u.CreatedAt = time.Now()
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	// Setup request
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/admin/users", nil)
	qv := req.URL.Query()
	qv.Set("sort", "created_at asc")
	req.URL.RawQuery = qv.Encode()

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	data := struct {
		Users []*models.User `json:"users"`
		Aud   string         `json:"aud"`
	}{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))

	require.Len(ts.T(), data.Users, 2)
	assert.Equal(ts.T(), "test1@example.com", data.Users[0].GetEmail())
	assert.Equal(ts.T(), "test2@example.com", data.Users[1].GetEmail())
}

// TestAdminUsers tests API /admin/users route
func (ts *AdminTestSuite) TestAdminUsers_SortDesc() {
	u, err := models.NewUser("12345678", "test1@example.com", "test", ts.Config.JWT.Aud, nil)
	u.CreatedAt = time.Now().Add(-time.Minute)
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	u, err = models.NewUser("987654321", "test2@example.com", "test", ts.Config.JWT.Aud, nil)
	u.CreatedAt = time.Now()
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	// Setup request
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/admin/users", nil)

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	data := struct {
		Users []*models.User `json:"users"`
		Aud   string         `json:"aud"`
	}{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))

	require.Len(ts.T(), data.Users, 2)
	assert.Equal(ts.T(), "test2@example.com", data.Users[0].GetEmail())
	assert.Equal(ts.T(), "test1@example.com", data.Users[1].GetEmail())
}

type adminUsersCursorResponse struct {
	Users      []*models.User            `json:"users"`
	Aud        string                    `json:"aud"`
	Pagination *CursorPaginationResponse `json:"pagination"`
}

// TestAdminUsers_CursorPaginationDisabled ensures that with the flag off the
// endpoint serves the unchanged offset response (X-Total-Count set, no
// pagination block) even when a client passes cursor-style params.
func (ts *AdminTestSuite) TestAdminUsers_CursorPaginationDisabled() {
	ts.Config.Experimental.CursorPaginationEnabled = false

	u, err := models.NewUser("", "test1@example.com", "test", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(u))

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/admin/users?limit=1", nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	assert.Equal(ts.T(), "1", w.Header().Get("X-Total-Count"))
	assert.NotContains(ts.T(), w.Header().Get("Link"), `rel="next"`)

	var data adminUsersCursorResponse
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
	assert.Nil(ts.T(), data.Pagination, "offset mode must not emit a pagination block")
}

// TestAdminUsers_CursorPaginationEnabled walks every page with cursor mode on
// and asserts full coverage with no duplicates or skips.
func (ts *AdminTestSuite) TestAdminUsers_CursorPaginationEnabled() {
	ts.Config.Experimental.CursorPaginationEnabled = true
	defer func() { ts.Config.Experimental.CursorPaginationEnabled = false }()

	const total = 5
	want := map[string]bool{}
	for i := 0; i < total; i++ {
		email := fmt.Sprintf("cursor%d@example.com", i)
		u, err := models.NewUser("", email, "test", ts.Config.JWT.Aud, nil)
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.API.db.Create(u))
		want[email] = true
	}

	seen := map[string]bool{}
	cursor := ""
	sawNextLink := false
	for page := 0; page < 20; page++ {
		target := "/admin/users?limit=2"
		if cursor != "" {
			target += "&cursor=" + cursor
		}

		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, target, nil)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

		ts.API.handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusOK, w.Code)

		// offset-only headers must be absent in cursor mode
		assert.Empty(ts.T(), w.Header().Get("X-Total-Count"))

		var data adminUsersCursorResponse
		require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
		require.NotNil(ts.T(), data.Pagination)

		for _, u := range data.Users {
			require.False(ts.T(), seen[u.GetEmail()], "user returned twice: %s", u.GetEmail())
			seen[u.GetEmail()] = true
		}

		if data.Pagination.HasMore {
			require.NotEmpty(ts.T(), data.Pagination.NextCursor)
			require.Contains(ts.T(), w.Header().Get("Link"), `rel="next"`)
			sawNextLink = true
			cursor = data.Pagination.NextCursor
			continue
		}

		require.Empty(ts.T(), data.Pagination.NextCursor)
		assert.NotContains(ts.T(), w.Header().Get("Link"), `rel="next"`)
		break
	}

	require.Equal(ts.T(), want, seen, "cursor walk must cover every user exactly once")
	require.True(ts.T(), sawNextLink, "expected at least one intermediate page with a next cursor")
}

// TestAdminUsers_CursorPaginationBackwardCompat ensures that even with the flag
// on, a client that still pages by number stays in offset mode.
func (ts *AdminTestSuite) TestAdminUsers_CursorPaginationBackwardCompat() {
	ts.Config.Experimental.CursorPaginationEnabled = true
	defer func() { ts.Config.Experimental.CursorPaginationEnabled = false }()

	for i := 0; i < 2; i++ {
		u, err := models.NewUser("", fmt.Sprintf("compat%d@example.com", i), "test", ts.Config.JWT.Aud, nil)
		require.NoError(ts.T(), err)
		require.NoError(ts.T(), ts.API.db.Create(u))
	}

	// either offset-style param must keep the request in offset mode, even
	// with the flag on
	for _, target := range []string{
		"/admin/users?page=1&per_page=1",
		"/admin/users?per_page=1",
	} {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, target, nil)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

		ts.API.handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusOK, w.Code)

		assert.Equal(ts.T(), "2", w.Header().Get("X-Total-Count"), "offset mode expected for %s", target)

		var data adminUsersCursorResponse
		require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
		assert.Nil(ts.T(), data.Pagination)
		require.Len(ts.T(), data.Users, 1, "per_page must be honored for %s", target)
	}
}

// TestAdminUsers_CursorPaginationBadCursor ensures a malformed cursor is a 400.
func (ts *AdminTestSuite) TestAdminUsers_CursorPaginationBadCursor() {
	ts.Config.Experimental.CursorPaginationEnabled = true
	defer func() { ts.Config.Experimental.CursorPaginationEnabled = false }()

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/admin/users?cursor=not-a-valid-cursor*", nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusBadRequest, w.Code)
}

// TestAdminUsers tests API /admin/users route
func (ts *AdminTestSuite) TestAdminUsers_FilterEmail() {
	u, err := models.NewUser("", "test1@example.com", "test", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	// Setup request
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/admin/users?filter=test1", nil)

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	data := struct {
		Users []*models.User `json:"users"`
		Aud   string         `json:"aud"`
	}{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))

	require.Len(ts.T(), data.Users, 1)
	assert.Equal(ts.T(), "test1@example.com", data.Users[0].GetEmail())
}

// TestAdminUsers tests API /admin/users route
func (ts *AdminTestSuite) TestAdminUsers_FilterName() {
	u, err := models.NewUser("", "test1@example.com", "test", ts.Config.JWT.Aud, map[string]interface{}{"full_name": "Test User"})
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	u, err = models.NewUser("", "test2@example.com", "test", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	// Setup request
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/admin/users?filter=User", nil)

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	data := struct {
		Users []*models.User `json:"users"`
		Aud   string         `json:"aud"`
	}{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))

	require.Len(ts.T(), data.Users, 1)
	assert.Equal(ts.T(), "test1@example.com", data.Users[0].GetEmail())
}

// TestAdminUserCreate tests API /admin/user route (POST)
func (ts *AdminTestSuite) TestAdminUserCreate() {
	cases := []struct {
		desc     string
		params   map[string]interface{}
		expected map[string]interface{}
	}{
		{
			desc: "Only phone",
			params: map[string]interface{}{
				"phone":    "123456789",
				"password": "test123",
			},
			expected: map[string]interface{}{
				"email":           "",
				"phone":           "123456789",
				"isAuthenticated": true,
				"provider":        "phone",
				"providers":       []string{"phone"},
				"password":        "test123",
			},
		},
		{
			desc: "With password",
			params: map[string]interface{}{
				"email":    "test1@example.com",
				"phone":    "123456789",
				"password": "test123",
			},
			expected: map[string]interface{}{
				"email":           "test1@example.com",
				"phone":           "123456789",
				"isAuthenticated": true,
				"provider":        "email",
				"providers":       []string{"email", "phone"},
				"password":        "test123",
			},
		},
		{
			desc: "Without password",
			params: map[string]interface{}{
				"email": "test2@example.com",
				"phone": "",
			},
			expected: map[string]interface{}{
				"email":           "test2@example.com",
				"phone":           "",
				"isAuthenticated": false,
				"provider":        "email",
				"providers":       []string{"email"},
			},
		},
		{
			desc: "With empty string password",
			params: map[string]interface{}{
				"email":    "test3@example.com",
				"phone":    "",
				"password": "",
			},
			expected: map[string]interface{}{
				"email":           "test3@example.com",
				"phone":           "",
				"isAuthenticated": false,
				"provider":        "email",
				"providers":       []string{"email"},
				"password":        "",
			},
		},
		{
			desc: "Ban created user",
			params: map[string]interface{}{
				"email":        "test4@example.com",
				"phone":        "",
				"password":     "test123",
				"ban_duration": "24h",
			},
			expected: map[string]interface{}{
				"email":           "test4@example.com",
				"phone":           "",
				"isAuthenticated": true,
				"provider":        "email",
				"providers":       []string{"email"},
				"password":        "test123",
			},
		},
		{
			desc: "With password hash",
			params: map[string]interface{}{
				"email":         "test5@example.com",
				"password_hash": "$2y$10$SXEz2HeT8PUIGQXo9yeUIem8KzNxgG0d7o/.eGj2rj8KbRgAuRVlq",
			},
			expected: map[string]interface{}{
				"email":           "test5@example.com",
				"phone":           "",
				"isAuthenticated": true,
				"provider":        "email",
				"providers":       []string{"email"},
				"password":        "test",
			},
		},
		{
			desc: "With custom id",
			params: map[string]interface{}{
				"id":       "fc56ab41-2010-4870-a9b9-767c1dc573fb",
				"email":    "test6@example.com",
				"password": "test123",
			},
			expected: map[string]interface{}{
				"id":              "fc56ab41-2010-4870-a9b9-767c1dc573fb",
				"email":           "test6@example.com",
				"phone":           "",
				"isAuthenticated": true,
				"provider":        "email",
				"providers":       []string{"email"},
				"password":        "test123",
			},
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(c.params))

			// Setup request
			w := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, "/admin/users", &buffer)

			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))
			ts.Config.External.Phone.Enabled = true

			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), http.StatusOK, w.Code)

			data := models.User{}
			require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
			assert.Equal(ts.T(), c.expected["email"], data.GetEmail())
			assert.Equal(ts.T(), c.expected["phone"], data.GetPhone())
			assert.Equal(ts.T(), c.expected["provider"], data.AppMetaData["provider"])
			assert.ElementsMatch(ts.T(), c.expected["providers"], data.AppMetaData["providers"])

			u, err := models.FindUserByID(ts.API.db, data.ID)
			require.NoError(ts.T(), err)

			// verify that the corresponding identities were created
			require.NotEmpty(ts.T(), u.Identities)
			for _, identity := range u.Identities {
				require.Equal(ts.T(), u.ID, identity.UserID)
				if identity.Provider == "email" {
					require.Equal(ts.T(), c.expected["email"], identity.IdentityData["email"])
				}
				if identity.Provider == "phone" {
					require.Equal(ts.T(), c.expected["phone"], identity.IdentityData["phone"])
				}
			}

			if _, ok := c.expected["password"]; ok {
				expectedPassword := fmt.Sprintf("%v", c.expected["password"])
				isAuthenticated, _, err := u.Authenticate(context.Background(), ts.API.db, expectedPassword, ts.API.config.Security.DBEncryption.DecryptionKeys, ts.API.config.Security.DBEncryption.Encrypt, ts.API.config.Security.DBEncryption.EncryptionKeyID)
				require.NoError(ts.T(), err)
				require.Equal(ts.T(), c.expected["isAuthenticated"], isAuthenticated)
			}

			if id, ok := c.expected["id"]; ok {
				uid, err := uuid.FromString(id.(string))
				require.NoError(ts.T(), err)
				require.Equal(ts.T(), uid, data.ID)
			}

			// remove created user after each case
			require.NoError(ts.T(), ts.API.db.Destroy(u))
		})
	}
}

// TestAdminUserGet tests API /admin/user route (GET)
func (ts *AdminTestSuite) TestAdminUserGet() {
	u, err := models.NewUser("12345678", "test1@example.com", "test", ts.Config.JWT.Aud, map[string]interface{}{"full_name": "Test Get User"})
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	// Setup request
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/admin/users/%s", u.ID), nil)

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	data := make(map[string]interface{})
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))

	assert.Equal(ts.T(), data["email"], "test1@example.com")
	assert.NotNil(ts.T(), data["app_metadata"])
	assert.NotNil(ts.T(), data["user_metadata"])
	md := data["user_metadata"].(map[string]interface{})
	assert.Len(ts.T(), md, 1)
	assert.Equal(ts.T(), "Test Get User", md["full_name"])
}

// TestAdminUserUpdate tests API /admin/user route (UPDATE)
func (ts *AdminTestSuite) TestAdminUserUpdate() {
	u, err := models.NewUser("12345678", "test1@example.com", "test", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	var buffer bytes.Buffer
	newEmail := "test2@example.com"
	newPhone := "234567890"
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"role": "testing",
		"app_metadata": map[string]interface{}{
			"roles": []string{"writer", "editor"},
		},
		"user_metadata": map[string]interface{}{
			"name": "David",
		},
		"ban_duration": "24h",
		"email":        newEmail,
		"phone":        newPhone,
	}))

	// Setup request
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/admin/users/%s", u.ID), &buffer)

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	data := models.User{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))

	assert.Equal(ts.T(), "testing", data.Role)
	assert.NotNil(ts.T(), data.UserMetaData)
	assert.Equal(ts.T(), "David", data.UserMetaData["name"])
	assert.Equal(ts.T(), newEmail, data.GetEmail())
	assert.Equal(ts.T(), newPhone, data.GetPhone())

	assert.NotNil(ts.T(), data.AppMetaData)
	assert.Len(ts.T(), data.AppMetaData["roles"], 2)
	assert.Contains(ts.T(), data.AppMetaData["roles"], "writer")
	assert.Contains(ts.T(), data.AppMetaData["roles"], "editor")
	assert.NotNil(ts.T(), data.BannedUntil)

	u, err = models.FindUserByID(ts.API.db, data.ID)
	require.NoError(ts.T(), err)

	// check if the corresponding identities were successfully created
	require.NotEmpty(ts.T(), u.Identities)

	for _, identity := range u.Identities {
		// for email & phone identities, the providerId is the same as the userId
		require.Equal(ts.T(), u.ID.String(), identity.ProviderID)
		require.Equal(ts.T(), u.ID, identity.UserID)
		if identity.Provider == "email" {
			require.Equal(ts.T(), newEmail, identity.IdentityData["email"])
		}
		if identity.Provider == "phone" {
			require.Equal(ts.T(), newPhone, identity.IdentityData["phone"])

		}
	}
}

// TestAdminUserUpdateClearsPendingTokensOnEmailChange verifies that
// reassigning a user's email via the admin update endpoint invalidates any
// outstanding recovery token, so a recovery link issued before the change
// (and still deliverable to the old mailbox) can no longer be redeemed.
func (ts *AdminTestSuite) TestAdminUserUpdateClearsPendingTokensOnEmailChange() {
	u, err := models.NewUser("", "pending-tokens@example.com", "test", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	// simulate an outstanding password-recovery token
	recoveryHash := crypto.GenerateTokenHash(u.GetEmail(), "123456")
	now := time.Now()
	u.RecoveryToken = recoveryHash
	u.RecoverySentAt = &now
	require.NoError(ts.T(), ts.API.db.UpdateOnly(u, "recovery_token", "recovery_sent_at"))
	require.NoError(ts.T(), models.CreateOneTimeToken(ts.API.db, u.ID, u.GetEmail(), recoveryHash, models.RecoveryToken, ts.Config.Mailer.OtpExpAsDuration(), true))

	// sanity check: the token is redeemable before the email change
	_, err = models.FindUserByOneTimeToken(ts.API.db, recoveryHash, models.RecoveryToken)
	require.NoError(ts.T(), err, "recovery token should be redeemable before the email change")

	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"email": "pending-tokens-new@example.com",
	}))

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/admin/users/%s", u.ID), &buffer)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))
	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	// the stored recovery token column must be cleared
	updated, err := models.FindUserByID(ts.API.db, u.ID)
	require.NoError(ts.T(), err)
	require.Empty(ts.T(), updated.RecoveryToken, "recovery token should be cleared after an admin email change")

	// and the one-time token row must no longer resolve to a user
	_, err = models.FindUserByOneTimeToken(ts.API.db, recoveryHash, models.RecoveryToken)
	require.Error(ts.T(), err, "recovery token should no longer be redeemable after an admin email change")
	require.True(ts.T(), models.IsNotFoundError(err), "expected NotFoundError")
}

// TestAdminUserCreatePasswordStrength verifies POST /admin/users enforces the
// configured password strength policy on a client-supplied plaintext
// password, matching the update endpoint, while leaving the password_hash
// path exempt.
func (ts *AdminTestSuite) TestAdminUserCreatePasswordStrength() {
	ts.Config.Password.MinLength = 6

	ts.Run("weak plaintext password is rejected", func() {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"email":    "weakpw@example.com",
			"password": "12345", // below MinLength of 6
		}))

		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPost, "/admin/users", &buffer)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))
		ts.API.handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusUnprocessableEntity, w.Code)

		// the user must not have been created
		_, err := models.FindUserByEmailAndAudience(ts.API.db, "weakpw@example.com", ts.Config.JWT.Aud)
		require.True(ts.T(), models.IsNotFoundError(err), "weak-password create should not have persisted a user")
	})

	ts.Run("strong plaintext password is accepted", func() {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"email":    "strongpw@example.com",
			"password": "a-sufficiently-long-password",
		}))

		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPost, "/admin/users", &buffer)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))
		ts.API.handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusOK, w.Code)
	})

	ts.Run("password_hash path is exempt from the strength policy", func() {
		var buffer bytes.Buffer
		// bcrypt hash of a short password: the plaintext strength policy
		// does not (and cannot) apply to a pre-hashed credential.
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"email":         "hashedpw@example.com",
			"password_hash": "$2y$10$Tk6yEdmTbb/eQ/haDMaCsuCsmtPVprjHMcij1RqiJdLGPDXnL3L1a",
		}))

		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPost, "/admin/users", &buffer)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))
		ts.API.handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusOK, w.Code)
	})
}

func (ts *AdminTestSuite) TestAdminUserUpdatePasswordFailed() {
	u, err := models.NewUser("12345678", "test1@example.com", "test", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	var updateEndpoint = fmt.Sprintf("/admin/users/%s", u.ID)
	ts.Config.Password.MinLength = 6
	ts.Run("Password doesn't meet minimum length", func() {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"password": "",
		}))

		// Setup request
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPut, updateEndpoint, &buffer)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

		ts.API.handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusUnprocessableEntity, w.Code)
	})
}

func (ts *AdminTestSuite) TestAdminUserUpdateBannedUntilFailed() {
	u, err := models.NewUser("", "test1@example.com", "test", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	var updateEndpoint = fmt.Sprintf("/admin/users/%s", u.ID)
	ts.Config.Password.MinLength = 6
	ts.Run("Incorrect format for ban_duration", func() {
		var buffer bytes.Buffer
		require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
			"ban_duration": "24",
		}))

		// Setup request
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodPut, updateEndpoint, &buffer)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

		ts.API.handler.ServeHTTP(w, req)
		require.Equal(ts.T(), http.StatusBadRequest, w.Code)
	})
}

// TestAdminUserDelete tests API /admin/users route (DELETE)
func (ts *AdminTestSuite) TestAdminUserDelete() {
	type expected struct {
		code int
		err  error
	}
	signupParams := &SignupParams{
		Email:    "test-delete@example.com",
		Password: "test",
		Data:     map[string]interface{}{"name": "test"},
		Provider: "email",
		Aud:      ts.Config.JWT.Aud,
	}
	cases := []struct {
		desc         string
		body         map[string]interface{}
		isSoftDelete string
		isSSOUser    bool
		expected     expected
	}{
		{
			desc:         "Test admin delete user (default)",
			isSoftDelete: "",
			isSSOUser:    false,
			expected:     expected{code: http.StatusOK, err: models.UserNotFoundError{}},
			body:         nil,
		},
		{
			desc:         "Test admin delete user (hard deletion)",
			isSoftDelete: "?is_soft_delete=false",
			isSSOUser:    false,
			expected:     expected{code: http.StatusOK, err: models.UserNotFoundError{}},
			body: map[string]interface{}{
				"should_soft_delete": false,
			},
		},
		{
			desc:         "Test admin delete user (soft deletion)",
			isSoftDelete: "?is_soft_delete=true",
			isSSOUser:    false,
			expected:     expected{code: http.StatusOK, err: models.UserNotFoundError{}},
			body: map[string]interface{}{
				"should_soft_delete": true,
			},
		},
		{
			desc:         "Test admin delete user (soft deletion & sso user)",
			isSoftDelete: "?is_soft_delete=true",
			isSSOUser:    true,
			expected:     expected{code: http.StatusOK, err: nil},
			body: map[string]interface{}{
				"should_soft_delete": true,
			},
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(c.body))
			u, err := signupParams.ToUserModel(false /* <- isSSOUser */)
			require.NoError(ts.T(), err)
			u, err = ts.API.signupNewUser(ts.API.db, u)
			require.NoError(ts.T(), err)

			// Setup request
			w := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/admin/users/%s", u.ID), &buffer)

			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), c.expected.code, w.Code)

			if c.isSSOUser {
				u, err = models.FindUserByID(ts.API.db, u.ID)
				require.NotNil(ts.T(), u)
			} else {
				_, err = models.FindUserByEmailAndAudience(ts.API.db, signupParams.Email, ts.Config.JWT.Aud)
			}
			require.Equal(ts.T(), c.expected.err, err)
		})
	}
}

func (ts *AdminTestSuite) TestAdminUserSoftDeletion() {
	// create user
	u, err := models.NewUser("123456789", "test@example.com", "secret", ts.Config.JWT.Aud, map[string]interface{}{"name": "test"})
	require.NoError(ts.T(), err)
	u.ConfirmationToken = "some_token"
	u.RecoveryToken = "some_token"
	u.EmailChangeTokenCurrent = "some_token"
	u.EmailChangeTokenNew = "some_token"
	u.PhoneChangeToken = "some_token"
	u.AppMetaData = map[string]interface{}{
		"provider": "email",
	}
	require.NoError(ts.T(), ts.API.db.Create(u))
	require.NoError(ts.T(), models.CreateOneTimeToken(ts.API.db, u.ID, u.GetEmail(), u.ConfirmationToken, models.ConfirmationToken, ts.Config.Mailer.OtpExpAsDuration(), true))
	require.NoError(ts.T(), models.CreateOneTimeToken(ts.API.db, u.ID, u.GetEmail(), u.RecoveryToken, models.RecoveryToken, ts.Config.Mailer.OtpExpAsDuration(), true))
	require.NoError(ts.T(), models.CreateOneTimeToken(ts.API.db, u.ID, u.GetEmail(), u.EmailChangeTokenCurrent, models.EmailChangeTokenCurrent, ts.Config.Mailer.OtpExpAsDuration(), true))
	require.NoError(ts.T(), models.CreateOneTimeToken(ts.API.db, u.ID, u.GetEmail(), u.EmailChangeTokenNew, models.EmailChangeTokenNew, ts.Config.Mailer.OtpExpAsDuration(), true))
	require.NoError(ts.T(), models.CreateOneTimeToken(ts.API.db, u.ID, u.GetPhone(), u.PhoneChangeToken, models.PhoneChangeToken, ts.Config.Sms.OtpExpAsDuration(), true))

	// create user identities
	_, err = ts.API.createNewIdentity(ts.API.db, u, "email", map[string]interface{}{
		"sub":   "123456",
		"email": "test@example.com",
	})
	require.NoError(ts.T(), err)
	_, err = ts.API.createNewIdentity(ts.API.db, u, "github", map[string]interface{}{
		"sub":   "234567",
		"email": "test@example.com",
	})
	require.NoError(ts.T(), err)

	// register a WebAuthn credential for the user
	passkey := &models.WebAuthnCredential{
		ID:           uuid.Must(uuid.NewV4()),
		UserID:       u.ID,
		CredentialID: []byte("test-credential-id"),
		PublicKey:    []byte("test-public-key"),
		FriendlyName: "test passkey",
	}
	require.NoError(ts.T(), ts.API.db.Create(passkey))

	var buffer bytes.Buffer
	require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(map[string]interface{}{
		"should_soft_delete": true,
	}))
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/admin/users/%s", u.ID), &buffer)

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	// get soft-deleted user from db
	deletedUser, err := models.FindUserByID(ts.API.db, u.ID)
	require.NoError(ts.T(), err)

	require.Empty(ts.T(), deletedUser.ConfirmationToken)
	require.Empty(ts.T(), deletedUser.RecoveryToken)
	require.Empty(ts.T(), deletedUser.EmailChangeTokenCurrent)
	require.Empty(ts.T(), deletedUser.EmailChangeTokenNew)
	require.Empty(ts.T(), deletedUser.EncryptedPassword)
	require.Empty(ts.T(), deletedUser.PhoneChangeToken)
	require.Empty(ts.T(), deletedUser.UserMetaData)
	require.Empty(ts.T(), deletedUser.AppMetaData)
	require.NotEmpty(ts.T(), deletedUser.DeletedAt)
	require.NotEmpty(ts.T(), deletedUser.GetEmail())

	// get soft-deleted user's identity from db
	deletedIdentities, err := models.FindIdentitiesByUserID(ts.API.db, deletedUser.ID)
	require.NoError(ts.T(), err)

	for _, identity := range deletedIdentities {
		require.Empty(ts.T(), identity.IdentityData)
	}

	// passkeys (WebAuthn credentials) should be hard-deleted
	deletedPasskeys, err := models.FindWebAuthnCredentialsByUserID(ts.API.db, deletedUser.ID)
	require.NoError(ts.T(), err)
	require.Empty(ts.T(), deletedPasskeys)
}

func (ts *AdminTestSuite) TestAdminUserCreateWithDisabledLogin() {
	var cases = []struct {
		desc         string
		customConfig *conf.GlobalConfiguration
		userData     map[string]interface{}
		expected     int
	}{
		{
			desc: "Email Signups Disabled",
			customConfig: &conf.GlobalConfiguration{
				JWT: ts.Config.JWT,
				External: conf.ProviderConfiguration{
					Email: conf.EmailProviderConfiguration{
						Enabled: false,
					},
				},
			},
			userData: map[string]interface{}{
				"email":    "test1@example.com",
				"password": "test123",
			},
			expected: http.StatusOK,
		},
		{
			desc: "Phone Signups Disabled",
			customConfig: &conf.GlobalConfiguration{
				JWT: ts.Config.JWT,
				External: conf.ProviderConfiguration{
					Phone: conf.PhoneProviderConfiguration{
						Enabled: false,
					},
				},
			},
			userData: map[string]interface{}{
				"phone":    "123456789",
				"password": "test123",
			},
			expected: http.StatusOK,
		},
		{
			desc: "All Signups Disabled",
			customConfig: &conf.GlobalConfiguration{
				JWT:           ts.Config.JWT,
				DisableSignup: true,
			},
			userData: map[string]interface{}{
				"email":    "test2@example.com",
				"password": "test123",
			},
			expected: http.StatusOK,
		},
	}

	for _, c := range cases {
		ts.Run(c.desc, func() {
			// Initialize user data
			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(c.userData))

			// Setup request
			w := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, "/admin/users", &buffer)
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

			ts.Config.JWT = c.customConfig.JWT
			ts.Config.External = c.customConfig.External
			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), c.expected, w.Code)
		})
	}
}

// TestAdminUserDeleteFactor tests API /admin/users/<user_id>/factors/<factor_id>/
func (ts *AdminTestSuite) TestAdminUserDeleteFactor() {
	u, err := models.NewUser("123456789", "test-delete@example.com", "test", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	f := models.NewTOTPFactor(u, "testSimpleName")
	require.NoError(ts.T(), f.UpdateStatus(ts.API.db, models.FactorStateVerified))
	require.NoError(ts.T(), f.SetSecret("secretkey", ts.Config.Security.DBEncryption.Encrypt, ts.Config.Security.DBEncryption.EncryptionKeyID, ts.Config.Security.DBEncryption.EncryptionKey))
	require.NoError(ts.T(), ts.API.db.Create(f), "Error saving new test factor")

	// An AAL2 session backed by the factor should be downgraded to AAL1 when the
	// factor is deleted by an admin (mirrors the self-service unenroll behaviour).
	s, err := models.NewSession(u.ID, &f.ID)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(s))
	require.NoError(ts.T(), models.AddClaimToSession(ts.API.db, s.ID, models.TOTPSignIn))
	require.NoError(ts.T(), s.UpdateAALAndAssociatedFactor(ts.API.db, models.AAL2, &f.ID))

	// Setup request
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/admin/users/%s/factors/%s/", u.ID, f.ID), nil)

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)

	_, err = models.FindFactorByFactorID(ts.API.db, f.ID)
	require.EqualError(ts.T(), err, models.FactorNotFoundError{}.Error())

	// The factor's session must be downgraded and its AMR claim stripped.
	downgraded, err := models.FindSessionByID(ts.API.db, s.ID, false)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), models.AAL1.String(), downgraded.GetAAL())
	require.Nil(ts.T(), downgraded.FactorID)
	aal, _, err := downgraded.CalculateAALAndAMR(u)
	require.NoError(ts.T(), err)
	require.Equal(ts.T(), models.AAL1, aal)
}

// TestAdminUserGetFactor tests API /admin/user/<user_id>/factors/
func (ts *AdminTestSuite) TestAdminUserGetFactors() {
	u, err := models.NewUser("123456789", "test-delete@example.com", "test", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	f := models.NewTOTPFactor(u, "testSimpleName")
	require.NoError(ts.T(), f.SetSecret("secretkey", ts.Config.Security.DBEncryption.Encrypt, ts.Config.Security.DBEncryption.EncryptionKeyID, ts.Config.Security.DBEncryption.EncryptionKey))
	require.NoError(ts.T(), ts.API.db.Create(f), "Error saving new test factor")

	// Setup request
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/admin/users/%s/factors/", u.ID), nil)

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))

	ts.API.handler.ServeHTTP(w, req)
	require.Equal(ts.T(), http.StatusOK, w.Code)
	getFactorsResp := []*models.Factor{}
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&getFactorsResp))
	require.Equal(ts.T(), getFactorsResp[0].Secret, "")
}

func (ts *AdminTestSuite) TestAdminUserUpdateFactor() {
	u, err := models.NewUser("123456789", "test-delete@example.com", "test", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err, "Error making new user")
	require.NoError(ts.T(), ts.API.db.Create(u), "Error creating user")

	f := models.NewPhoneFactor(u, "123456789", "testSimpleName")
	require.NoError(ts.T(), f.SetSecret("secretkey", ts.Config.Security.DBEncryption.Encrypt, ts.Config.Security.DBEncryption.EncryptionKeyID, ts.Config.Security.DBEncryption.EncryptionKey))
	require.NoError(ts.T(), ts.API.db.Create(f), "Error saving new test factor")

	var cases = []struct {
		Desc         string
		FactorData   map[string]interface{}
		ExpectedCode int
	}{
		{
			Desc: "Update Factor friendly name",
			FactorData: map[string]interface{}{
				"friendly_name": "john",
			},
			ExpectedCode: http.StatusOK,
		},
		{
			Desc: "Update Factor phone number",
			FactorData: map[string]interface{}{
				"phone": "+1976154321",
			},
			ExpectedCode: http.StatusOK,
		},
	}

	// Initialize factor data
	for _, c := range cases {
		ts.Run(c.Desc, func() {
			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(c.FactorData))
			w := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/admin/users/%s/factors/%s/", u.ID, f.ID), &buffer)
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))
			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), c.ExpectedCode, w.Code)
		})
	}
}

func (ts *AdminTestSuite) TestAdminUserCreateValidationErrors() {
	cases := []struct {
		desc   string
		params map[string]interface{}
	}{
		{
			desc: "create user without email and phone",
			params: map[string]interface{}{
				"password": "test_password",
			},
		},
		{
			desc: "create user with password and password hash",
			params: map[string]interface{}{
				"email":         "test@example.com",
				"password":      "test_password",
				"password_hash": "$2y$10$Tk6yEdmTbb/eQ/haDMaCsuCsmtPVprjHMcij1RqiJdLGPDXnL3L1a",
			},
		},
		{
			desc: "invalid ban duration",
			params: map[string]interface{}{
				"email":        "test@example.com",
				"ban_duration": "never",
			},
		},
		{
			desc: "custom id is nil",
			params: map[string]interface{}{
				"id":    "00000000-0000-0000-0000-000000000000",
				"email": "test@example.com",
			},
		},
		{
			desc: "bad id format",
			params: map[string]interface{}{
				"id":    "bad_uuid_format",
				"email": "test@example.com",
			},
		},
	}
	for _, c := range cases {
		ts.Run(c.desc, func() {
			var buffer bytes.Buffer
			require.NoError(ts.T(), json.NewEncoder(&buffer).Encode(c.params))
			req := httptest.NewRequest(http.MethodPost, "/admin/users", &buffer)
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ts.token))
			w := httptest.NewRecorder()
			ts.API.handler.ServeHTTP(w, req)
			require.Equal(ts.T(), http.StatusBadRequest, w.Code, w)

			data := map[string]interface{}{}
			require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&data))
			require.Equal(ts.T(), data["error_code"], apierrors.ErrorCodeValidationFailed)
		})

	}
}
