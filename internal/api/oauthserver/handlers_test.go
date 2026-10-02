package oauthserver

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"github.com/supabase/auth/internal/api/shared"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/conf/confload"
	"github.com/supabase/auth/internal/hooks/v0hooks"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/storage/test"
	"github.com/supabase/auth/internal/tokens"
)

const oauthServerTestConfig = "../../../hack/test.env"

type OAuthClientTestSuite struct {
	suite.Suite
	Server *Server
	Config *conf.GlobalConfiguration
	DB     *storage.Connection
}

func TestOAuthClientHandler(t *testing.T) {
	globalConfig, err := confload.LoadGlobal(oauthServerTestConfig)
	require.NoError(t, err)

	conn, err := test.SetupDBConnection(globalConfig)
	require.NoError(t, err)

	// Enable OAuth server and dynamic client registration for tests
	globalConfig.OAuthServer.Enabled = true
	globalConfig.OAuthServer.AllowDynamicRegistration = true

	// Create a mock hooks manager for token service
	hooksMgr := &v0hooks.Manager{} // minimal mock for testing
	tokenService := tokens.NewService(globalConfig, hooksMgr)

	server := NewServer(globalConfig, conn, tokenService)

	ts := &OAuthClientTestSuite{
		Server: server,
		Config: globalConfig,
		DB:     conn,
	}
	defer ts.DB.Close()

	suite.Run(t, ts)
}

func (ts *OAuthClientTestSuite) SetupTest() {
	if ts.DB != nil {
		models.TruncateAll(ts.DB)
	}
	// Enable OAuth dynamic client registration for tests
	ts.Config.OAuthServer.AllowDynamicRegistration = true
}

// Helper function to create test OAuth client
func (ts *OAuthClientTestSuite) createTestOAuthClient() (*models.OAuthServerClient, string) {
	params := &OAuthServerClientRegisterParams{
		ClientName:       "Test Client",
		RedirectURIs:     []string{"https://example.com/callback", "http://localhost:3000/callback"},
		RegistrationType: "dynamic",
	}

	ctx := context.Background()
	client, secret, err := ts.Server.registerOAuthServerClient(ctx, params)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), client)
	require.NotEmpty(ts.T(), secret)

	return client, secret
}

// HTTP Handler Tests
func (ts *OAuthClientTestSuite) TestAdminOAuthServerClientRegisterHandler() {
	// Create request payload
	payload := OAuthServerClientRegisterParams{
		ClientName:   "Test Admin Client",
		RedirectURIs: []string{"https://example.com/callback"},
	}

	body, err := json.Marshal(payload)
	require.NoError(ts.T(), err)

	// Create HTTP request
	req := httptest.NewRequest(http.MethodPost, "/admin/oauth/clients", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	// Create response recorder
	w := httptest.NewRecorder()

	// Call handler
	err = ts.Server.AdminOAuthServerClientRegister(w, req)
	require.NoError(ts.T(), err)

	// Check response
	assert.Equal(ts.T(), http.StatusCreated, w.Code)

	var response OAuthServerClientResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(ts.T(), err)

	assert.NotEmpty(ts.T(), response.ClientID)
	assert.NotEmpty(ts.T(), response.ClientSecret) // Should be included in registration response
	assert.Equal(ts.T(), "Test Admin Client", response.ClientName)
	assert.Equal(ts.T(), []string{"https://example.com/callback"}, response.RedirectURIs)
	assert.Equal(ts.T(), "manual", response.RegistrationType) // Admin registration is manual
}

func (ts *OAuthClientTestSuite) TestOAuthServerClientDynamicRegisterHandler() {
	payload := OAuthServerClientRegisterParams{
		ClientName:   "Test Dynamic Client",
		RedirectURIs: []string{"https://app.example.com/callback"},
		ClientURI:    "https://app.example.com",
	}

	body, err := json.Marshal(payload)
	require.NoError(ts.T(), err)

	req := httptest.NewRequest(http.MethodPost, "/oauth/clients/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()

	err = ts.Server.OAuthServerClientDynamicRegister(w, req)
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), http.StatusCreated, w.Code)

	var response OAuthServerClientResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(ts.T(), err)

	assert.NotEmpty(ts.T(), response.ClientID)
	assert.NotEmpty(ts.T(), response.ClientSecret) // Should be included in registration response
	assert.Equal(ts.T(), "Test Dynamic Client", response.ClientName)
	assert.Equal(ts.T(), "https://app.example.com", response.ClientURI)
	assert.Equal(ts.T(), "dynamic", response.RegistrationType) // Dynamic registration
}

func (ts *OAuthClientTestSuite) TestOAuthServerClientDynamicRegisterDisabled() {
	// Disable dynamic registration
	ts.Config.OAuthServer.AllowDynamicRegistration = false

	payload := OAuthServerClientRegisterParams{
		ClientName:   "Test Client",
		RedirectURIs: []string{"https://example.com/callback"},
	}

	body, err := json.Marshal(payload)
	require.NoError(ts.T(), err)

	req := httptest.NewRequest(http.MethodPost, "/oauth/clients/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()

	// Call handler - should return error
	err = ts.Server.OAuthServerClientDynamicRegister(w, req)
	require.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "Dynamic client registration is not enabled")
}

func (ts *OAuthClientTestSuite) TestOAuthServerClientGetHandler() {
	client, _ := ts.createTestOAuthClient()

	req := httptest.NewRequest(http.MethodGet, "/admin/oauth/clients/"+client.ID.String(), nil)

	ctx := shared.WithOAuthServerClient(req.Context(), client)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	err := ts.Server.OAuthServerClientGet(w, req)
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var response OAuthServerClientResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), client.ID.String(), response.ClientID)
	assert.Empty(ts.T(), response.ClientSecret) // Should NOT be included in get response
	assert.Equal(ts.T(), "Test Client", response.ClientName)
}

func (ts *OAuthClientTestSuite) TestOAuthServerClientDeleteHandler() {
	// Create a test client first
	client, _ := ts.createTestOAuthClient()

	// Create HTTP request with client in context
	req := httptest.NewRequest(http.MethodDelete, "/admin/oauth/clients/"+client.ID.String(), nil)

	// Add client to context (normally done by LoadOAuthServerClient middleware)
	ctx := shared.WithOAuthServerClient(req.Context(), client)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	err := ts.Server.OAuthServerClientDelete(w, req)
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), http.StatusNoContent, w.Code)
	assert.Empty(ts.T(), w.Body.String())

	// Verify client was soft-deleted
	deletedClient, err := ts.Server.getOAuthServerClient(context.Background(), client.ID)
	assert.Error(ts.T(), err) // it was soft-deleted
	assert.Nil(ts.T(), deletedClient)
}

func (ts *OAuthClientTestSuite) TestOAuthServerClientListHandler() {
	// Create a couple test clients first
	client1, _ := ts.createTestOAuthClient()
	client2, _ := ts.createTestOAuthClient()

	req := httptest.NewRequest(http.MethodGet, "/admin/oauth/clients", nil)

	w := httptest.NewRecorder()

	err := ts.Server.OAuthServerClientList(w, req)
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var response OAuthServerClientListResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(ts.T(), err)

	assert.Len(ts.T(), response.Clients, 2)

	// Check that both clients are in the response (order might vary)
	clientIDs := []string{response.Clients[0].ClientID, response.Clients[1].ClientID}
	assert.Contains(ts.T(), clientIDs, client1.ID.String())
	assert.Contains(ts.T(), clientIDs, client2.ID.String())

	// Verify client secrets are not included in list response
	for _, client := range response.Clients {
		assert.Empty(ts.T(), client.ClientSecret)
	}
}

func (ts *OAuthClientTestSuite) TestOAuthServerClientUpdateHandler() {
	// Create a test client first
	client, _ := ts.createTestOAuthClient()

	// Test updating all fields
	newRedirectURIs := []string{"https://newapp.example.com/callback"}
	newGrantTypes := []string{"authorization_code", "refresh_token"}
	newClientName := "Updated Client Name"
	newClientURI := "https://newapp.example.com"
	newLogoURI := "https://newapp.example.com/logo.png"

	payload := OAuthServerClientUpdateParams{
		RedirectURIs: &newRedirectURIs,
		GrantTypes:   &newGrantTypes,
		ClientName:   &newClientName,
		ClientURI:    &newClientURI,
		LogoURI:      &newLogoURI,
	}

	body, err := json.Marshal(payload)
	require.NoError(ts.T(), err)

	req := httptest.NewRequest(http.MethodPut, "/admin/oauth/clients/"+client.ID.String(), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	ctx := shared.WithOAuthServerClient(req.Context(), client)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	err = ts.Server.OAuthServerClientUpdate(w, req)
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var response OAuthServerClientResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), client.ID.String(), response.ClientID)
	assert.Equal(ts.T(), newClientName, response.ClientName)
	assert.Equal(ts.T(), newRedirectURIs, response.RedirectURIs)
	assert.Equal(ts.T(), newGrantTypes, response.GrantTypes)
	assert.Equal(ts.T(), newClientURI, response.ClientURI)
	assert.Equal(ts.T(), newLogoURI, response.LogoURI)
	assert.Empty(ts.T(), response.ClientSecret) // Should NOT be included in update response
}

func (ts *OAuthClientTestSuite) TestOAuthServerClientUpdateHandlerPartial() {
	// Create a test client first
	client, _ := ts.createTestOAuthClient()

	// Test updating only client name
	newClientName := "Partially Updated Name"
	payload := OAuthServerClientUpdateParams{
		ClientName: &newClientName,
	}

	body, err := json.Marshal(payload)
	require.NoError(ts.T(), err)

	req := httptest.NewRequest(http.MethodPut, "/admin/oauth/clients/"+client.ID.String(), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	ctx := shared.WithOAuthServerClient(req.Context(), client)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	err = ts.Server.OAuthServerClientUpdate(w, req)
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var response OAuthServerClientResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(ts.T(), err)

	// Verify only client name was updated
	assert.Equal(ts.T(), newClientName, response.ClientName)
	// Verify other fields remained unchanged
	assert.Equal(ts.T(), client.GetRedirectURIs(), response.RedirectURIs)
}

func (ts *OAuthClientTestSuite) TestOAuthServerClientUpdateHandlerEmptyBody() {
	// Create a test client first
	client, _ := ts.createTestOAuthClient()

	// Test with empty body
	payload := OAuthServerClientUpdateParams{}

	body, err := json.Marshal(payload)
	require.NoError(ts.T(), err)

	req := httptest.NewRequest(http.MethodPut, "/admin/oauth/clients/"+client.ID.String(), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	ctx := shared.WithOAuthServerClient(req.Context(), client)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	err = ts.Server.OAuthServerClientUpdate(w, req)
	require.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "No fields provided for update")
}

func (ts *OAuthClientTestSuite) TestOAuthServerClientUpdateHandlerInvalidValidation() {
	// Create a test client first
	client, _ := ts.createTestOAuthClient()

	// Test with invalid redirect URI
	invalidRedirectURIs := []string{"invalid-uri"}
	payload := OAuthServerClientUpdateParams{
		RedirectURIs: &invalidRedirectURIs,
	}

	body, err := json.Marshal(payload)
	require.NoError(ts.T(), err)

	req := httptest.NewRequest(http.MethodPut, "/admin/oauth/clients/"+client.ID.String(), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	ctx := shared.WithOAuthServerClient(req.Context(), client)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	err = ts.Server.OAuthServerClientUpdate(w, req)
	require.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "invalid redirect_uri")
}

func (ts *OAuthClientTestSuite) TestOAuthServerClientUpdateHandlerSameValues() {
	// Create a test client first
	client, _ := ts.createTestOAuthClient()

	// Update with same values (should succeed)
	currentName := "Test Client"
	payload := OAuthServerClientUpdateParams{
		ClientName: &currentName,
	}

	body, err := json.Marshal(payload)
	require.NoError(ts.T(), err)

	req := httptest.NewRequest(http.MethodPut, "/admin/oauth/clients/"+client.ID.String(), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	ctx := shared.WithOAuthServerClient(req.Context(), client)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	err = ts.Server.OAuthServerClientUpdate(w, req)
	require.NoError(ts.T(), err)
	assert.Equal(ts.T(), http.StatusOK, w.Code)
}

func (ts *OAuthClientTestSuite) TestOAuthServerClientUpdateHandlerTokenEndpointAuthMethod() {
	// Create a confidential client (defaults to client_secret_basic)
	client, _ := ts.createTestOAuthClient()

	// Update token_endpoint_auth_method from client_secret_basic to client_secret_post
	newMethod := "client_secret_post"
	payload := OAuthServerClientUpdateParams{
		TokenEndpointAuthMethod: &newMethod,
	}

	body, err := json.Marshal(payload)
	require.NoError(ts.T(), err)

	req := httptest.NewRequest(http.MethodPut, "/admin/oauth/clients/"+client.ID.String(), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	ctx := shared.WithOAuthServerClient(req.Context(), client)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	err = ts.Server.OAuthServerClientUpdate(w, req)
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var response OAuthServerClientResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), "client_secret_post", response.TokenEndpointAuthMethod)
	assert.Equal(ts.T(), "confidential", response.ClientType)
}

func (ts *OAuthClientTestSuite) TestOAuthServerClientUpdateHandlerTokenEndpointAuthMethodInvalid() {
	// Create a confidential client
	client, _ := ts.createTestOAuthClient()

	// Attempt to set a confidential client's method to "none" (public-only method)
	invalidMethod := "none"
	payload := OAuthServerClientUpdateParams{
		TokenEndpointAuthMethod: &invalidMethod,
	}

	body, err := json.Marshal(payload)
	require.NoError(ts.T(), err)

	req := httptest.NewRequest(http.MethodPut, "/admin/oauth/clients/"+client.ID.String(), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	ctx := shared.WithOAuthServerClient(req.Context(), client)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	err = ts.Server.OAuthServerClientUpdate(w, req)
	require.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "not valid for client_type")
}

func (ts *OAuthClientTestSuite) TestOAuthServerClientUpdateHandlerTokenEndpointAuthMethodWithOtherFields() {
	// Create a confidential client
	client, _ := ts.createTestOAuthClient()

	// Update token_endpoint_auth_method alongside other fields
	newMethod := "client_secret_post"
	newClientName := "Updated With Auth Method"
	newRedirectURIs := []string{"https://updated.example.com/callback"}

	payload := OAuthServerClientUpdateParams{
		TokenEndpointAuthMethod: &newMethod,
		ClientName:              &newClientName,
		RedirectURIs:            &newRedirectURIs,
	}

	body, err := json.Marshal(payload)
	require.NoError(ts.T(), err)

	req := httptest.NewRequest(http.MethodPut, "/admin/oauth/clients/"+client.ID.String(), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	ctx := shared.WithOAuthServerClient(req.Context(), client)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	err = ts.Server.OAuthServerClientUpdate(w, req)
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var response OAuthServerClientResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), "client_secret_post", response.TokenEndpointAuthMethod)
	assert.Equal(ts.T(), "Updated With Auth Method", response.ClientName)
	assert.Equal(ts.T(), []string{"https://updated.example.com/callback"}, response.RedirectURIs)
}

func (ts *OAuthClientTestSuite) TestHandlerValidation() {
	// Test invalid JSON body
	req := httptest.NewRequest(http.MethodPost, "/admin/oauth/clients", bytes.NewReader([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	err := ts.Server.AdminOAuthServerClientRegister(w, req)
	require.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "Invalid JSON body")

	// Test validation failure
	payload := OAuthServerClientRegisterParams{
		ClientName:   "Test Client",
		RedirectURIs: []string{"invalid-uri"}, // Invalid URI
	}

	body, err := json.Marshal(payload)
	require.NoError(ts.T(), err)

	req = httptest.NewRequest(http.MethodPost, "/admin/oauth/clients", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	w = httptest.NewRecorder()
	err = ts.Server.AdminOAuthServerClientRegister(w, req)
	require.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "invalid redirect_uri")
}

// Helper function to create a test user
func (ts *OAuthClientTestSuite) createTestUser(email string) *models.User {
	user, err := models.NewUser("", email, "password123", "authenticated", nil)
	require.NoError(ts.T(), err)
	require.NotNil(ts.T(), user)

	err = ts.DB.Create(user)
	require.NoError(ts.T(), err)

	return user
}

// Helper function to create a test OAuth consent
func (ts *OAuthClientTestSuite) createTestConsent(userID, clientID string, scopes []string) *models.OAuthServerConsent {
	userUUID, err := uuid.FromString(userID)
	require.NoError(ts.T(), err)

	clientUUID, err := uuid.FromString(clientID)
	require.NoError(ts.T(), err)

	consent := models.NewOAuthServerConsent(userUUID, clientUUID, scopes)
	require.NoError(ts.T(), models.UpsertOAuthServerConsent(ts.DB, consent))

	return consent
}

// Helper function to create a test session for OAuth
func (ts *OAuthClientTestSuite) createTestSession(userID, clientID string) *models.Session {
	userUUID, err := uuid.FromString(userID)
	require.NoError(ts.T(), err)

	clientUUID, err := uuid.FromString(clientID)
	require.NoError(ts.T(), err)

	session, err := models.NewSession(userUUID, nil)
	require.NoError(ts.T(), err)
	session.OAuthClientID = &clientUUID

	err = ts.DB.Create(session)
	require.NoError(ts.T(), err)

	return session
}

func (ts *OAuthClientTestSuite) TestUserListOAuthGrants() {
	// Create test user
	user := ts.createTestUser("test@example.com")

	// Create test OAuth clients
	client1, _ := ts.createTestOAuthClient()
	client2, _ := ts.createTestOAuthClient()

	// Create consents for the user
	ts.createTestConsent(user.ID.String(), client1.ID.String(), []string{"read", "write"})
	ts.createTestConsent(user.ID.String(), client2.ID.String(), []string{"read"})

	// Create HTTP request
	req := httptest.NewRequest(http.MethodGet, "/user/oauth/grants", nil)

	// Add user to context (normally done by requireAuthentication middleware)
	ctx := shared.WithUser(req.Context(), user)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	// Call handler
	err := ts.Server.UserListOAuthGrants(w, req)
	require.NoError(ts.T(), err)

	// Check response
	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var grants []UserOAuthGrantResponse
	err = json.Unmarshal(w.Body.Bytes(), &grants)
	require.NoError(ts.T(), err)

	// Should have 2 grants
	assert.Len(ts.T(), grants, 2)

	// Verify client details are included
	for _, grant := range grants {
		assert.NotEmpty(ts.T(), grant.Client.ID)
		assert.Equal(ts.T(), "Test Client", grant.Client.Name)
		assert.NotEmpty(ts.T(), grant.Scopes)
		assert.NotEmpty(ts.T(), grant.GrantedAt)
	}

	// Check that client1 (with read and write scopes) is in the response
	found := false
	for _, grant := range grants {
		if grant.Client.ID == client1.ID.String() {
			found = true
			assert.Contains(ts.T(), grant.Scopes, "read")
			assert.Contains(ts.T(), grant.Scopes, "write")
		}
	}
	assert.True(ts.T(), found, "client1 should be in the grants list")
}

func (ts *OAuthClientTestSuite) TestUserListOAuthGrantsEmpty() {
	// Create test user with no grants
	user := ts.createTestUser("test2@example.com")

	req := httptest.NewRequest(http.MethodGet, "/user/oauth/grants", nil)
	ctx := shared.WithUser(req.Context(), user)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	err := ts.Server.UserListOAuthGrants(w, req)
	require.NoError(ts.T(), err)

	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var grants []UserOAuthGrantResponse
	err = json.Unmarshal(w.Body.Bytes(), &grants)
	require.NoError(ts.T(), err)

	// Should have 0 grants
	assert.Len(ts.T(), grants, 0)
}

func (ts *OAuthClientTestSuite) TestUserListOAuthGrantsNoAuth() {
	// Test without user in context (unauthenticated)
	req := httptest.NewRequest(http.MethodGet, "/user/oauth/grants", nil)
	w := httptest.NewRecorder()

	err := ts.Server.UserListOAuthGrants(w, req)
	require.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "authentication required")
}

func (ts *OAuthClientTestSuite) TestUserRevokeOAuthGrant() {
	// Create test user
	user := ts.createTestUser("test3@example.com")

	// Create a client and consent
	client, _ := ts.createTestOAuthClient()
	ts.createTestConsent(user.ID.String(), client.ID.String(), []string{"read", "write"})

	// Create a session for this OAuth client
	session := ts.createTestSession(user.ID.String(), client.ID.String())

	// Create HTTP request with query parameter
	req := httptest.NewRequest(http.MethodDelete, "/user/oauth/grants?client_id="+client.ID.String(), nil)

	// Add user to context
	ctx := shared.WithUser(req.Context(), user)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	// Call handler - should succeed
	err := ts.Server.UserRevokeOAuthGrant(w, req)
	require.NoError(ts.T(), err)

	// Check response
	assert.Equal(ts.T(), http.StatusNoContent, w.Code)
	assert.Empty(ts.T(), w.Body.String())

	// Verify consent was revoked
	consent, err := models.FindOAuthServerConsentByUserAndClient(ts.DB, user.ID, client.ID)
	require.NoError(ts.T(), err)
	assert.NotNil(ts.T(), consent.RevokedAt, "consent should be revoked")

	// Verify session was deleted
	deletedSession, err := models.FindSessionByID(ts.DB, session.ID, false)
	assert.Error(ts.T(), err, "session should be deleted")
	assert.Nil(ts.T(), deletedSession)
}

func (ts *OAuthClientTestSuite) TestUserRevokeOAuthGrantNotFound() {
	// Create test user
	user := ts.createTestUser("test4@example.com")

	// Create a client but don't create a consent
	client, _ := ts.createTestOAuthClient()

	// Create HTTP request with query parameter
	req := httptest.NewRequest(http.MethodDelete, "/user/oauth/grants?client_id="+client.ID.String(), nil)

	// Add user to context
	ctx := shared.WithUser(req.Context(), user)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	// Call handler - should return error
	err := ts.Server.UserRevokeOAuthGrant(w, req)
	require.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "No active grant found")
}

func (ts *OAuthClientTestSuite) TestUserRevokeOAuthGrantInvalidClientID() {
	// Create test user
	user := ts.createTestUser("test5@example.com")

	// Create HTTP request with invalid client ID query parameter
	req := httptest.NewRequest(http.MethodDelete, "/user/oauth/grants?client_id=invalid-uuid", nil)

	// Add user to context
	ctx := shared.WithUser(req.Context(), user)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	// Call handler - should return error
	err := ts.Server.UserRevokeOAuthGrant(w, req)
	require.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "invalid client_id format")
}

func (ts *OAuthClientTestSuite) TestUserRevokeOAuthGrantNoAuth() {
	// Test without user in context (unauthenticated)
	client, _ := ts.createTestOAuthClient()

	req := httptest.NewRequest(http.MethodDelete, "/user/oauth/grants?client_id="+client.ID.String(), nil)

	w := httptest.NewRecorder()

	err := ts.Server.UserRevokeOAuthGrant(w, req)
	require.Error(ts.T(), err)
	assert.Contains(ts.T(), err.Error(), "authentication required")
}

// Test UserInfo endpoint with different scopes
func (ts *OAuthClientTestSuite) TestUserInfo() {
	// Create test user
	user := ts.createTestUser("userinfo@example.com")
	user.Email = "userinfo@example.com"
	user.EmailConfirmedAt = &user.CreatedAt
	user.Phone = "1234567890"
	user.PhoneConfirmedAt = &user.CreatedAt

	// Set user metadata for profile
	userMetadata := map[string]interface{}{
		"full_name": "Test User",
		"name":      "Test User",
	}
	user.UserMetaData = userMetadata

	err := ts.DB.Update(user)
	require.NoError(ts.T(), err)

	// Create a client
	client, _ := ts.createTestOAuthClient()

	tests := []struct {
		name          string
		scopes        string
		expectEmail   bool
		expectProfile bool
		expectPhone   bool
	}{
		{
			name:          "All scopes granted",
			scopes:        "openid email profile phone",
			expectEmail:   true,
			expectProfile: true,
			expectPhone:   true,
		},
		{
			name:          "Only openid scope",
			scopes:        "openid",
			expectEmail:   false,
			expectProfile: false,
			expectPhone:   false,
		},
		{
			name:          "Email scope only",
			scopes:        "openid email",
			expectEmail:   true,
			expectProfile: false,
			expectPhone:   false,
		},
		{
			name:          "Profile scope only",
			scopes:        "openid profile",
			expectEmail:   false,
			expectProfile: true,
			expectPhone:   false,
		},
		{
			name:          "Phone scope only",
			scopes:        "openid phone",
			expectEmail:   false,
			expectProfile: false,
			expectPhone:   true,
		},
		{
			name:          "Email and Profile scopes",
			scopes:        "openid email profile",
			expectEmail:   true,
			expectProfile: true,
			expectPhone:   false,
		},
	}

	for _, tt := range tests {
		ts.T().Run(tt.name, func(t *testing.T) {
			// Create a session with specific scopes
			session, err := models.NewSession(user.ID, nil)
			require.NoError(t, err)
			session.OAuthClientID = &client.ID
			scopes := tt.scopes
			session.Scopes = &scopes
			err = ts.DB.Create(session)
			require.NoError(t, err)

			// Create HTTP request
			req := httptest.NewRequest(http.MethodGet, "/oauth/userinfo", nil)

			// Add user and session to context
			ctx := shared.WithUser(req.Context(), user)
			ctx = shared.WithSession(ctx, session)
			req = req.WithContext(ctx)

			w := httptest.NewRecorder()

			// Call handler
			err = ts.Server.OAuthUserInfo(w, req)
			require.NoError(t, err)

			// Check response
			assert.Equal(t, http.StatusOK, w.Code)

			var response map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)

			// Should always have sub
			assert.NotEmpty(t, response["sub"])

			// Check email claims
			if tt.expectEmail {
				assert.NotEmpty(t, response["email"], "email should be present")
				assert.NotNil(t, response["email_verified"], "email_verified should be present")
			} else {
				assert.Nil(t, response["email"], "email should not be present")
				assert.Nil(t, response["email_verified"], "email_verified should not be present")
			}

			// Check profile claims
			if tt.expectProfile {
				assert.NotNil(t, response["name"], "name should be present")
				assert.NotNil(t, response["user_metadata"], "user_metadata should be present")
			} else {
				assert.Nil(t, response["name"], "name should not be present")
				assert.Nil(t, response["user_metadata"], "user_metadata should not be present")
			}

			// Check phone claims
			if tt.expectPhone {
				assert.NotEmpty(t, response["phone"], "phone should be present")
				assert.NotNil(t, response["phone_verified"], "phone_verified should be present")
			} else {
				assert.Nil(t, response["phone"], "phone should not be present")
				assert.Nil(t, response["phone_verified"], "phone_verified should not be present")
			}

			// Clean up session for next test
			err = models.LogoutSession(ts.DB, session.ID)
			require.NoError(t, err)
		})
	}
}

func (ts *OAuthClientTestSuite) TestUserInfoNoSession() {
	// Create test user
	user := ts.createTestUser("nosession@example.com")

	// Create HTTP request without session
	req := httptest.NewRequest(http.MethodGet, "/oauth/userinfo", nil)

	// Add only user to context (no session)
	ctx := shared.WithUser(req.Context(), user)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	// Call handler - should return minimal info (just sub)
	err := ts.Server.OAuthUserInfo(w, req)
	require.NoError(ts.T(), err)

	// Check response
	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(ts.T(), err)

	// Should only have sub claim (minimal info without session)
	assert.NotEmpty(ts.T(), response["sub"])
	assert.Nil(ts.T(), response["email"])
	assert.Nil(ts.T(), response["name"])
	assert.Nil(ts.T(), response["phone"])
}

func (ts *OAuthClientTestSuite) TestUserInfoNoOAuthClient() {
	// Create test user
	user := ts.createTestUser("nooauth@example.com")

	// Create a session without OAuth client
	session, err := models.NewSession(user.ID, nil)
	require.NoError(ts.T(), err)
	err = ts.DB.Create(session)
	require.NoError(ts.T(), err)

	// Create HTTP request
	req := httptest.NewRequest(http.MethodGet, "/oauth/userinfo", nil)

	// Add user and session to context
	ctx := shared.WithUser(req.Context(), user)
	ctx = shared.WithSession(ctx, session)
	req = req.WithContext(ctx)

	w := httptest.NewRecorder()

	// Call handler - should return minimal info (just sub) since no scopes in session
	err = ts.Server.OAuthUserInfo(w, req)
	require.NoError(ts.T(), err)

	// Check response
	assert.Equal(ts.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(ts.T(), err)

	// Should only have sub claim (no scopes granted)
	assert.NotEmpty(ts.T(), response["sub"])
	assert.Nil(ts.T(), response["email"])
	assert.Nil(ts.T(), response["name"])
	assert.Nil(ts.T(), response["phone"])
}
