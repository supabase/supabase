package api

import (
	"context"
	"net/http"
	"slices"
	"strings"

	"github.com/go-chi/chi/v5"
	popslices "github.com/gobuffalo/pop/v6/slices"
	"github.com/gofrs/uuid"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/observability"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/utilities"
)

// TODO: Admin Audit Logging for Custom OAuth/OIDC Providers
//
// Current state: No audit logging is implemented for provider management operations.
//
// Why: The existing audit logging system (models.NewAuditLogEntry) is designed for
// user-centric actions where there's always a "user actor" performing an action.
// Admin infrastructure operations like provider management are different:
// - They're admin-only configuration changes
// - They don't have a regular "user" as the actor (it's an admin/operator)
// - They need different metadata (who made the change, what was changed, when, from where)
//
// What's needed:
// 1. Design a separate admin audit log system or extend the existing one
// 2. Consider what should be logged:
//    - WHO: Admin identifier (could be service role, API key, or admin user)
//    - WHAT: Operation (create/update/delete provider)
//    - WHEN: Timestamp
//    - WHERE: IP address, request ID
//    - DETAILS: Provider identifier, what changed (for updates)
// 3. Consider compliance requirements (SOC2, GDPR, etc.)
// 4. Decide on storage (same audit_log_entries table or separate table?)
//
// For now, all create/update/delete operations have TODO comments where audit
// logging should be added once the design is finalized.

// AdminCustomOAuthProviderParams defines parameters for creating/updating providers
type AdminCustomOAuthProviderParams struct {
	// Common fields
	ProviderType        string                 `json:"provider_type"` // "oauth2" or "oidc"
	Identifier          string                 `json:"identifier"`
	Name                string                 `json:"name"`
	ClientID            string                 `json:"client_id"`
	ClientSecret        string                 `json:"client_secret"`
	AcceptableClientIDs []string               `json:"acceptable_client_ids,omitempty"`
	Scopes              []string               `json:"scopes"`
	PKCEEnabled         *bool                  `json:"pkce_enabled,omitempty"`
	AttributeMapping    map[string]interface{} `json:"attribute_mapping,omitempty"`
	// CustomClaimsAllowlist lists raw IdP claim keys to copy verbatim into custom_claims.
	CustomClaimsAllowlist []string               `json:"custom_claims_allowlist,omitempty"`
	AuthorizationParams   map[string]interface{} `json:"authorization_params,omitempty"`
	Enabled               *bool                  `json:"enabled,omitempty"`
	EmailOptional         *bool                  `json:"email_optional,omitempty"`

	// OIDC-specific fields
	Issuer         string  `json:"issuer,omitempty"`
	DiscoveryURL   *string `json:"discovery_url,omitempty"`
	SkipNonceCheck *bool   `json:"skip_nonce_check,omitempty"`

	// OAuth2-specific fields
	AuthorizationURL string  `json:"authorization_url,omitempty"`
	TokenURL         string  `json:"token_url,omitempty"`
	UserinfoURL      string  `json:"userinfo_url,omitempty"`
	JwksURI          *string `json:"jwks_uri,omitempty"`
}

// adminCustomOAuthProvidersList returns all custom OAuth/OIDC providers
func (a *API) adminCustomOAuthProvidersList(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)

	// Check for optional type filter
	providerTypeParam := r.URL.Query().Get("type")
	var providers []*models.CustomOAuthProvider
	var err error

	if providerTypeParam != "" {
		// Validate type parameter
		providerType := models.ProviderType(providerTypeParam)
		if providerType != models.ProviderTypeOAuth2 && providerType != models.ProviderTypeOIDC {
			return apierrors.NewBadRequestError(
				apierrors.ErrorCodeValidationFailed,
				"type must be either 'oauth2' or 'oidc'",
			)
		}
		providers, err = models.FindAllCustomOAuthProvidersByType(db, providerType)
	} else {
		providers, err = models.FindAllCustomOAuthProviders(db)
	}

	if err != nil {
		return apierrors.NewInternalServerError("Error retrieving custom OAuth providers").WithInternalError(err)
	}

	if providers == nil {
		providers = []*models.CustomOAuthProvider{}
	}

	return sendJSON(w, http.StatusOK, map[string]interface{}{
		"providers": providers,
	})
}

// adminCustomOAuthProviderGet returns a single custom OAuth/OIDC provider
func (a *API) adminCustomOAuthProviderGet(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)

	identifier := chi.URLParam(r, "identifier")
	if identifier == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "identifier is required")
	}

	if !strings.HasPrefix(identifier, "custom:") {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "identifier must start with 'custom:' prefix, e.g. 'custom:%s'", identifier)
	}

	observability.LogEntrySetField(r, "identifier", identifier)

	provider, err := models.FindCustomOAuthProviderByIdentifier(db, identifier)
	if err != nil {
		if models.IsNotFoundError(err) {
			return apierrors.NewNotFoundError(apierrors.ErrorCodeCustomProviderNotFound, "Custom OAuth provider not found")
		}
		return apierrors.NewInternalServerError("Error retrieving custom OAuth provider").WithInternalError(err)
	}

	return sendJSON(w, http.StatusOK, provider)
}

// adminCustomOAuthProviderCreate creates a new custom OAuth/OIDC provider
func (a *API) adminCustomOAuthProviderCreate(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)
	config := a.config

	// Parse request parameters
	params := &AdminCustomOAuthProviderParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	// Validate provider type
	if params.ProviderType != string(models.ProviderTypeOAuth2) && params.ProviderType != string(models.ProviderTypeOIDC) {
		return apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"provider_type must be either 'oauth2' or 'oidc'",
		)
	}

	providerType := models.ProviderType(params.ProviderType)

	// Validate type-specific required fields
	if err := validateProviderParams(params, providerType); err != nil {
		return err
	}

	// Validate authorization params (no reserved OAuth parameters)
	if err := validateAuthorizationParams(params.AuthorizationParams); err != nil {
		return err
	}

	// Validate attribute mapping (no protected system fields)
	if err := validateAttributeMapping(params.AttributeMapping); err != nil {
		return err
	}

	// Validate custom claims allowlist (non-empty source keys)
	if err := validateCustomClaimsAllowlist(params.CustomClaimsAllowlist); err != nil {
		return err
	}

	// Check quota if configured
	if config.CustomOAuth.MaxProviders > 0 {
		totalCount, err := models.CountCustomOAuthProviders(db)
		if err != nil {
			return apierrors.NewInternalServerError("Error checking provider quota").WithInternalError(err)
		}
		if totalCount >= config.CustomOAuth.MaxProviders {
			return apierrors.NewBadRequestError(
				apierrors.ErrorCodeOverCustomProviderQuota,
				"Maximum number of custom OAuth/OIDC providers reached",
			)
		}
	}

	// Validate URLs based on provider type
	if err := validateProviderURLs(params, providerType); err != nil {
		return err
	}

	// Check if provider with this identifier already exists
	existingProvider, err := models.FindCustomOAuthProviderByIdentifier(db, params.Identifier)
	if err != nil && !models.IsNotFoundError(err) {
		return apierrors.NewInternalServerError("Error checking for existing provider").WithInternalError(err)
	}
	if existingProvider != nil {
		return apierrors.NewBadRequestError(
			apierrors.ErrorCodeConflict,
			"A custom OAuth provider with this identifier already exists",
		)
	}

	// Create provider model
	provider := buildProviderFromParams(params, providerType)

	// For OIDC providers, fetch and validate the discovery document before persisting.
	// This catches misconfigurations (bad issuer URL, missing endpoints) at admin time
	// rather than failing silently at user login time.
	if providerType == models.ProviderTypeOIDC {
		discovery, err := fetchAndValidateDiscovery(ctx, provider.GetDiscoveryURL(), params.Issuer)
		if err != nil {
			return err
		}
		provider.SetDiscoveryCache(discovery)
	}

	// Encrypt and store client secret
	if err := provider.SetClientSecret(params.ClientSecret, config.Security.DBEncryption); err != nil {
		return apierrors.NewInternalServerError("Error encrypting custom OAuth provider client secret").WithInternalError(err)
	}

	// Create in database
	err = db.Transaction(func(tx *storage.Connection) error {
		if terr := models.CreateCustomOAuthProvider(tx, provider); terr != nil {
			return terr
		}

		// TODO: Implement proper admin audit logging for infrastructure changes
		// The current audit log is user-centric. We need a separate audit mechanism
		// for admin operations like provider management that doesn't require a "user actor"
		// but tracks admin API changes for security and compliance.

		return nil
	})

	if err != nil {
		return apierrors.NewInternalServerError("Error creating custom OAuth provider").WithInternalError(err)
	}

	return sendJSON(w, http.StatusCreated, provider)
}

// adminCustomOAuthProviderUpdate updates an existing custom OAuth/OIDC provider
func (a *API) adminCustomOAuthProviderUpdate(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)
	config := a.config

	identifier := chi.URLParam(r, "identifier")
	if identifier == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "identifier is required")
	}

	if !strings.HasPrefix(identifier, "custom:") {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "identifier must start with 'custom:' prefix, e.g. 'custom:%s'", identifier)
	}

	observability.LogEntrySetField(r, "identifier", identifier)

	// Parse request parameters
	params := &AdminCustomOAuthProviderParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	// Validate authorization params if provided
	if params.AuthorizationParams != nil {
		if err := validateAuthorizationParams(params.AuthorizationParams); err != nil {
			return err
		}
	}

	// Validate attribute mapping if provided
	if params.AttributeMapping != nil {
		if err := validateAttributeMapping(params.AttributeMapping); err != nil {
			return err
		}
	}

	// Validate custom claims allowlist if provided
	if params.CustomClaimsAllowlist != nil {
		if err := validateCustomClaimsAllowlist(params.CustomClaimsAllowlist); err != nil {
			return err
		}
	}

	// Read the existing provider outside the write transaction so the
	// network call (discovery fetch) doesn't hold a transaction open.
	provider, err := models.FindCustomOAuthProviderByIdentifier(db, identifier)
	if err != nil {
		if models.IsNotFoundError(err) {
			return apierrors.NewNotFoundError(apierrors.ErrorCodeCustomProviderNotFound, "Custom OAuth provider not found")
		}
		return apierrors.NewInternalServerError("Error retrieving custom OAuth provider").WithInternalError(err)
	}

	// Capture the current issuer before applying updates so we can
	// invalidate the in-memory cache if it changes.
	var oldIssuer string
	if provider.IsOIDC() && provider.Issuer != nil {
		oldIssuer = *provider.Issuer
	}

	// Update provider with new non-secret values
	if err := updateProviderFromParams(provider, params); err != nil {
		return err
	}

	// For OIDC providers, re-validate discovery when the issuer or discovery URL changes.
	// This network call happens outside the transaction to avoid holding it open.
	if provider.IsOIDC() && (params.Issuer != "" || params.DiscoveryURL != nil) {
		discovery, err := fetchAndValidateDiscovery(ctx, provider.GetDiscoveryURL(), *provider.Issuer)
		if err != nil {
			return err
		}
		provider.SetDiscoveryCache(discovery)
	}

	// If a new client secret is provided, encrypt and store it
	if params.ClientSecret != "" {
		if err := provider.SetClientSecret(params.ClientSecret, config.Security.DBEncryption); err != nil {
			return apierrors.NewInternalServerError("Error encrypting custom OAuth provider client secret").WithInternalError(err)
		}
	}

	err = db.Transaction(func(tx *storage.Connection) error {
		if terr := models.UpdateCustomOAuthProvider(tx, provider); terr != nil {
			return apierrors.NewInternalServerError("Error updating custom OAuth provider").WithInternalError(terr)
		}

		// TODO: Add admin audit logging here (see create endpoint for details)

		return nil
	})

	if err != nil {
		return err
	}

	// Invalidate in-memory OIDC cache if the issuer changed or discovery was refreshed,
	// so the next auth request picks up the new configuration.
	if provider.IsOIDC() && provider.Issuer != nil {
		if oldIssuer != "" && oldIssuer != *provider.Issuer {
			a.oidcCache.Invalidate(oldIssuer)
		}
		if params.Issuer != "" || params.DiscoveryURL != nil {
			a.oidcCache.Invalidate(*provider.Issuer)
		}
	}

	return sendJSON(w, http.StatusOK, provider)
}

// adminCustomOAuthProviderDelete deletes a custom OAuth/OIDC provider
func (a *API) adminCustomOAuthProviderDelete(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)

	identifier := chi.URLParam(r, "identifier")
	if identifier == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "identifier is required")
	}

	if !strings.HasPrefix(identifier, "custom:") {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "identifier must start with 'custom:' prefix, e.g. 'custom:%s'", identifier)
	}

	observability.LogEntrySetField(r, "identifier", identifier)

	var issuerToInvalidate string
	err := db.Transaction(func(tx *storage.Connection) error {
		provider, terr := models.FindCustomOAuthProviderByIdentifier(tx, identifier)
		if terr != nil {
			if models.IsNotFoundError(terr) {
				return apierrors.NewNotFoundError(apierrors.ErrorCodeCustomProviderNotFound, "Custom OAuth provider not found")
			}
			return apierrors.NewInternalServerError("Error retrieving custom OAuth provider").WithInternalError(terr)
		}

		if provider.IsOIDC() && provider.Issuer != nil {
			issuerToInvalidate = *provider.Issuer
		}

		// TODO: Add admin audit logging here (see create endpoint for details)

		if terr := models.DeleteCustomOAuthProvider(tx, provider.ID); terr != nil {
			return apierrors.NewInternalServerError("Error deleting custom OAuth provider").WithInternalError(terr)
		}

		return nil
	})

	if err != nil {
		return err
	}

	if issuerToInvalidate != "" {
		a.oidcCache.Invalidate(issuerToInvalidate)
	}

	w.WriteHeader(http.StatusNoContent)
	return nil
}

// validateProviderParams validates type-specific required fields
func validateProviderParams(params *AdminCustomOAuthProviderParams, providerType models.ProviderType) error {
	// Common validations
	if params.Identifier == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "identifier is required")
	}

	if !strings.HasPrefix(params.Identifier, "custom:") {
		return apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"identifier must start with 'custom:' prefix, e.g. 'custom:%s'",
			params.Identifier,
		)
	}

	if params.Name == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "name is required")
	}
	if params.ClientID == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "client_id is required")
	}
	if params.ClientSecret == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "client_secret is required")
	}

	// Type-specific validations
	switch providerType {
	case models.ProviderTypeOIDC:
		if params.Issuer == "" {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "issuer is required for OIDC providers")
		}
	case models.ProviderTypeOAuth2:
		if params.AuthorizationURL == "" {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "authorization_url is required for OAuth2 providers")
		}
		if params.TokenURL == "" {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "token_url is required for OAuth2 providers")
		}
		if params.UserinfoURL == "" {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "userinfo_url is required for OAuth2 providers")
		}
	}

	return nil
}

// validateProviderURLs validates URLs with SSRF protection
func validateProviderURLs(params *AdminCustomOAuthProviderParams, providerType models.ProviderType) error {
	var urls []string

	switch providerType {
	case models.ProviderTypeOIDC:
		urls = append(urls, params.Issuer)
		if params.DiscoveryURL != nil && *params.DiscoveryURL != "" {
			urls = append(urls, *params.DiscoveryURL)
		}
	case models.ProviderTypeOAuth2:
		urls = []string{
			params.AuthorizationURL,
			params.TokenURL,
			params.UserinfoURL,
		}
		if params.JwksURI != nil && *params.JwksURI != "" {
			urls = append(urls, *params.JwksURI)
		}
	}

	for _, urlStr := range urls {
		if urlStr != "" {
			if err := utilities.ValidateOAuthURL(urlStr); err != nil {
				return err
			}
		}
	}

	return nil
}

// buildProviderFromParams creates a provider model from params
func buildProviderFromParams(params *AdminCustomOAuthProviderParams, providerType models.ProviderType) *models.CustomOAuthProvider {
	// Generate ID upfront so it's available for client secret encryption (used as AAD)
	id, _ := uuid.NewV4()
	provider := &models.CustomOAuthProvider{
		ID:                    id,
		ProviderType:          providerType,
		Identifier:            params.Identifier,
		Name:                  params.Name,
		ClientID:              params.ClientID,
		AcceptableClientIDs:   popslices.String(params.AcceptableClientIDs),
		Scopes:                popslices.String(params.Scopes),
		PKCEEnabled:           getBoolOrDefault(params.PKCEEnabled, true),
		AttributeMapping:      popslices.Map(params.AttributeMapping),
		CustomClaimsAllowlist: popslices.String(params.CustomClaimsAllowlist),
		AuthorizationParams:   popslices.Map(params.AuthorizationParams),
		Enabled:               getBoolOrDefault(params.Enabled, true),
		EmailOptional:         getBoolOrDefault(params.EmailOptional, false),
	}

	// Set type-specific fields
	if providerType == models.ProviderTypeOIDC {
		provider.Issuer = &params.Issuer
		provider.DiscoveryURL = params.DiscoveryURL
		provider.SkipNonceCheck = getBoolOrDefault(params.SkipNonceCheck, false)

		// Ensure openid scope is present for OIDC
		hasOpenID := false
		for _, scope := range provider.Scopes {
			if scope == "openid" {
				hasOpenID = true
				break
			}
		}
		if !hasOpenID {
			provider.Scopes = append(popslices.String{"openid"}, provider.Scopes...)
		}
	} else if providerType == models.ProviderTypeOAuth2 {
		provider.AuthorizationURL = &params.AuthorizationURL
		provider.TokenURL = &params.TokenURL
		provider.UserinfoURL = &params.UserinfoURL
		provider.JwksURI = params.JwksURI
	}

	// Initialize empty maps if nil
	if provider.AttributeMapping == nil {
		provider.AttributeMapping = make(popslices.Map)
	}
	if provider.AuthorizationParams == nil {
		provider.AuthorizationParams = make(popslices.Map)
	}

	return provider
}

// updateProviderFromParams updates a provider model from params
func updateProviderFromParams(provider *models.CustomOAuthProvider, params *AdminCustomOAuthProviderParams) error {
	// Update common fields
	if params.Name != "" {
		provider.Name = params.Name
	}
	if params.ClientID != "" {
		provider.ClientID = params.ClientID
	}
	if params.AcceptableClientIDs != nil {
		provider.AcceptableClientIDs = popslices.String(params.AcceptableClientIDs)
	}
	if params.Scopes != nil {
		provider.Scopes = popslices.String(params.Scopes)
		// Ensure openid scope for OIDC
		if provider.IsOIDC() {
			hasOpenID := false
			for _, scope := range provider.Scopes {
				if scope == "openid" {
					hasOpenID = true
					break
				}
			}
			if !hasOpenID {
				provider.Scopes = append(popslices.String{"openid"}, provider.Scopes...)
			}
		}
	}
	if params.PKCEEnabled != nil {
		provider.PKCEEnabled = *params.PKCEEnabled
	}
	if params.AttributeMapping != nil {
		provider.AttributeMapping = popslices.Map(params.AttributeMapping)
	}
	if params.CustomClaimsAllowlist != nil {
		provider.CustomClaimsAllowlist = popslices.String(params.CustomClaimsAllowlist)
	}
	if params.AuthorizationParams != nil {
		provider.AuthorizationParams = popslices.Map(params.AuthorizationParams)
	}
	if params.Enabled != nil {
		provider.Enabled = *params.Enabled
	}
	if params.EmailOptional != nil {
		provider.EmailOptional = *params.EmailOptional
	}

	// Update type-specific fields
	if provider.IsOIDC() {
		if params.Issuer != "" {
			if err := utilities.ValidateOAuthURL(params.Issuer); err != nil {
				return err
			}
			provider.Issuer = &params.Issuer
		}
		if params.DiscoveryURL != nil && *params.DiscoveryURL != "" {
			if err := utilities.ValidateOAuthURL(*params.DiscoveryURL); err != nil {
				return err
			}
			provider.DiscoveryURL = params.DiscoveryURL
		}
		if params.SkipNonceCheck != nil {
			provider.SkipNonceCheck = *params.SkipNonceCheck
		}
	} else if provider.IsOAuth2() {
		if params.AuthorizationURL != "" {
			if err := utilities.ValidateOAuthURL(params.AuthorizationURL); err != nil {
				return err
			}
			provider.AuthorizationURL = &params.AuthorizationURL
		}
		if params.TokenURL != "" {
			if err := utilities.ValidateOAuthURL(params.TokenURL); err != nil {
				return err
			}
			provider.TokenURL = &params.TokenURL
		}
		if params.UserinfoURL != "" {
			if err := utilities.ValidateOAuthURL(params.UserinfoURL); err != nil {
				return err
			}
			provider.UserinfoURL = &params.UserinfoURL
		}
		if params.JwksURI != nil && *params.JwksURI != "" {
			if err := utilities.ValidateOAuthURL(*params.JwksURI); err != nil {
				return err
			}
			provider.JwksURI = params.JwksURI
		}
	}

	return nil
}

// getBoolOrDefault returns the value or default if nil
func getBoolOrDefault(value *bool, defaultValue bool) bool {
	if value == nil {
		return defaultValue
	}
	return *value
}

// reservedOAuthParams lists OAuth2/OIDC parameters that the auth server
// controls. They must never be overridden by client-supplied input, since
// allowing override would be a security issue (e.g. swapping redirect_uri or
// state). nonce is reserved here so it can't be pinned to a static value in a
// provider's stored authorization_params; it is still allowed as a per-request
// passthrough on the external redirect (see external.go).
var reservedOAuthParams = []string{
	"client_id",
	"client_secret",
	"redirect_uri",
	"response_type",
	"state",
	"code_challenge",
	"code_challenge_method",
	"code_verifier",
	"nonce",
}

// validateAuthorizationParams ensures no reserved OAuth parameters are overridden
func validateAuthorizationParams(params map[string]interface{}) error {
	if params == nil {
		return nil
	}

	for key, value := range params {
		if slices.Contains(reservedOAuthParams, key) {
			return apierrors.NewBadRequestError(
				apierrors.ErrorCodeValidationFailed,
				"Cannot override reserved OAuth parameter: %s", key,
			)
		}
		if _, ok := value.(string); !ok {
			return apierrors.NewBadRequestError(
				apierrors.ErrorCodeValidationFailed,
				"Authorization parameter %q must be a string", key,
			)
		}
	}

	return nil
}

// fetchAndValidateDiscovery fetches the OIDC discovery document via the shared
// utility, then applies admin-only validation: required fields per the OpenID
// Connect Discovery 1.0 spec must be present before we persist the document.
// Returns *models.OIDCDiscovery so the caller can store it directly.
func fetchAndValidateDiscovery(ctx context.Context, discoveryURL, expectedIssuer string) (*models.OIDCDiscovery, error) {
	doc, err := utilities.FetchAndValidateOIDCDiscovery(ctx, discoveryURL, expectedIssuer)
	if err != nil {
		return nil, apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"OIDC discovery from %q failed: %v", discoveryURL, err,
		)
	}

	// Validate required fields per OpenID Connect Discovery 1.0 spec.
	// Stricter than the runtime path needs — runtime can tolerate missing
	// fields and surface a less helpful error at login; admin should reject
	// the configuration up front.
	var missing []string
	if doc.Issuer == "" {
		missing = append(missing, "issuer")
	}
	if doc.AuthorizationEndpoint == "" {
		missing = append(missing, "authorization_endpoint")
	}
	if doc.TokenEndpoint == "" {
		missing = append(missing, "token_endpoint")
	}
	if doc.JwksURI == "" {
		missing = append(missing, "jwks_uri")
	}
	if len(missing) > 0 {
		return nil, apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"OIDC discovery document is missing required fields: %s", strings.Join(missing, ", "),
		)
	}

	return &models.OIDCDiscovery{
		Issuer:                 doc.Issuer,
		AuthorizationEndpoint:  doc.AuthorizationEndpoint,
		TokenEndpoint:          doc.TokenEndpoint,
		UserinfoEndpoint:       doc.UserinfoEndpoint,
		JwksURI:                doc.JwksURI,
		ScopesSupported:        doc.ScopesSupported,
		ResponseTypesSupported: doc.ResponseTypesSupported,
		GrantTypesSupported:    doc.GrantTypesSupported,
		SubjectTypesSupported:  doc.SubjectTypesSupported,
	}, nil
}

// validateAttributeMapping ensures no sensitive system fields are targeted
func validateAttributeMapping(mapping map[string]interface{}) error {
	if mapping == nil {
		return nil
	}

	// System fields that should never be populated from external providers
	// Allowing these could lead to privilege escalation or security bypass
	blockedTargets := []string{
		"id",           // User UUID - system generated
		"aud",          // JWT audience - system controlled
		"role",         // User role - should be managed via database, not external provider
		"app_metadata", // Admin-only metadata - not for external providers
		"created_at",   // System timestamp
		"updated_at",   // System timestamp
		"confirmed_at", // Email confirmation - system controlled
		"email_confirmed_at",
		"phone_confirmed_at",
		"email_verified", // Email verification status - should come from provider, not be overridden
		"phone_verified", // Phone verification status - should come from provider, not be overridden
		"banned_until",   // Security field - system controlled
		"is_super_admin", // Admin flag - system controlled
	}

	for targetField := range mapping {
		if slices.Contains(blockedTargets, targetField) {
			return apierrors.NewBadRequestError(
				apierrors.ErrorCodeValidationFailed,
				"Cannot map to protected system field: %s", targetField,
			)
		}
	}

	return nil
}

// validateCustomClaimsAllowlist ensures every allowlist entry is a non-empty
// source claim key. Unlike attribute_mapping, these are opaque source keys
// copied into custom_claims (not typed targets)
func validateCustomClaimsAllowlist(allowlist []string) error {
	for _, key := range allowlist {
		if strings.TrimSpace(key) == "" {
			return apierrors.NewBadRequestError(
				apierrors.ErrorCodeValidationFailed,
				"custom_claims_allowlist entries must be non-empty strings",
			)
		}
	}

	return nil
}
