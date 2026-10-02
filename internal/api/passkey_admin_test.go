package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gofrs/uuid"
	jwt "github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/models"
)

// generateAdminToken creates a JWT with the supabase_admin role for admin endpoint tests.
func (ts *PasskeyTestSuite) generateAdminToken() string {
	claims := &AccessTokenClaims{
		Role: "supabase_admin",
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(ts.Config.JWT.Secret))
	require.NoError(ts.T(), err)
	return token
}

func (ts *PasskeyTestSuite) TestAdminPasskeyListEmpty() {
	adminToken := ts.generateAdminToken()
	w := ts.makeRequest(http.MethodGet, fmt.Sprintf("http://localhost/admin/users/%s/passkeys", ts.TestUser.ID), nil, withBearerToken(adminToken))

	ts.Equal(http.StatusOK, w.Code)

	var items []PasskeyListItem
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&items))
	ts.Empty(items)
}

func (ts *PasskeyTestSuite) TestAdminPasskeyListWithPasskeys() {
	pk1 := ts.createTestPasskey(ts.TestUser.ID, "Admin View Key 1")
	pk2 := ts.createTestPasskey(ts.TestUser.ID, "Admin View Key 2")

	adminToken := ts.generateAdminToken()
	w := ts.makeRequest(http.MethodGet, fmt.Sprintf("http://localhost/admin/users/%s/passkeys", ts.TestUser.ID), nil, withBearerToken(adminToken))

	ts.Equal(http.StatusOK, w.Code)

	var items []PasskeyListItem
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&items))
	ts.Require().Len(items, 2)

	ts.Equal(pk1.ID.String(), items[0].ID)
	ts.Equal("Admin View Key 1", items[0].FriendlyName)

	ts.Equal(pk2.ID.String(), items[1].ID)
	ts.Equal("Admin View Key 2", items[1].FriendlyName)
}

func (ts *PasskeyTestSuite) TestAdminPasskeyListUserNotFound() {
	adminToken := ts.generateAdminToken()
	fakeUserID := uuid.Must(uuid.NewV4())
	w := ts.makeRequest(http.MethodGet, fmt.Sprintf("http://localhost/admin/users/%s/passkeys", fakeUserID), nil, withBearerToken(adminToken))

	ts.Equal(http.StatusNotFound, w.Code)
}

func (ts *PasskeyTestSuite) TestAdminPasskeyDelete() {
	cred := ts.createTestPasskey(ts.TestUser.ID, "To Delete By Admin")

	adminToken := ts.generateAdminToken()
	w := ts.makeRequest(http.MethodDelete, fmt.Sprintf("http://localhost/admin/users/%s/passkeys/%s", ts.TestUser.ID, cred.ID), nil, withBearerToken(adminToken))

	ts.Equal(http.StatusNoContent, w.Code)
	ts.Empty(w.Body.Bytes())

	// Verify deleted from database
	_, err := models.FindWebAuthnCredentialByID(ts.API.db, cred.ID)
	ts.True(models.IsNotFoundError(err))
}

func (ts *PasskeyTestSuite) TestAdminPasskeyDeleteNotFound() {
	adminToken := ts.generateAdminToken()
	fakePasskeyID := uuid.Must(uuid.NewV4())
	w := ts.makeRequest(http.MethodDelete, fmt.Sprintf("http://localhost/admin/users/%s/passkeys/%s", ts.TestUser.ID, fakePasskeyID), nil, withBearerToken(adminToken))

	ts.Equal(http.StatusNotFound, w.Code)
}

func (ts *PasskeyTestSuite) TestAdminPasskeyDeleteWrongUser() {
	// Create another user with a passkey
	otherUser, err := models.NewUser("", "otheradmin@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(otherUser))
	otherCred := ts.createTestPasskey(otherUser.ID, "Other User Key")

	// Try to delete otherUser's passkey via TestUser's admin route
	adminToken := ts.generateAdminToken()
	w := ts.makeRequest(http.MethodDelete, fmt.Sprintf("http://localhost/admin/users/%s/passkeys/%s", ts.TestUser.ID, otherCred.ID), nil, withBearerToken(adminToken))

	ts.Equal(http.StatusNotFound, w.Code)

	// Verify the passkey still exists
	_, err = models.FindWebAuthnCredentialByID(ts.API.db, otherCred.ID)
	ts.NoError(err)
}

func (ts *PasskeyTestSuite) TestAdminPasskeyListNonAdminForbidden() {
	// Use a regular user token instead of admin token
	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodGet, fmt.Sprintf("http://localhost/admin/users/%s/passkeys", ts.TestUser.ID), nil, withBearerToken(token))

	ts.Equal(http.StatusForbidden, w.Code)
}

func (ts *PasskeyTestSuite) TestAdminPasskeyDeleteNonAdminForbidden() {
	cred := ts.createTestPasskey(ts.TestUser.ID, "Protected Key")

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodDelete, fmt.Sprintf("http://localhost/admin/users/%s/passkeys/%s", ts.TestUser.ID, cred.ID), nil, withBearerToken(token))

	ts.Equal(http.StatusForbidden, w.Code)

	// Verify the passkey still exists
	_, err := models.FindWebAuthnCredentialByID(ts.API.db, cred.ID)
	ts.NoError(err)
}

func (ts *PasskeyTestSuite) TestAdminPasskeyListUnauthenticated() {
	w := ts.makeRequest(http.MethodGet, fmt.Sprintf("http://localhost/admin/users/%s/passkeys", ts.TestUser.ID), nil)
	ts.Equal(http.StatusUnauthorized, w.Code)
}

func (ts *PasskeyTestSuite) TestAdminPasskeyDeleteUnauthenticated() {
	cred := ts.createTestPasskey(ts.TestUser.ID, "Key")
	w := ts.makeRequest(http.MethodDelete, fmt.Sprintf("http://localhost/admin/users/%s/passkeys/%s", ts.TestUser.ID, cred.ID), nil)
	ts.Equal(http.StatusUnauthorized, w.Code)
}
