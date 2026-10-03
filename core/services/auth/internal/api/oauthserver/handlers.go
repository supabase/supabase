package oauthserver

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/shared"
	"github.com/supabase/auth/internal/metering"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/observability"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/tokens"
	"github.com/supabase/auth/internal/utilities"
)

// OAuth 2.1 Grant Types, aliased from internal/tokens so the OAuth server's grant type
// dispatch and its metering events share one source of truth.
const (
	GrantTypeAuthorizationCode = tokens.GrantTypeAuthorizationCode
	GrantTypeRefreshToken      = tokens.GrantTypeRefreshToken
)

// OAuthServerClientResponse represents the response format for OAuth client operations
type OAuthServerClientResponse struct {
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret,omitempty"` // only returned on registration
	ClientType   string `json:"client_type"`

	RedirectURIs            []string `json:"redirect_uris,omitempty"`
	TokenEndpointAuthMethod string   `json:"token_endpoint_auth_method,omitempty"`
	GrantTypes              []string `json:"grant_types,omitempty"`
	ResponseTypes           []string `json:"response_types,omitempty"`
	ClientName              string   `json:"client_name,omitempty"`
	ClientURI               string   `json:"client_uri,omitempty"`
	LogoURI                 string   `json:"logo_uri,omitempty"`

	// Metadata fields
	RegistrationType string    `json:"registration_type,omitempty"`
	CreatedAt        time.Time `json:"created_at,omitempty"`
	UpdatedAt        time.Time `json:"updated_at,omitempty"`
}

// OAuthServerClientListResponse represents the response for listing OAuth clients
type OAuthServerClientListResponse struct {
	Clients []OAuthServerClientResponse `json:"clients,omitempty"`
}

// oauthServerClientToResponse converts a model to response format
func oauthServerClientToResponse(client *models.OAuthServerClient) *OAuthServerClientResponse {
	response := &OAuthServerClientResponse{
		ClientID:   client.ID.String(),
		ClientType: client.ClientType,

		// OAuth 2.1 DCR fields
		RedirectURIs:            client.GetRedirectURIs(),
		TokenEndpointAuthMethod: client.GetTokenEndpointAuthMethod(),
		GrantTypes:              client.GetGrantTypes(),
		ResponseTypes:           []string{"code"}, // Always "code" in OAuth 2.1
		ClientName:              utilities.StringValue(client.ClientName),
		ClientURI:               utilities.StringValue(client.ClientURI),
		LogoURI:                 utilities.StringValue(client.LogoURI),

		// Metadata fields
		RegistrationType: client.RegistrationType,
		CreatedAt:        client.CreatedAt,
		UpdatedAt:        client.UpdatedAt,
	}

	return response
}

// LoadOAuthServerClient is middleware that loads an OAuth server client from the URL parameter
func (s *Server) LoadOAuthServerClient(w http.ResponseWriter, r *http.Request) (context.Context, error) {
	ctx := r.Context()
	clientIDStr := chi.URLParam(r, "client_id")

	if clientIDStr == "" {
		return nil, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "client_id is required")
	}

	// Parse client_id as UUID
	clientID, err := uuid.FromString(clientIDStr)
	if err != nil {
		return nil, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "invalid client_id format")
	}

	observability.LogEntrySetField(r, "oauth_client_id", clientIDStr)

	client, err := s.getOAuthServerClient(ctx, clientID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return nil, apierrors.NewNotFoundError(apierrors.ErrorCodeOAuthClientNotFound, "OAuth client not found")
		}
		return nil, apierrors.NewInternalServerError("Error loading OAuth client").WithInternalError(err)
	}

	ctx = shared.WithOAuthServerClient(ctx, client)
	return ctx, nil
}

// AdminOAuthServerClientRegister handles POST /admin/oauth/clients (manual registration by admins)
func (s *Server) AdminOAuthServerClientRegister(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()

	var params OAuthServerClientRegisterParams
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeBadJSON, "Invalid JSON body")
	}

	// Force registration type to manual for admin endpoint
	params.RegistrationType = "manual"

	client, plaintextSecret, err := s.registerOAuthServerClient(ctx, &params)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "%s", err.Error())
	}

	response := oauthServerClientToResponse(client)
	if client.IsConfidential() {
		response.ClientSecret = plaintextSecret
	}

	return shared.SendJSON(w, http.StatusCreated, response)
}

// OAuthServerClientDynamicRegister handles POST /oauth/register (OAuth 2.1 Dynamic Client Registration)
func (s *Server) OAuthServerClientDynamicRegister(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()

	// Check if dynamic registration is enabled
	if !s.config.OAuthServer.AllowDynamicRegistration {
		return apierrors.NewForbiddenError(apierrors.ErrorCodeOAuthDynamicClientRegistrationDisabled, "Dynamic client registration is not enabled")
	}

	var params OAuthServerClientRegisterParams
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeBadJSON, "Invalid JSON body")
	}

	params.RegistrationType = "dynamic"

	client, plaintextSecret, err := s.registerOAuthServerClient(ctx, &params)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "%s", err.Error())
	}

	response := oauthServerClientToResponse(client)
	if client.IsConfidential() {
		response.ClientSecret = plaintextSecret
	}

	return shared.SendJSON(w, http.StatusCreated, response)
}

// OAuthServerClientGet handles GET /admin/oauth/clients/{client_id}
func (s *Server) OAuthServerClientGet(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	client := shared.GetOAuthServerClient(ctx)

	response := oauthServerClientToResponse(client)
	return shared.SendJSON(w, http.StatusOK, response)
}

// OAuthServerClientUpdate handles PUT /admin/oauth/clients/{client_id}
func (s *Server) OAuthServerClientUpdate(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	client := shared.GetOAuthServerClient(ctx)

	var params OAuthServerClientUpdateParams
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeBadJSON, "Invalid JSON body")
	}

	// Return early if no fields are provided for update
	if params.isEmpty() {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "No fields provided for update")
	}

	updatedClient, err := s.updateOAuthServerClient(ctx, client.ID, &params)
	if err != nil {
		if httpErr, ok := err.(*apierrors.HTTPError); ok {
			return httpErr
		}
		return apierrors.NewInternalServerError("Error updating OAuth client").WithInternalError(err)
	}

	response := oauthServerClientToResponse(updatedClient)
	return shared.SendJSON(w, http.StatusOK, response)
}

// OAuthServerClientDelete handles DELETE /admin/oauth/clients/{client_id}
func (s *Server) OAuthServerClientDelete(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	client := shared.GetOAuthServerClient(ctx)

	if err := s.deleteOAuthServerClient(ctx, client.ID); err != nil {
		return apierrors.NewInternalServerError("Error deleting OAuth client").WithInternalError(err)
	}

	w.WriteHeader(http.StatusNoContent)
	return nil
}

// OAuthServerClientRegenerateSecret handles POST /admin/oauth/clients/{client_id}/regenerate_secret
func (s *Server) OAuthServerClientRegenerateSecret(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	client := shared.GetOAuthServerClient(ctx)

	// Only confidential clients can have their secrets regenerated
	if !client.IsConfidential() {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Cannot regenerate secret for public client")
	}

	updatedClient, plaintextSecret, err := s.regenerateOAuthServerClientSecret(ctx, client.ID)
	if err != nil {
		return apierrors.NewInternalServerError("Error regenerating OAuth client secret").WithInternalError(err)
	}

	response := oauthServerClientToResponse(updatedClient)
	response.ClientSecret = plaintextSecret

	return shared.SendJSON(w, http.StatusOK, response)
}

// OAuthServerClientList handles GET /admin/oauth/clients
func (s *Server) OAuthServerClientList(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := s.db.WithContext(ctx)

	// TODO(cemal) :: Add pagination, check the `/admin/users` endpoint for reference
	var clients []models.OAuthServerClient
	if err := db.Q().Where("deleted_at is null").Order("created_at desc").All(&clients); err != nil {
		return apierrors.NewInternalServerError("Error listing OAuth clients").WithInternalError(err)
	}

	responses := make([]OAuthServerClientResponse, len(clients))
	for i, client := range clients {
		responses[i] = *oauthServerClientToResponse(&client)
	}

	response := OAuthServerClientListResponse{
		Clients: responses,
	}

	return shared.SendJSON(w, http.StatusOK, response)
}

// OAuthTokenParams represents the parameters for the OAuth token endpoint
type OAuthTokenParams struct {
	GrantType    string `json:"grant_type" form:"grant_type"`
	Code         string `json:"code" form:"code"`
	RefreshToken string `json:"refresh_token" form:"refresh_token"`
	RedirectURI  string `json:"redirect_uri" form:"redirect_uri"`
	ClientID     string `json:"client_id" form:"client_id"`
	ClientSecret string `json:"client_secret" form:"client_secret"`
	CodeVerifier string `json:"code_verifier" form:"code_verifier"`
	Resource     string `json:"resource" form:"resource"`
}

// OAuthToken handles POST /oauth/token
func (s *Server) OAuthToken(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()

	var params OAuthTokenParams

	// Handle both JSON and form-encoded requests
	contentType := r.Header.Get("Content-Type")
	if strings.Contains(contentType, "application/json") {
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			return apierrors.NewOAuthError("invalid_request", "Invalid JSON body")
		}
	} else {
		// Parse form data
		if err := r.ParseForm(); err != nil {
			return apierrors.NewOAuthError("invalid_request", "Failed to parse form data")
		}

		params.GrantType = r.FormValue("grant_type")
		params.Code = r.FormValue("code")
		params.RefreshToken = r.FormValue("refresh_token")
		params.RedirectURI = r.FormValue("redirect_uri")
		params.ClientID = r.FormValue("client_id")
		params.ClientSecret = r.FormValue("client_secret")
		params.CodeVerifier = r.FormValue("code_verifier")
	}

	// Validate grant_type
	if params.GrantType == "" {
		return apierrors.NewOAuthError("invalid_request", "grant_type is required")
	}

	client := shared.GetOAuthServerClient(ctx)
	if client == nil {
		return apierrors.NewOAuthError("invalid_client", "Client authentication required")
	}

	// Validate that the authenticated client is allowed to use the requested grant type
	if !client.IsGrantTypeAllowed(params.GrantType) {
		return apierrors.NewOAuthError("unsupported_grant_type", "Client is not allowed to use grant type: "+params.GrantType)
	}

	switch params.GrantType {
	case GrantTypeAuthorizationCode:
		return s.handleAuthorizationCodeGrant(ctx, w, r, &params)
	case GrantTypeRefreshToken:
		return s.handleRefreshTokenGrant(ctx, w, r, &params)
	default:
		return apierrors.NewOAuthError("unsupported_grant_type", "Unsupported grant type: "+params.GrantType)
	}
}

// handleAuthorizationCodeGrant handles the authorization_code grant type
func (s *Server) handleAuthorizationCodeGrant(ctx context.Context, w http.ResponseWriter, r *http.Request, params *OAuthTokenParams) error {
	if params.Code == "" {
		return apierrors.NewOAuthError("invalid_request", "code is required for authorization_code grant")
	}

	// Get authenticated client from middleware
	client := shared.GetOAuthServerClient(ctx)
	if client == nil {
		return apierrors.NewOAuthError("invalid_client", "Client authentication required")
	}

	// Exchange authorization code for tokens
	db := s.db.WithContext(ctx)
	tokenService := s.getTokenService()
	if tokenService == nil {
		return apierrors.NewInternalServerError("Token service not available")
	}

	// Find the OAuth authorization for this authorization code
	authorization, err := models.FindOAuthServerAuthorizationByCode(db, params.Code)
	if err != nil {
		if models.IsNotFoundError(err) {
			return apierrors.NewOAuthError("invalid_grant", "Invalid authorization code")
		}
		return apierrors.NewInternalServerError("Error finding authorization code").WithInternalError(err)
	}

	// Check if the authorization has expired
	if authorization.IsExpired() {
		return apierrors.NewOAuthError("invalid_grant", "Authorization code has expired")
	}

	// Validate that the authorization code was issued for this client
	if authorization.ClientID != client.ID {
		return apierrors.NewOAuthError("invalid_grant", "Authorization code was not issued for this client")
	}

	// Validate that (if exists) the resource parameter matches the authorization code resource
	if params.Resource != "" && params.Resource != utilities.StringValue(authorization.Resource) {
		return apierrors.NewOAuthError("invalid_grant", "Authorization code resource does not match the resource parameter")
	}

	// Validate redirect_uri if provided - must match the one used in authorization
	if params.RedirectURI != "" && params.RedirectURI != authorization.RedirectURI {
		return apierrors.NewOAuthError("invalid_grant", "Invalid redirect_uri")
	}

	// Validate PKCE if used in the authorization
	if err := authorization.VerifyPKCE(params.CodeVerifier); err != nil {
		return apierrors.NewOAuthError("invalid_grant", "PKCE verification failed: "+err.Error())
	}

	// Get the user for the authorization code
	if authorization.UserID == nil {
		return apierrors.NewOAuthError("invalid_grant", "Authorization code has no associated user")
	}

	user, err := models.FindUserByID(db, *authorization.UserID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return apierrors.NewOAuthError("invalid_grant", "User not found for authorization code")
		}
		return apierrors.NewInternalServerError("Error finding user").WithInternalError(err)
	}

	if user.IsBanned() {
		return apierrors.NewOAuthError("access_denied", "User is banned")
	}

	// Exchange the authorization code for tokens
	var tokenResponse *tokens.AccessTokenResponse
	var grantParams models.GrantParams
	grantParams.FillGrantParams(r)
	grantParams.OAuthClientID = &client.ID

	// Store scopes from authorization in session
	scopes := authorization.Scope
	grantParams.Scopes = &scopes

	err = db.Transaction(func(tx *storage.Connection) error {
		if _, terr := models.FindOAuthServerAuthorizationByIDForUpdate(tx, authorization.AuthorizationID); terr != nil {
			if models.IsNotFoundError(terr) {
				return apierrors.NewOAuthError("invalid_grant", "Invalid authorization code")
			}
			return apierrors.NewInternalServerError("Error locking authorization code").WithInternalError(terr)
		}

		authMethod := models.OAuthProviderAuthorizationCode

		// Create audit log entry for OAuth token exchange
		if terr := models.NewAuditLogEntry(s.config.AuditLog, r, tx, user, models.LoginAction, "", map[string]interface{}{
			"provider_type": "oauth_provider_authorization_code",
			"client_id":     client.ID.String(),
		}); terr != nil {
			return terr
		}

		// Issue the refresh token and access token
		var terr error
		tokenResponse, terr = tokenService.IssueRefreshToken(r, w.Header(), tx, user, authMethod, grantParams)
		if terr != nil {
			return terr
		}

		// Mark authorization as used - authorization codes are single use
		// We could either delete it or mark it as consumed
		if terr = tx.Destroy(authorization); terr != nil {
			return terr
		}

		return nil
	})

	if err != nil {
		if httpErr, ok := err.(*apierrors.HTTPError); ok {
			return httpErr
		}
		if oauthErr, ok := err.(*apierrors.OAuthError); ok {
			return oauthErr
		}
		return apierrors.NewInternalServerError("Error exchanging authorization code").WithInternalError(err)
	}

	// Check if we need to generate OIDC ID Token (only if 'openid' scope is present)
	scopeList := models.ParseScopeString(authorization.Scope)
	if models.HasScope(scopeList, models.ScopeOpenID) {
		var nonce string
		if authorization.Nonce != nil {
			nonce = *authorization.Nonce
		}

		idToken, err := tokenService.GenerateIDToken(ctx, tokens.GenerateIDTokenParams{
			User:     user,
			ClientID: client.ID,
			Nonce:    nonce,
			AuthTime: user.LastSignInAt,
			Scopes:   scopeList,
		})
		if err != nil {
			return apierrors.NewInternalServerError("Error generating ID token").WithInternalError(err)
		}

		tokenResponse.IDToken = idToken
	}

	metering.RecordLogin(metering.LoginTypeOAuthServer, user.ID, &metering.LoginData{
		OAuthServer: &metering.OAuthServerData{
			ClientID:  client.ID.String(),
			GrantType: GrantTypeAuthorizationCode,
		},
	})

	// Convert to OAuth-compliant response format (exclude user info for OAuth clients)
	oauthResponse := map[string]interface{}{
		"access_token":  tokenResponse.Token,
		"token_type":    tokenResponse.TokenType,
		"expires_in":    tokenResponse.ExpiresIn,
		"refresh_token": tokenResponse.RefreshToken,
	}

	// Include ID token if generated (OIDC)
	if tokenResponse.IDToken != "" {
		oauthResponse["id_token"] = tokenResponse.IDToken
	}

	return shared.SendJSON(w, http.StatusOK, oauthResponse)
}

// handleRefreshTokenGrant handles the refresh_token grant type
func (s *Server) handleRefreshTokenGrant(ctx context.Context, w http.ResponseWriter, r *http.Request, params *OAuthTokenParams) error {
	if params.RefreshToken == "" {
		return apierrors.NewOAuthError("invalid_request", "refresh_token is required for refresh_token grant")
	}

	// Use the token service to handle refresh token grant
	tokenService := s.getTokenService()
	if tokenService == nil {
		return apierrors.NewInternalServerError("Token service not available")
	}

	// Get OAuth client from context if present
	var clientID *uuid.UUID
	if oauthClient := shared.GetOAuthServerClient(ctx); oauthClient != nil {
		clientID = &oauthClient.ID
	}

	db := s.db.WithContext(ctx)
	tokenResponse, err := tokenService.RefreshTokenGrant(ctx, db, r, w.Header(), tokens.RefreshTokenGrantParams{
		RefreshToken: params.RefreshToken,
		ClientID:     clientID,
	})
	if err != nil {
		return err
	}

	// Convert to OAuth-compliant response format (exclude user info for OAuth clients)
	oauthResponse := map[string]interface{}{
		"access_token":  tokenResponse.Token,
		"token_type":    tokenResponse.TokenType,
		"expires_in":    tokenResponse.ExpiresIn,
		"refresh_token": tokenResponse.RefreshToken,
	}

	return shared.SendJSON(w, http.StatusOK, oauthResponse)
}

// getTokenService retrieves the token service from the server
func (s *Server) getTokenService() *tokens.Service {
	return s.tokenService
}

// UserOAuthGrantResponse represents an OAuth grant that a user has authorized
type UserOAuthGrantResponse struct {
	Client    ClientDetailsResponse `json:"client"`
	Scopes    []string              `json:"scopes"`
	GrantedAt time.Time             `json:"granted_at"`
}

// UserListOAuthGrants handles GET /user/oauth/grants
// Lists all OAuth grants that the authenticated user has authorized (active consents)
func (s *Server) UserListOAuthGrants(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	user := shared.GetUser(ctx)

	if user == nil {
		return apierrors.NewForbiddenError(apierrors.ErrorCodeBadJWT, "authentication required")
	}

	db := s.db.WithContext(ctx)

	// Get all active (non-revoked) consents for this user
	consents, err := models.FindOAuthServerConsentsByUser(db, user.ID, false)
	if err != nil {
		return apierrors.NewInternalServerError("Error fetching OAuth grants").WithInternalError(err)
	}

	// Build response with client information
	grants := make([]UserOAuthGrantResponse, 0, len(consents))

	for _, consent := range consents {
		// Fetch client details
		client, err := models.FindOAuthServerClientByID(db, consent.ClientID)
		if err != nil {
			// Skip clients that no longer exist or are deleted
			if models.IsNotFoundError(err) {
				continue
			}
			return apierrors.NewInternalServerError("Error fetching client details").WithInternalError(err)
		}

		response := UserOAuthGrantResponse{
			Client: ClientDetailsResponse{
				ID:      client.ID.String(),
				Name:    utilities.StringValue(client.ClientName),
				URI:     utilities.StringValue(client.ClientURI),
				LogoURI: utilities.StringValue(client.LogoURI),
			},
			Scopes:    consent.GetScopeList(),
			GrantedAt: consent.GrantedAt,
		}

		grants = append(grants, response)
	}

	return shared.SendJSON(w, http.StatusOK, grants)
}

// UserRevokeOAuthGrant handles DELETE /user/oauth/grants?client_id=...
// Revokes the user's OAuth grant for a specific client
func (s *Server) UserRevokeOAuthGrant(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	user := shared.GetUser(ctx)

	if user == nil {
		return apierrors.NewForbiddenError(apierrors.ErrorCodeBadJWT, "authentication required")
	}

	clientIDStr := r.URL.Query().Get("client_id")
	if clientIDStr == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "client_id query parameter is required")
	}

	// Parse client_id as UUID
	clientID, err := uuid.FromString(clientIDStr)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "invalid client_id format")
	}

	db := s.db.WithContext(ctx)

	// Find the active consent for this user and client
	consent, err := models.FindActiveOAuthServerConsentByUserAndClient(db, user.ID, clientID)
	if err != nil {
		return apierrors.NewInternalServerError("Error finding consent").WithInternalError(err)
	}

	if consent == nil {
		return apierrors.NewNotFoundError(apierrors.ErrorCodeOAuthConsentNotFound, "No active grant found for this client")
	}

	// Revoke the consent in a transaction
	err = db.Transaction(func(tx *storage.Connection) error {
		if terr := consent.Revoke(tx); terr != nil {
			return terr
		}

		// Delete all sessions associated with this OAuth client for this user
		// This will invalidate all refresh tokens for those sessions
		if terr := models.RevokeOAuthSessions(tx, user.ID, clientID); terr != nil {
			return terr
		}

		// Create audit log entry
		if terr := models.NewAuditLogEntry(s.config.AuditLog, r, tx, user, models.TokenRevokedAction, "", map[string]interface{}{
			"oauth_client_id": clientID.String(),
			"action":          "revoke_oauth_grant",
		}); terr != nil {
			return terr
		}

		return nil
	})

	if err != nil {
		return apierrors.NewInternalServerError("Error revoking grant").WithInternalError(err)
	}

	w.WriteHeader(http.StatusNoContent)
	return nil
}

// OAuthUserInfo handles GET /oauth/userinfo (OIDC UserInfo endpoint)
// Per OIDC Core Section 5.3
//
// Returns user information filtered by the scopes granted in the access token:
// - openid: sub (user ID) - always included as base claim
// - email: email, email_confirmed_at, new_email
// - profile: name, picture, preferred_username, updated_at, user_metadata
// - phone: phone, phone_confirmed_at, new_phone
func (s *Server) OAuthUserInfo(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()

	// Get authenticated user from context (set by requireAuthentication middleware)
	user := shared.GetUser(ctx)

	// Get the session to retrieve scopes
	// The access token contains session_id claim, and requireAuthentication middleware
	// loads the session into context
	session := shared.GetSession(ctx)

	// Build base userInfo response with 'sub' (required by OIDC spec)
	userInfo := map[string]interface{}{
		"sub": user.ID.String(),
	}
	if session == nil {
		// If no session in context, this is likely a non-OAuth token
		// Return minimal user info (just sub claim)
		return shared.SendJSON(w, http.StatusOK, userInfo)
	}

	// Get scopes from session
	scopes := session.GetScopeList()

	// Add scope-specific claims
	hasEmailScope := models.HasScope(scopes, models.ScopeEmail)
	hasProfileScope := models.HasScope(scopes, models.ScopeProfile)
	hasPhoneScope := models.HasScope(scopes, models.ScopePhone)

	// Email scope claims
	if hasEmailScope {
		if email := user.GetEmail(); email != "" {
			userInfo["email"] = email
		}
		if user.EmailConfirmedAt != nil {
			userInfo["email_verified"] = true
		}
	}

	// Profile scope claims
	if hasProfileScope {
		// Extract name from user metadata
		if name, ok := user.UserMetaData["name"].(string); ok && name != "" {
			userInfo["name"] = name
		} else if user.GetEmail() != "" {
			userInfo["name"] = user.GetEmail()
		}

		// Extract picture
		if picture, ok := user.UserMetaData["picture"].(string); ok && picture != "" {
			userInfo["picture"] = picture
		} else if avatarURL, ok := user.UserMetaData["avatar_url"].(string); ok && avatarURL != "" {
			userInfo["picture"] = avatarURL
		}

		// Extract preferred_username
		if username, ok := user.UserMetaData["preferred_username"].(string); ok && username != "" {
			userInfo["preferred_username"] = username
		} else if username, ok := user.UserMetaData["username"].(string); ok && username != "" {
			userInfo["preferred_username"] = username
		}

		// Add updated_at
		if user.UpdatedAt.Unix() > 0 {
			userInfo["updated_at"] = user.UpdatedAt.Unix()
		}

		// Include user_metadata with profile scope
		if user.UserMetaData != nil {
			userInfo["user_metadata"] = user.UserMetaData
		}
	}

	// Phone scope claims
	if hasPhoneScope {
		if phone := user.GetPhone(); phone != "" {
			userInfo["phone"] = phone
		}
		if user.PhoneConfirmedAt != nil {
			userInfo["phone_verified"] = true
		}
	}

	return shared.SendJSON(w, http.StatusOK, userInfo)
}
