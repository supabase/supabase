package oauthserver

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/shared"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/observability"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/utilities"
)

// AuthorizeParams represents the parameters for an OAuth authorization request
type AuthorizeParams struct {
	ClientID     string `json:"client_id"`
	RedirectURI  string `json:"redirect_uri"`
	ResponseType string `json:"response_type"`
	Scope        string `json:"scope"`
	State        string `json:"state"`

	// Resource Resource Indicator per RFC8707
	Resource            string `json:"resource"`
	CodeChallenge       string `json:"code_challenge"`
	CodeChallengeMethod string `json:"code_challenge_method"`
	Nonce               string `json:"nonce"` // OIDC nonce parameter
}

// AuthorizationDetailsResponse represents the response for getting authorization details
type AuthorizationDetailsResponse struct {
	AuthorizationID string                `json:"authorization_id"`
	RedirectURI     string                `json:"redirect_uri,omitempty"`
	Client          ClientDetailsResponse `json:"client,omitempty"`
	User            UserDetailsResponse   `json:"user,omitempty"`
	Scope           string                `json:"scope,omitempty"`
}

// ClientDetailsResponse represents client details in authorization response
type ClientDetailsResponse struct {
	ID      string `json:"id"`
	Name    string `json:"name,omitempty"`
	URI     string `json:"uri,omitempty"`
	LogoURI string `json:"logo_uri,omitempty"`
}

// UserDetailsResponse represents user details in authorization response
type UserDetailsResponse struct {
	ID    string `json:"id,omitempty"`
	Email string `json:"email,omitempty"`
}

// ConsentRequest represents a consent decision request
type ConsentRequest struct {
	Action OAuthServerConsentAction `json:"action"`
}

// ConsentResponse represents the response after processing consent
type ConsentResponse struct {
	RedirectURL string `json:"redirect_url,omitempty"`
}

type OAuthServerConsentAction string

const (
	OAuthServerConsentActionApprove OAuthServerConsentAction = "approve"
	OAuthServerConsentActionDeny    OAuthServerConsentAction = "deny"
)

// OAuth2 error codes per RFC 6749
const (
	oAuth2ErrorInvalidRequest = "invalid_request"
	oAuth2ErrorServerError    = "server_error"
	oAuth2ErrorAccessDenied   = "access_denied"
)

// OAuthServerAuthorize handles GET /oauth/authorize
func (s *Server) OAuthServerAuthorize(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := s.db.WithContext(ctx)
	config := s.config

	query := r.URL.Query()

	params := &AuthorizeParams{
		ClientID:            query.Get("client_id"),
		RedirectURI:         query.Get("redirect_uri"),
		ResponseType:        query.Get("response_type"),
		Scope:               query.Get("scope"),
		State:               query.Get("state"),
		Resource:            query.Get("resource"),
		CodeChallenge:       query.Get("code_challenge"),
		CodeChallengeMethod: query.Get("code_challenge_method"),
		Nonce:               query.Get("nonce"),
	}

	// validate basic required parameters (client_id, redirect_uri)
	// this errors wont be redirected, just returned in the json
	params, err := s.validateBasicAuthorizeParams(params)
	if err != nil {
		return err
	}

	// Parse client_id as UUID
	clientID, err := uuid.FromString(params.ClientID)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeOAuthClientNotFound, "invalid client_id format")
	}

	client, err := s.getOAuthServerClient(ctx, clientID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeOAuthClientNotFound, "invalid client_id")
		}
		return apierrors.NewInternalServerError("error validating client").WithInternalError(err)
	}

	// validate redirect_uri matches client's registered URIs
	if !s.isValidRedirectURI(client, params.RedirectURI) {
		// Invalid redirect_uri should NOT redirect per OAuth2 spec since we can't trust it
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "invalid redirect_uri")
	}

	// From this point on, we have valid client + redirect_uri + all params, so we can redirect errors
	// validate all other parameters - now we can redirect errors
	if err := s.validateRemainingAuthorizeParams(params); err != nil {
		errorRedirectURL := s.buildErrorRedirectURL(params.RedirectURI, oAuth2ErrorInvalidRequest, err.Error(), params.State)
		http.Redirect(w, r, errorRedirectURL, http.StatusFound)
		return nil
	}

	// Store authorization request in database (without user initially)
	authorization := models.NewOAuthServerAuthorization(models.NewOAuthServerAuthorizationParams{
		ClientID:            client.ID,
		RedirectURI:         params.RedirectURI,
		Scope:               params.Scope,
		State:               params.State,
		Resource:            params.Resource,
		CodeChallenge:       params.CodeChallenge,
		CodeChallengeMethod: params.CodeChallengeMethod,
		TTL:                 config.OAuthServer.AuthorizationTTL,
		Nonce:               params.Nonce,
	})

	if err := models.CreateOAuthServerAuthorization(db, authorization); err != nil {
		// Error creating authorization - redirect with server_error
		errorRedirectURL := s.buildErrorRedirectURL(params.RedirectURI, oAuth2ErrorServerError, "error creating authorization", params.State)
		http.Redirect(w, r, errorRedirectURL, http.StatusFound)
		return nil
	}

	observability.LogEntrySetField(r, "authorization_id", authorization.AuthorizationID)
	observability.LogEntrySetField(r, "client_id", client.ID.String())

	// Redirect to authorization path with authorization_id
	if config.OAuthServer.AuthorizationPath == "" {
		// OAuth authorization path not configured - redirect with server_error
		errorRedirectURL := s.buildErrorRedirectURL(params.RedirectURI, oAuth2ErrorServerError, "oauth authorization path not configured", params.State)
		http.Redirect(w, r, errorRedirectURL, http.StatusFound)
		return nil
	}

	baseURL := s.buildAuthorizationURL(config.SiteURL, config.OAuthServer.AuthorizationPath)
	redirectURL := fmt.Sprintf("%s?authorization_id=%s", baseURL, authorization.AuthorizationID)

	http.Redirect(w, r, redirectURL, http.StatusFound)
	return nil
}

// OAuthServerGetAuthorization handles GET /oauth/authorizations/{authorization_id}
func (s *Server) OAuthServerGetAuthorization(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := s.db.WithContext(ctx)

	// Validate request origin - the request must come from the site URL as we redirected there at the first place
	if err := s.validateRequestOrigin(r); err != nil {
		return err
	}

	// Get authenticated user
	user := shared.GetUser(ctx)
	if user == nil {
		return apierrors.NewForbiddenError(apierrors.ErrorCodeBadJWT, "authentication required")
	}

	authorizationID := chi.URLParam(r, "authorization_id")
	if authorizationID == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "authorization_id is required")
	}

	var (
		authorization     *models.OAuthServerAuthorization
		shouldAutoApprove bool
	)

	// Lookup, user association, consent check, and optional auto-approve
	// run under a FOR UPDATE SKIP LOCKED row lock so two concurrent callers
	// cannot both claim the same pending authorization and each receive a
	// valid authorization code.
	err := db.Transaction(func(tx *storage.Connection) error {
		auth, terr := models.FindOAuthServerAuthorizationByIDForUpdate(tx, authorizationID)
		if terr != nil {
			if models.IsNotFoundError(terr) {
				return apierrors.NewNotFoundError(apierrors.ErrorCodeOAuthAuthorizationNotFound, "authorization not found")
			}
			return apierrors.NewInternalServerError("error finding authorization").WithInternalError(terr)
		}

		if auth.IsExpired() {
			if merr := auth.MarkExpired(tx); merr != nil {
				observability.GetLogEntry(r).Entry.WithError(merr).Warn("failed to mark authorization as expired")
				return apierrors.NewNotFoundError(apierrors.ErrorCodeOAuthAuthorizationNotFound, "authorization not found")
			}
			// Commit the MarkExpired update but still return not-found.
			return storage.NewCommitWithError(apierrors.NewNotFoundError(apierrors.ErrorCodeOAuthAuthorizationNotFound, "authorization not found"))
		}

		if auth.Status != models.OAuthServerAuthorizationPending {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "authorization request cannot be processed")
		}

		if auth.UserID == nil {
			if err := auth.SetUser(tx, user.ID); err != nil {
				return err
			}

			existingConsent, cerr := models.FindActiveOAuthServerConsentByUserAndClient(tx, user.ID, auth.ClientID)
			if cerr != nil {
				return cerr
			}

			if existingConsent != nil && s.consentCoversScopes(existingConsent, auth.Scope) {
				shouldAutoApprove = true
			}
		} else if *auth.UserID != user.ID {
			observability.GetLogEntry(r).Entry.
				WithField("request_user_id", user.ID).
				WithField("authorization_id", auth.AuthorizationID).
				Warn("authorization belongs to different user")
			return apierrors.NewNotFoundError(apierrors.ErrorCodeOAuthAuthorizationNotFound, "authorization not found")
		}

		if shouldAutoApprove {
			if err := auth.Approve(tx); err != nil {
				return apierrors.NewInternalServerError("Error auto-approving authorization").WithInternalError(err)
			}
		}

		authorization = auth
		return nil
	})

	if err != nil {
		return err
	}

	observability.LogEntrySetField(r, "authorization_id", authorization.AuthorizationID)
	observability.LogEntrySetField(r, "client_id", authorization.ClientID.String())

	if shouldAutoApprove {
		observability.LogEntrySetField(r, "auto_approved", true)
		return shared.SendJSON(w, http.StatusOK, ConsentResponse{
			RedirectURL: s.buildSuccessRedirectURL(authorization),
		})
	}

	client, err := models.FindOAuthServerClientByID(db, authorization.ClientID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return apierrors.NewNotFoundError(apierrors.ErrorCodeOAuthAuthorizationNotFound, "authorization not found")
		}
		return apierrors.NewInternalServerError("error finding client").WithInternalError(err)
	}

	response := AuthorizationDetailsResponse{
		AuthorizationID: authorization.AuthorizationID,
		RedirectURI:     authorization.RedirectURI,
		Client: ClientDetailsResponse{
			ID:      client.ID.String(),
			Name:    utilities.StringValue(client.ClientName),
			URI:     utilities.StringValue(client.ClientURI),
			LogoURI: utilities.StringValue(client.LogoURI),
		},
		User: UserDetailsResponse{
			ID:    user.ID.String(),
			Email: user.Email.String(),
		},
		Scope: authorization.Scope,
	}

	return shared.SendJSON(w, http.StatusOK, response)
}

// OAuthServerConsent handles POST /oauth/authorizations/{authorization_id}/consent
func (s *Server) OAuthServerConsent(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := s.db.WithContext(ctx)

	// Validate request origin - the request must come from the site URL as we redirected there at the first place
	if err := s.validateRequestOrigin(r); err != nil {
		return err
	}

	// Get authenticated user
	user := shared.GetUser(ctx)
	if user == nil {
		return apierrors.NewForbiddenError(apierrors.ErrorCodeBadJWT, "authentication required")
	}

	var body ConsentRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeBadJSON, "invalid JSON body")
	}

	if body.Action != OAuthServerConsentActionApprove && body.Action != OAuthServerConsentActionDeny {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "action must be 'approve' or 'deny'")
	}

	authorizationID := chi.URLParam(r, "authorization_id")
	observability.LogEntrySetField(r, "authorization_id", authorizationID)
	if authorizationID == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "authorization_id is required")
	}

	// Row is locked FOR UPDATE SKIP LOCKED so concurrent approve/deny
	// requests for the same authorization are serialised and the ownership
	// check below can't race a SetUser from another request.
	var redirectURL string
	err := db.Transaction(func(tx *storage.Connection) error {
		authorization, err := models.FindOAuthServerAuthorizationByIDForUpdate(tx, authorizationID)
		if err != nil {
			if models.IsNotFoundError(err) {
				return apierrors.NewNotFoundError(apierrors.ErrorCodeOAuthAuthorizationNotFound, "authorization not found")
			}
			return apierrors.NewInternalServerError("error finding authorization").WithInternalError(err)
		}

		if authorization.IsExpired() {
			if merr := authorization.MarkExpired(tx); merr != nil {
				observability.GetLogEntry(r).Entry.WithError(merr).Warn("failed to mark authorization as expired")
				return apierrors.NewNotFoundError(apierrors.ErrorCodeOAuthAuthorizationNotFound, "authorization not found")
			}
			// Commit the MarkExpired update but still return not-found.
			return storage.NewCommitWithError(apierrors.NewNotFoundError(apierrors.ErrorCodeOAuthAuthorizationNotFound, "authorization not found"))
		}

		if authorization.Status != models.OAuthServerAuthorizationPending {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "authorization request is no longer pending")
		}

		if authorization.UserID == nil || *authorization.UserID != user.ID {
			observability.GetLogEntry(r).Entry.
				WithField("request_user_id", user.ID).
				WithField("authorization_id", authorization.AuthorizationID).
				Warn("authorization belongs to different user")
			return apierrors.NewNotFoundError(apierrors.ErrorCodeOAuthAuthorizationNotFound, "authorization not found")
		}

		if body.Action == OAuthServerConsentActionApprove {
			// Approve authorization
			if err := authorization.Approve(tx); err != nil {
				return apierrors.NewInternalServerError("error approving authorization").WithInternalError(err)
			}

			// Store consent for future use
			scopes := authorization.GetScopeList()
			consent := models.NewOAuthServerConsent(user.ID, authorization.ClientID, scopes)
			if err := models.UpsertOAuthServerConsent(tx, consent); err != nil {
				return apierrors.NewInternalServerError("error storing consent").WithInternalError(err)
			}

			// Build success redirect URL
			redirectURL = s.buildSuccessRedirectURL(authorization)

			observability.LogEntrySetField(r, "oauth_consent_action", string(OAuthServerConsentActionApprove))

		} else {
			// Deny authorization
			if err := authorization.Deny(tx); err != nil {
				return apierrors.NewInternalServerError("error denying authorization").WithInternalError(err)
			}

			// Build error redirect URL
			// Errors are being returned to the client in the redirect url per OAuth2 spec
			var state string
			if authorization.State != nil {
				state = *authorization.State
			}
			redirectURL = s.buildErrorRedirectURL(authorization.RedirectURI, oAuth2ErrorAccessDenied, "User denied the request", state)

			observability.LogEntrySetField(r, "oauth_consent_action", string(OAuthServerConsentActionDeny))
		}

		return nil
	})

	if err != nil {
		return err
	}

	// Return redirect URL to frontend
	response := ConsentResponse{
		RedirectURL: redirectURL,
	}

	return shared.SendJSON(w, http.StatusOK, response)
}

// Helper functions

// validateRequestOrigin checks if the request is coming from an authorized origin
func (s *Server) validateRequestOrigin(r *http.Request) error {
	// Check Origin header
	// browsers add this header by default, we can at least prevent some basic cross-origin attacks
	origin := r.Header.Get("Origin")
	if origin == "" {
		// Empty Origin header is ok (e.g., for backend-originated requests or mobile apps)
		return nil
	}

	if !utilities.IsRedirectURLValid(s.config, origin) {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "unauthorized request origin")
	}

	return nil
}

// validateBasicAuthorizeParams validates only client_id and redirect_uri (needed before we can redirect errors)
func (s *Server) validateBasicAuthorizeParams(params *AuthorizeParams) (*AuthorizeParams, error) {
	if params.ClientID == "" {
		return nil, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "client_id is required")
	}
	if params.RedirectURI == "" {
		return nil, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "redirect_uri is required")
	}

	return params, nil
}

// validateRemainingAuthorizeParams validates all other parameters (can redirect errors since we have valid client + redirect_uri)
func (s *Server) validateRemainingAuthorizeParams(params *AuthorizeParams) error {
	if params.ResponseType == "" {
		params.ResponseType = models.OAuthServerResponseTypeCode.String()
	}
	if params.Scope == "" {
		params.Scope = s.config.OAuthServer.DefaultScope
	}

	// OAuth 2.1 only supports "code" response type
	if params.ResponseType != models.OAuthServerResponseTypeCode.String() {
		return errors.New("only response_type=code is supported")
	}

	// Validate scopes
	if err := s.validateScopes(params.Scope); err != nil {
		return err
	}

	// Resource parameter validation (per RFC 8707)
	if err := s.validateResourceParam(params.Resource); err != nil {
		return err
	}

	// PKCE validation
	if err := s.validatePKCEParams(params.CodeChallengeMethod, params.CodeChallenge); err != nil {
		return err
	}

	return nil
}

func (s *Server) validatePKCEParams(codeChallengeMethod, codeChallenge string) error {
	// PKCE is mandatory for the authorization code flow OAuth2.1
	// Both code_challenge and code_challenge_method must be provided together
	if codeChallenge == "" || codeChallengeMethod == "" {
		return errors.New("PKCE flow requires both code_challenge and code_challenge_method")
	}

	// Validate code challenge method (case-insensitive)
	if strings.ToLower(codeChallengeMethod) != "s256" && strings.ToLower(codeChallengeMethod) != "plain" {
		return errors.New("code_challenge_method must be 'S256' or 'plain'")
	}

	// Validate code challenge format and length (per OAuth2 spec)
	if len(codeChallenge) < 43 || len(codeChallenge) > 128 {
		return errors.New("code_challenge must be between 43 and 128 characters")
	}

	return nil
}

// validateResourceParam validates the resource parameter per RFC 8707
func (s *Server) validateResourceParam(resource string) error {
	// Resource parameter is optional
	if resource == "" {
		return nil
	}

	// Parse URL to validate it's an absolute URI
	parsedURL, err := url.Parse(resource)
	if err != nil {
		return errors.New("resource must be a valid URI")
	}

	// Must be an absolute URI (have scheme)
	if !parsedURL.IsAbs() {
		return errors.New("resource must be an absolute URI")
	}

	// Must not include a fragment component
	if parsedURL.Fragment != "" {
		return errors.New("resource must not include a fragment component")
	}

	// Should not include a query component
	if parsedURL.RawQuery != "" {
		return errors.New("resource must not include a query component")
	}

	return nil
}

// validateScopes validates the requested scopes
func (s *Server) validateScopes(scopeString string) error {
	if scopeString == "" {
		return errors.New("scope parameter is required")
	}

	scopes := models.ParseScopeString(scopeString)
	if len(scopes) == 0 {
		return errors.New("scope parameter cannot be empty")
	}

	// Validate each scope against the centrally defined supported scopes
	for _, scope := range scopes {
		if !models.IsSupportedScope(scope) {
			return fmt.Errorf("unsupported scope: %s", scope)
		}
	}

	return nil
}

func (s *Server) isValidRedirectURI(client *models.OAuthServerClient, redirectURI string) bool {
	registeredURIs := client.GetRedirectURIs()
	for _, registeredURI := range registeredURIs {
		// exact string matching per OAuth2 spec
		if registeredURI == redirectURI {
			return true
		}
	}
	return false
}

func (s *Server) consentCoversScopes(consent *models.OAuthServerConsent, requestedScope string) bool {
	if consent.IsRevoked() {
		return false
	}

	requestedScopes := models.ParseScopeString(requestedScope)
	return consent.HasAllScopes(requestedScopes)
}

func (s *Server) buildSuccessRedirectURL(authorization *models.OAuthServerAuthorization) string {
	u, _ := url.Parse(authorization.RedirectURI)
	q := u.Query()
	if authorization.AuthorizationCode != nil {
		q.Set("code", *authorization.AuthorizationCode)
	}
	if authorization.State != nil && *authorization.State != "" {
		q.Set("state", *authorization.State)
	}
	u.RawQuery = q.Encode()
	return u.String()
}

// buildErrorRedirectURL builds an error redirect URL with the given parameters
func (s *Server) buildErrorRedirectURL(redirectURI, errorCode, errorDescription, state string) string {
	u, _ := url.Parse(redirectURI)
	q := u.Query()
	q.Set("error", errorCode)
	q.Set("error_description", errorDescription)
	if state != "" {
		q.Set("state", state)
	}
	u.RawQuery = q.Encode()
	return u.String()
}

// buildAuthorizationURL safely joins a base URL with a path, handling slashes correctly
func (s *Server) buildAuthorizationURL(baseURL, pathToJoin string) string {
	// Trim trailing slash from baseURL
	baseURL = strings.TrimRight(baseURL, "/")

	// Ensure pathToJoin starts with a slash
	if !strings.HasPrefix(pathToJoin, "/") {
		pathToJoin = "/" + pathToJoin
	}

	return baseURL + pathToJoin
}
