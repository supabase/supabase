package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/models"
)

// createTestPasskey creates a WebAuthnCredential for the given user in the database.
func (ts *PasskeyTestSuite) createTestPasskey(userID uuid.UUID, friendlyName string) *models.WebAuthnCredential {
	cred := &models.WebAuthnCredential{
		ID:              uuid.Must(uuid.NewV4()),
		UserID:          userID,
		CredentialID:    fmt.Appendf(nil, "cred-%s", uuid.Must(uuid.NewV4()).String()[:8]),
		PublicKey:       []byte("test-public-key"),
		AttestationType: "none",
		FriendlyName:    friendlyName,
		BackupEligible:  true,
		BackedUp:        false,
	}

	require.NoError(ts.T(), ts.API.db.Create(cred))

	return cred
}

func (ts *PasskeyTestSuite) TestPasskeyListEmpty() {
	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodGet, "http://localhost/passkeys", nil, withBearerToken(token))

	ts.Equal(http.StatusOK, w.Code)

	var items []PasskeyListItem
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&items))
	ts.Empty(items)
}

func (ts *PasskeyTestSuite) TestPasskeyListWithPasskeys() {
	pk1 := ts.createTestPasskey(ts.TestUser.ID, "My iPhone")
	pk2 := ts.createTestPasskey(ts.TestUser.ID, "My MacBook")

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodGet, "http://localhost/passkeys", nil, withBearerToken(token))

	ts.Equal(http.StatusOK, w.Code)

	var items []PasskeyListItem
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&items))
	ts.Require().Len(items, 2)

	// Results are ordered by created_at asc
	ts.Equal(pk1.ID.String(), items[0].ID)
	ts.Equal("My iPhone", items[0].FriendlyName)
	ts.Nil(items[0].LastUsedAt)

	ts.Equal(pk2.ID.String(), items[1].ID)
	ts.Equal("My MacBook", items[1].FriendlyName)
	ts.Nil(items[1].LastUsedAt)
}

func (ts *PasskeyTestSuite) TestPasskeyListDoesNotReturnOtherUsersPasskeys() {
	// Create a passkey for the test user
	ts.createTestPasskey(ts.TestUser.ID, "My Passkey")

	// Create another user with a passkey
	otherUser, err := models.NewUser("", "other@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(otherUser))
	ts.createTestPasskey(otherUser.ID, "Other User Passkey")

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodGet, "http://localhost/passkeys", nil, withBearerToken(token))

	ts.Equal(http.StatusOK, w.Code)

	var items []PasskeyListItem
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&items))
	ts.Len(items, 1)
	ts.Equal("My Passkey", items[0].FriendlyName)
}

func (ts *PasskeyTestSuite) TestPasskeyListUnauthenticated() {
	w := ts.makeRequest(http.MethodGet, "http://localhost/passkeys", nil)
	ts.Equal(http.StatusUnauthorized, w.Code)
}

func (ts *PasskeyTestSuite) TestPasskeyUpdateFriendlyName() {
	cred := ts.createTestPasskey(ts.TestUser.ID, "Old Name")

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPatch, fmt.Sprintf("http://localhost/passkeys/%s", cred.ID), map[string]any{
		"friendly_name": "New Name",
	}, withBearerToken(token))

	ts.Equal(http.StatusOK, w.Code)

	var item PasskeyListItem
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&item))
	ts.Equal("New Name", item.FriendlyName)
	ts.Equal(cred.ID.String(), item.ID)

	updated, err := models.FindWebAuthnCredentialByID(ts.API.db, cred.ID)
	require.NoError(ts.T(), err)
	ts.Equal("New Name", updated.FriendlyName)
}

func (ts *PasskeyTestSuite) TestPasskeyUpdateMissingFriendlyName() {
	cred := ts.createTestPasskey(ts.TestUser.ID, "Name")

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPatch, fmt.Sprintf("http://localhost/passkeys/%s", cred.ID), map[string]any{}, withBearerToken(token))

	ts.Equal(http.StatusBadRequest, w.Code)
}

func (ts *PasskeyTestSuite) TestPasskeyUpdateFriendlyNameTooLong() {
	cred := ts.createTestPasskey(ts.TestUser.ID, "Name")

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPatch, fmt.Sprintf("http://localhost/passkeys/%s", cred.ID), map[string]any{
		"friendly_name": strings.Repeat("a", 121),
	}, withBearerToken(token))

	ts.Equal(http.StatusBadRequest, w.Code)

	// Verify the passkey was not modified
	unchanged, err := models.FindWebAuthnCredentialByID(ts.API.db, cred.ID)
	require.NoError(ts.T(), err)
	ts.Equal("Name", unchanged.FriendlyName)
}

func (ts *PasskeyTestSuite) TestPasskeyUpdateFriendlyNameAtMaxLength() {
	cred := ts.createTestPasskey(ts.TestUser.ID, "Name")

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	longName := strings.Repeat("a", 120)
	w := ts.makeRequest(http.MethodPatch, fmt.Sprintf("http://localhost/passkeys/%s", cred.ID), map[string]any{
		"friendly_name": longName,
	}, withBearerToken(token))

	ts.Equal(http.StatusOK, w.Code)

	var item PasskeyListItem
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&item))
	ts.Equal(longName, item.FriendlyName)
}

func (ts *PasskeyTestSuite) TestPasskeyUpdateFriendlyNameAtMaxLengthMultibyte() {
	cred := ts.createTestPasskey(ts.TestUser.ID, "Name")

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	// 120 multi-byte characters
	longName := strings.Repeat("笑", 120)
	w := ts.makeRequest(http.MethodPatch, fmt.Sprintf("http://localhost/passkeys/%s", cred.ID), map[string]any{
		"friendly_name": longName,
	}, withBearerToken(token))

	ts.Equal(http.StatusOK, w.Code)

	var item PasskeyListItem
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&item))
	ts.Equal(longName, item.FriendlyName)
}

func (ts *PasskeyTestSuite) TestPasskeyUpdateOtherUsersPasskey() {
	otherUser, err := models.NewUser("", "other@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(otherUser))
	otherCred := ts.createTestPasskey(otherUser.ID, "Other Passkey")

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPatch, fmt.Sprintf("http://localhost/passkeys/%s", otherCred.ID), map[string]any{
		"friendly_name": "Stolen Passkey",
	}, withBearerToken(token))

	ts.Equal(http.StatusNotFound, w.Code)

	// Verify the passkey was not modified
	unchanged, err := models.FindWebAuthnCredentialByID(ts.API.db, otherCred.ID)
	require.NoError(ts.T(), err)
	ts.Equal("Other Passkey", unchanged.FriendlyName)
}

func (ts *PasskeyTestSuite) TestPasskeyUpdateNonExistent() {
	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPatch, fmt.Sprintf("http://localhost/passkeys/%s", uuid.Must(uuid.NewV4())), map[string]any{
		"friendly_name": "New Name",
	}, withBearerToken(token))

	ts.Equal(http.StatusNotFound, w.Code)
}

func (ts *PasskeyTestSuite) TestPasskeyUpdateInvalidID() {
	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodPatch, "http://localhost/passkeys/not-a-uuid", map[string]any{
		"friendly_name": "New Name",
	}, withBearerToken(token))

	ts.Equal(http.StatusNotFound, w.Code)
}

func (ts *PasskeyTestSuite) TestPasskeyUpdateUnauthenticated() {
	cred := ts.createTestPasskey(ts.TestUser.ID, "Name")
	w := ts.makeRequest(http.MethodPatch, fmt.Sprintf("http://localhost/passkeys/%s", cred.ID), map[string]any{
		"friendly_name": "New Name",
	})
	ts.Equal(http.StatusUnauthorized, w.Code)
}

func (ts *PasskeyTestSuite) TestPasskeyDelete() {
	cred := ts.createTestPasskey(ts.TestUser.ID, "To Delete")

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodDelete, fmt.Sprintf("http://localhost/passkeys/%s", cred.ID), nil, withBearerToken(token))

	ts.Equal(http.StatusNoContent, w.Code)
	ts.Empty(w.Body.Bytes())

	// Verify deleted from database
	_, err := models.FindWebAuthnCredentialByID(ts.API.db, cred.ID)
	ts.True(models.IsNotFoundError(err))
}

func (ts *PasskeyTestSuite) TestPasskeyDeleteOtherUsersPasskey() {
	otherUser, err := models.NewUser("", "other@example.com", "password", ts.Config.JWT.Aud, nil)
	require.NoError(ts.T(), err)
	require.NoError(ts.T(), ts.API.db.Create(otherUser))
	otherCred := ts.createTestPasskey(otherUser.ID, "Other Passkey")

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodDelete, fmt.Sprintf("http://localhost/passkeys/%s", otherCred.ID), nil, withBearerToken(token))

	ts.Equal(http.StatusNotFound, w.Code)

	// Verify the passkey still exists
	_, err = models.FindWebAuthnCredentialByID(ts.API.db, otherCred.ID)
	ts.NoError(err)
}

func (ts *PasskeyTestSuite) TestPasskeyDeleteNonExistent() {
	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodDelete, fmt.Sprintf("http://localhost/passkeys/%s", uuid.Must(uuid.NewV4())), nil, withBearerToken(token))

	ts.Equal(http.StatusNotFound, w.Code)
}

func (ts *PasskeyTestSuite) TestPasskeyDeleteUnauthenticated() {
	cred := ts.createTestPasskey(ts.TestUser.ID, "Name")
	w := ts.makeRequest(http.MethodDelete, fmt.Sprintf("http://localhost/passkeys/%s", cred.ID), nil)
	ts.Equal(http.StatusUnauthorized, w.Code)
}

// TestPasskeyDeleteBlockedAtAAL1WhenMFAEnabled verifies that a user enrolled in a
// verified MFA factor cannot delete a passkey from an AAL1 session.
func (ts *PasskeyTestSuite) TestPasskeyDeleteBlockedAtAAL1WhenMFAEnabled() {
	ts.enrollVerifiedFactor(ts.TestUser)
	cred := ts.createTestPasskey(ts.TestUser.ID, "Protected")

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodDelete, fmt.Sprintf("http://localhost/passkeys/%s", cred.ID), nil, withBearerToken(token))

	ts.Equal(http.StatusForbidden, w.Code)
	var errResp map[string]any
	require.NoError(ts.T(), json.NewDecoder(w.Body).Decode(&errResp))
	ts.Equal("insufficient_aal", errResp["error_code"])

	// The passkey must still exist.
	_, err := models.FindWebAuthnCredentialByID(ts.API.db, cred.ID)
	require.NoError(ts.T(), err)
}

// TestPasskeyDeleteAllowedAtAAL2WhenMFAEnabled verifies that a user with a verified
// MFA factor who has stepped up to AAL2 can delete a passkey.
func (ts *PasskeyTestSuite) TestPasskeyDeleteAllowedAtAAL2WhenMFAEnabled() {
	f := ts.enrollVerifiedFactor(ts.TestUser)
	ts.elevateSessionToAAL2(ts.TestSession, f.ID)
	cred := ts.createTestPasskey(ts.TestUser.ID, "To Delete")

	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)
	w := ts.makeRequest(http.MethodDelete, fmt.Sprintf("http://localhost/passkeys/%s", cred.ID), nil, withBearerToken(token))

	ts.Equal(http.StatusNoContent, w.Code)

	_, err := models.FindWebAuthnCredentialByID(ts.API.db, cred.ID)
	ts.True(models.IsNotFoundError(err))
}

func (ts *PasskeyTestSuite) TestPasskeyManageDisabled() {
	ts.Config.Passkey.Enabled = false
	token := ts.generateToken(ts.TestUser, &ts.TestSession.ID)

	// List
	w := ts.makeRequest(http.MethodGet, "http://localhost/passkeys/", nil, withBearerToken(token))
	ts.Equal(http.StatusNotFound, w.Code)

	// Update
	w = ts.makeRequest(http.MethodPatch, fmt.Sprintf("http://localhost/passkeys/%s", uuid.Must(uuid.NewV4())), map[string]any{
		"friendly_name": "Name",
	}, withBearerToken(token))
	ts.Equal(http.StatusNotFound, w.Code)

	// Delete
	w = ts.makeRequest(http.MethodDelete, fmt.Sprintf("http://localhost/passkeys/%s", uuid.Must(uuid.NewV4())), nil, withBearerToken(token))
	ts.Equal(http.StatusNotFound, w.Code)
}
