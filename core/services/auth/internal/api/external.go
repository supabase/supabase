package api

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"time"

	"github.com/fatih/structs"
	"github.com/gofrs/uuid"
	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/provider"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/metering"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/observability"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/utilities"
	"golang.org/x/oauth2"
)

// ExternalProviderRedirect redirects the request to the oauth provider
func (a *API) ExternalProviderRedirect(w http.ResponseWriter, r *http.Request) error {
	rurl, err := a.GetExternalProviderRedirectURL(w, r, nil)
	if err != nil {
		return err
	}
	http.Redirect(w, r, rurl, http.StatusFound) // #nosec G710
	return nil
}

// GetExternalProviderRedirectURL returns the URL to start the oauth flow with the corresponding oauth provider
func (a *API) GetExternalProviderRedirectURL(w http.ResponseWriter, r *http.Request, linkingTargetUser *models.User) (string, error) {
	ctx := r.Context()
	db := a.db.WithContext(ctx)
	config := a.config

	query := r.URL.Query()
	providerType := query.Get("provider")
	scopes := query.Get("scopes")
	codeChallenge := query.Get("code_challenge")
	codeChallengeMethod := query.Get("code_challenge_method")

	p, pConfig, err := a.Provider(ctx, providerType, scopes)
	if err != nil {
		return "", apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Unsupported provider: %+v", err).WithInternalError(err)
	}

	inviteToken := query.Get("invite_token")
	if inviteToken != "" {
		_, userErr := models.FindUserByOneTimeToken(db, inviteToken, models.ConfirmationToken)
		if userErr != nil {
			if models.IsNotFoundError(userErr) {
				return "", apierrors.NewNotFoundError(apierrors.ErrorCodeUserNotFound, "User identified by token not found")
			}
			return "", apierrors.NewInternalServerError("Database error finding user").WithInternalError(userErr)
		}
	}

	redirectURL := utilities.GetReferrer(r, config)
	log := observability.GetLogEntry(r).Entry
	log.WithField("provider", providerType).Info("Redirecting to external provider")
	if err := validatePKCEParams(codeChallengeMethod, codeChallenge); err != nil {
		return "", err
	}

	authUrlParams := make([]oauth2.AuthCodeOption, 0)
	query.Del("scopes")
	query.Del("provider")
	// Strip OAuth params the auth server controls so a client cannot
	// override redirect_uri, state, code_challenge, etc. by passing them
	// lowercase query keys for the comparison, URL.Query keeps casing
	for key := range query {
		lowerKey := strings.ToLower(key)
		if lowerKey != "nonce" && slices.Contains(reservedOAuthParams, lowerKey) {
			query.Del(key)
		}
	}

	for key := range query {
		if key == "workos_provider" {
			// See https://workos.com/docs/reference/sso/authorize/get
			authUrlParams = append(authUrlParams, oauth2.SetAuthURLParam("provider", query.Get(key)))
		} else {
			authUrlParams = append(authUrlParams, oauth2.SetAuthURLParam(key, query.Get(key)))
		}
	}

	// Handle OAuthClientState for providers that require PKCE on their end
	var oauthClientStateID *uuid.UUID
	if oauthProvider, ok := p.(provider.OAuthProvider); ok && oauthProvider.RequiresPKCE() {
		codeVerifier := oauth2.GenerateVerifier()
		oauthClientState := models.NewOAuthClientState(providerType, &codeVerifier)
		err := db.Create(oauthClientState)
		if err != nil {
			return "", err
		}
		oauthClientStateID = &oauthClientState.ID
		authUrlParams = append(authUrlParams, oauth2.S256ChallengeOption(codeVerifier))
	}

	// Build flow state params with all context
	flowParams := models.FlowStateParams{
		ProviderType:         providerType,
		AuthenticationMethod: models.OAuth,
		CodeChallenge:        codeChallenge,
		CodeChallengeMethod:  codeChallengeMethod,
		InviteToken:          inviteToken,
		Referrer:             redirectURL,
		OAuthClientStateID:   oauthClientStateID,
		EmailOptional:        pConfig.EmailOptional,
	}

	if linkingTargetUser != nil {
		// this means that the user is performing manual linking
		flowParams.LinkingTargetID = &linkingTargetUser.ID
	}

	// Always create flow state for all flows (both PKCE and implicit)
	// The flow state ID is used as the state parameter instead of JWT
	flowState, err := models.NewFlowState(flowParams)
	if err != nil {
		return "", apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Invalid code_challenge_method").WithInternalError(err)
	}
	if err := db.Create(flowState); err != nil {
		return "", apierrors.NewInternalServerError("Error creating flow state").WithInternalError(err)
	}

	// Use the flow state ID as the state parameter (UUID format)
	authURL := p.AuthCodeURL(flowState.ID.String(), authUrlParams...)

	return authURL, nil
}

// ExternalProviderCallback handles the callback endpoint in the external oauth provider flow
func (a *API) ExternalProviderCallback(w http.ResponseWriter, r *http.Request) error {
	rurl := a.getExternalRedirectURL(r)
	u, err := url.Parse(rurl)
	if err != nil {
		return err
	}
	redirectErrors(a.internalExternalProviderCallback, w, r, u)
	return nil
}

func (a *API) handleOAuthCallback(r *http.Request) (*OAuthProviderData, error) {
	ctx := r.Context()
	providerType, _ := getExternalProviderType(ctx)

	var oAuthResponseData *OAuthProviderData
	var err error
	switch providerType {
	case TwitterProvider:
		// future OAuth1.0 providers will use this method
		oAuthResponseData, err = a.oAuth1Callback(ctx, providerType)
	default:
		oAuthResponseData, err = a.oAuthCallback(ctx, r, providerType)
	}
	if err != nil {
		return nil, err
	}
	return oAuthResponseData, nil
}

func (a *API) internalExternalProviderCallback(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)

	var grantParams models.GrantParams
	grantParams.FillGrantParams(r)

	providerType, emailOptional := getExternalProviderType(ctx)
	data, err := a.handleOAuthCallback(r)
	if err != nil {
		return err
	}

	userData := data.userData

	if len(userData.Emails) == 0 && !emailOptional {
		return apierrors.NewInternalServerError("Error getting user email from external provider")
	}

	userData.Metadata.EmailVerified = false
	for _, email := range userData.Emails {
		if email.Primary {
			userData.Metadata.Email = email.Email
			userData.Metadata.EmailVerified = email.Verified
			break
		} else {
			userData.Metadata.Email = email.Email
			userData.Metadata.EmailVerified = email.Verified
		}
	}
	providerAccessToken := data.token
	providerRefreshToken := data.refreshToken

	flowState := getFlowState(ctx)

	targetUser := getTargetUser(ctx)
	inviteToken := getInviteToken(ctx)
	if targetUser == nil && inviteToken == "" {
		if err := a.triggerBeforeUserCreatedExternal(
			r, db, userData, providerType); err != nil {
			return err
		}
	}

	var createdUser bool
	var user *models.User
	var token *AccessTokenResponse
	err = db.Transaction(func(tx *storage.Connection) error {
		var terr error
		if targetUser != nil {
			if user, terr = a.linkIdentityToUser(r, ctx, tx, userData, providerType); terr != nil {
				return terr
			}
		} else if inviteToken != "" {
			if user, terr = a.processInvite(r, tx, userData, inviteToken, providerType); terr != nil {
				return terr
			}
		} else {
			var decision models.AccountLinkingDecision
			if decision, user, terr = a.createAccountFromExternalIdentity(tx, r, userData, providerType, emailOptional); terr != nil {
				return terr
			}
			createdUser = decision == models.CreateAccount
		}
		if flowState != nil && flowState.IsPKCE() {
			// PKCE flow: update flow state with user ID and tokens
			// Re-fetch with FOR UPDATE lock inside the transaction to prevent concurrent claims
			if flowState, terr = models.FindFlowStateByIDForUpdate(tx, flowState.ID.String()); terr != nil {
				return terr
			}
			if flowState.UserID != nil {
				return apierrors.NewBadRequestError(apierrors.ErrorCodeFlowStateAlreadyUsed, "State has already been used")
			}
			flowState.ProviderAccessToken = providerAccessToken
			flowState.ProviderRefreshToken = providerRefreshToken
			flowState.UserID = &(user.ID)
			issueTime := time.Now()
			flowState.AuthCodeIssuedAt = &issueTime

			terr = tx.Update(flowState)
		} else {
			// Implicit flow: issue tokens directly
			token, terr = a.issueRefreshToken(r, w.Header(), tx, user, models.OAuth, grantParams)
			if terr == nil && flowState != nil {
				terr = tx.Destroy(flowState)
			}
		}

		if terr != nil {
			return apierrors.NewOAuthError("server_error", terr.Error())
		}
		return nil
	})
	if err != nil {
		return err
	}
	if createdUser {
		if err := a.triggerAfterUserCreated(r, db, user); err != nil {
			return err
		}
	}

	// Record login for analytics - only when token is issued (not during pkce authorize)
	if token != nil {
		metering.RecordLogin(metering.LoginTypeOAuth, user.ID, &metering.LoginData{
			Provider: providerType,
		})
	}

	rurl := a.getExternalRedirectURL(r)
	if flowState != nil && flowState.IsPKCE() {
		// PKCE flow: redirect with auth code
		rurl, err = a.prepPKCERedirectURL(rurl, *flowState.AuthCode)
		if err != nil {
			return err
		}
	} else if token != nil {
		q := url.Values{}
		q.Set("provider_token", providerAccessToken)
		// Because not all providers give out a refresh token
		// See corresponding OAuth2 spec: <https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1>
		if providerRefreshToken != "" {
			q.Set("provider_refresh_token", providerRefreshToken)
		}

		rurl = token.AsRedirectURL(rurl, q)

	}

	http.Redirect(w, r, rurl, http.StatusFound) // #nosec G710
	return nil
}

func (a *API) createAccountFromExternalIdentity(tx *storage.Connection, r *http.Request, userData *provider.UserProvidedData, providerType string, emailOptional bool) (models.AccountLinkingDecision, *models.User, error) {
	ctx := r.Context()
	aud := a.requestAud(ctx, r)
	config := a.config

	var user *models.User
	var identity *models.Identity
	var identityData map[string]interface{}
	if userData.Metadata != nil {
		identityData = structs.Map(userData.Metadata)
	}

	decision, terr := models.DetermineAccountLinking(tx, config, userData.Emails, aud, providerType, userData.Metadata.Subject)
	if terr != nil {
		return 0, nil, terr
	}

	switch decision.Decision {
	case models.LinkAccount:
		user = decision.User

		if identity, terr = a.createNewIdentity(tx, user, providerType, identityData); terr != nil {
			return 0, nil, terr
		}

		if terr = user.UpdateUserMetaData(tx, identityData); terr != nil {
			return 0, nil, terr
		}

		if terr = user.UpdateAppMetaDataProviders(tx); terr != nil {
			return 0, nil, terr
		}

		if terr = models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.IdentityLinkAction, utilities.GetIPAddress(r), map[string]any{
			"identity_id": identity.ID,
			"provider":    identity.Provider,
			"provider_id": identity.ProviderID,
		}); terr != nil {
			return 0, nil, terr
		}

	case models.CreateAccount:
		if config.DisableSignup {
			return 0, nil, apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeSignupDisabled, "Signups not allowed for this instance")
		}

		params := &SignupParams{
			Provider: providerType,
			Email:    decision.CandidateEmail.Email,
			Aud:      aud,
			Data:     identityData,
		}

		// This is a little bit of a hack. Let me explain: When
		// is_sso_user == true, it allows there to be different user
		// rows with the same email address. Initially it was added to
		// support SSO accounts, but at this point renaming the column
		// or adding a new one requires re-indexing the table which is
		// expensive and introduces a potentially unnecessary API
		// surface change. It therefore set to true for other linking
		// domains, not just SSO ones. This enables different linking
		// domains to co-exist, such as when using
		// GOTRUE_EXPERIMENTAL_PROVIDER_LINKING_DOMAINS="provider_a=social,provider_b=social".
		isSSOUser := decision.LinkingDomain != "default"

		// because params above sets no password, this method is not
		// computationally hard so it can be used within a database
		// transaction
		user, terr = params.ToUserModel(isSSOUser)
		if terr != nil {
			return 0, nil, terr
		}

		if user, terr = a.signupNewUser(tx, user); terr != nil {
			return 0, nil, terr
		}

		if identity, terr = a.createNewIdentity(tx, user, providerType, identityData); terr != nil {
			return 0, nil, terr
		}
		user.Identities = append(user.Identities, *identity)

	case models.AccountExists:
		user = decision.User
		identity = decision.Identities[0]

		identity.IdentityData = identityData
		if terr = tx.UpdateOnly(identity, "identity_data", "last_sign_in_at"); terr != nil {
			return 0, nil, terr
		}
		if terr = user.UpdateUserMetaData(tx, identityData); terr != nil {
			return 0, nil, terr
		}
		if terr = user.UpdateAppMetaDataProviders(tx); terr != nil {
			return 0, nil, terr
		}

	case models.MultipleAccounts:
		return 0, nil, apierrors.NewInternalServerError("Multiple accounts with the same email address in the same linking domain detected: %v", decision.LinkingDomain)

	default:
		return 0, nil, apierrors.NewInternalServerError("Unknown automatic linking decision: %v", decision.Decision)
	}

	if user.IsBanned() {
		return 0, nil, apierrors.NewForbiddenError(apierrors.ErrorCodeUserBanned, "User is banned")
	}

	hasEmails := providerType != Web3Provider && (!emailOptional || decision.CandidateEmail.Email != "")

	if hasEmails && !user.IsConfirmed() {
		// The user may have other unconfirmed email + password
		// combination, phone or oauth identities. These identities
		// need to be removed when a new oauth identity is being added
		// to prevent pre-account takeover attacks from happening.
		if terr = user.RemoveUnconfirmedIdentities(tx, identity); terr != nil {
			return 0, nil, apierrors.NewInternalServerError("Error updating user").WithInternalError(terr)
		}
		if decision.CandidateEmail.Verified || config.Mailer.Autoconfirm {
			if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.UserSignedUpAction, "", map[string]interface{}{
				"provider": providerType,
			}); terr != nil {
				return 0, nil, terr
			}
			// fall through to auto-confirm and issue token
			if terr = user.Confirm(tx); terr != nil {
				return 0, nil, apierrors.NewInternalServerError("Error updating user").WithInternalError(terr)
			}
		} else {
			emailConfirmationSent := false
			if decision.CandidateEmail.Email != "" {
				if terr = a.sendConfirmation(r, tx, user, models.ImplicitFlow); terr != nil {
					return 0, nil, terr
				}
				emailConfirmationSent = true
			}

			if !config.Mailer.AllowUnverifiedEmailSignIns {
				if emailConfirmationSent {
					err := apierrors.NewUnprocessableEntityError(
						apierrors.ErrorCodeProviderEmailNeedsVerification,
						"Unverified email with %v. A confirmation email has been sent to your %v email",
						providerType, providerType,
					)
					return 0, nil, storage.NewCommitWithError(err)
				}

				err := apierrors.NewUnprocessableEntityError(
					apierrors.ErrorCodeProviderEmailNeedsVerification,
					"Unverified email with %v. Verify the email with %v in order to sign in",
					providerType, providerType)
				return 0, nil, storage.NewCommitWithError(err)
			}
		}
	} else {
		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.LoginAction, "", map[string]interface{}{
			"provider": providerType,
		}); terr != nil {
			return 0, nil, terr
		}
	}

	return decision.Decision, user, nil
}

func (a *API) processInvite(r *http.Request, tx *storage.Connection, userData *provider.UserProvidedData, inviteToken, providerType string) (*models.User, error) {
	config := a.config

	user, err := models.FindUserByOneTimeToken(tx, inviteToken, models.ConfirmationToken)
	if err != nil {
		if models.IsNotFoundError(err) {
			return nil, apierrors.NewNotFoundError(apierrors.ErrorCodeInviteNotFound, "Invite not found")
		}
		return nil, apierrors.NewInternalServerError("Database error finding user").WithInternalError(err)
	}

	var emailData *provider.Email
	var emails []string
	for i, e := range userData.Emails {
		emails = append(emails, e.Email)
		if user.GetEmail() == e.Email {
			emailData = &userData.Emails[i]
			break
		}
	}

	if emailData == nil {
		return nil, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Invited email does not match emails from external provider").WithInternalMessage("invited=%s external=%s", user.Email, strings.Join(emails, ", "))
	}

	var identityData map[string]interface{}
	if userData.Metadata != nil {
		identityData = structs.Map(userData.Metadata)
	}
	identity, err := a.createNewIdentity(tx, user, providerType, identityData)
	if err != nil {
		return nil, err
	}
	if err := user.UpdateAppMetaData(tx, map[string]interface{}{
		"provider": providerType,
	}); err != nil {
		return nil, err
	}
	if err := user.UpdateAppMetaDataProviders(tx); err != nil {
		return nil, err
	}
	if err := user.UpdateUserMetaData(tx, identityData); err != nil {
		return nil, apierrors.NewInternalServerError("Database error updating user").WithInternalError(err)
	}

	if err := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.InviteAcceptedAction, "", map[string]interface{}{
		"provider": providerType,
	}); err != nil {
		return nil, err
	}

	// an account with a previously unconfirmed email + password
	// combination or phone may exist. so now that there is an
	// OAuth identity bound to this user, and since they have not
	// confirmed their email or phone, they are unaware that a
	// potentially malicious door exists into their account; thus
	// the password and phone needs to be removed.
	if err := user.RemoveUnconfirmedIdentities(tx, identity); err != nil {
		return nil, apierrors.NewInternalServerError("Error updating user").WithInternalError(err)
	}

	// confirm because they were able to respond to invite email
	if err := user.Confirm(tx); err != nil {
		return nil, err
	}
	return user, nil
}

func (a *API) loadExternalState(ctx context.Context, r *http.Request, db *storage.Connection) (context.Context, error) {
	var state string
	switch r.Method {
	case http.MethodPost:
		state = r.FormValue("state")
	default:
		state = r.URL.Query().Get("state")
	}
	if state == "" {
		return ctx, apierrors.NewBadRequestError(apierrors.ErrorCodeBadOAuthCallback, "OAuth state parameter missing")
	}

	stateUUID, err := uuid.FromString(state)
	if err != nil {
		return ctx, apierrors.NewBadRequestError(apierrors.ErrorCodeBadOAuthState, "OAuth state parameter is invalid")
	}

	return a.loadExternalStateFromUUID(ctx, db, stateUUID)
}

// loadExternalStateFromUUID loads OAuth state from a flow_state record (new UUID format)
func (a *API) loadExternalStateFromUUID(ctx context.Context, db *storage.Connection, stateID uuid.UUID) (context.Context, error) {
	config := a.config

	flowState, err := models.FindFlowStateByID(db, stateID.String())
	if models.IsNotFoundError(err) {
		return ctx, apierrors.NewBadRequestError(apierrors.ErrorCodeBadOAuthState, "OAuth state not found or expired")
	} else if err != nil {
		return ctx, apierrors.NewInternalServerError("Error loading flow state").WithInternalError(err)
	}

	// Check expiration
	if flowState.IsExpired(config.External.FlowStateExpiryDuration) {
		return ctx, apierrors.NewBadRequestError(apierrors.ErrorCodeBadOAuthState, "OAuth state has expired")
	}

	// UserID is nil at creation and set during callback, so non-nil means already consumed.
	if flowState.IsPKCE() && flowState.UserID != nil {
		return ctx, apierrors.NewBadRequestError(apierrors.ErrorCodeFlowStateAlreadyUsed, "State has already been used")
	}

	ctx = withExternalProviderType(ctx, flowState.ProviderType, flowState.EmailOptional)

	if flowState.InviteToken != nil && *flowState.InviteToken != "" {
		ctx = withInviteToken(ctx, *flowState.InviteToken)
	}
	if flowState.Referrer != nil && *flowState.Referrer != "" {
		ctx = withExternalReferrer(ctx, *flowState.Referrer)
	}
	if flowState.OAuthClientStateID != nil {
		ctx = withOAuthClientStateID(ctx, *flowState.OAuthClientStateID)
	}
	if flowState.LinkingTargetID != nil {
		u, err := models.FindUserByID(db, *flowState.LinkingTargetID)
		if err != nil {
			if models.IsNotFoundError(err) {
				return nil, apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeUserNotFound, "Linking target user not found")
			}
			return nil, apierrors.NewInternalServerError("Database error loading user").WithInternalError(err)
		}
		ctx = withTargetUser(ctx, u)
	}

	// Store the entire flow state in context for later use
	ctx = withFlowState(ctx, flowState)

	return withSignature(ctx, stateID.String()), nil
}

// Provider returns a Provider interface for the given name.
func (a *API) Provider(ctx context.Context, name string, scopes string) (provider.Provider, conf.OAuthProviderConfiguration, error) {
	config := a.config
	db := a.db.WithContext(ctx)
	name = strings.ToLower(name)

	var err error
	var p provider.Provider
	var pConfig conf.OAuthProviderConfiguration

	// Check if this is a custom provider (format: custom:identifier)
	if strings.HasPrefix(name, "custom:") {
		if !config.CustomOAuth.Enabled {
			return nil, conf.OAuthProviderConfiguration{}, fmt.Errorf("custom OAuth providers are disabled")
		}
		return a.loadCustomProvider(ctx, db, name, scopes)
	}

	switch name {
	case AppleProvider:
		pConfig = config.External.Apple
		p, err = provider.NewAppleProvider(ctx, pConfig, a.oidcCache)
	case AzureProvider:
		pConfig = config.External.Azure
		p, err = provider.NewAzureProvider(pConfig, scopes, a.oidcCache)
	case BitbucketProvider:
		pConfig = config.External.Bitbucket
		p, err = provider.NewBitbucketProvider(pConfig)
	case DiscordProvider:
		pConfig = config.External.Discord
		p, err = provider.NewDiscordProvider(pConfig, scopes)
	case FacebookProvider:
		pConfig = config.External.Facebook
		p, err = provider.NewFacebookProvider(pConfig, scopes)
	case FigmaProvider:
		pConfig = config.External.Figma
		p, err = provider.NewFigmaProvider(pConfig, scopes)
	case FlyProvider:
		pConfig = config.External.Fly
		p, err = provider.NewFlyProvider(pConfig, scopes)
	case GitHubProvider:
		pConfig = config.External.Github
		p, err = provider.NewGithubProvider(pConfig, scopes)
	case GitLabProvider:
		pConfig = config.External.Gitlab
		p, err = provider.NewGitlabProvider(pConfig, scopes)
	case GoogleProvider:
		pConfig = config.External.Google
		p, err = provider.NewGoogleProvider(ctx, pConfig, scopes, a.oidcCache)
	case KakaoProvider:
		pConfig = config.External.Kakao
		p, err = provider.NewKakaoProvider(pConfig, scopes)
	case KeycloakProvider:
		pConfig = config.External.Keycloak
		p, err = provider.NewKeycloakProvider(pConfig, scopes)
	case LinkedInProvider:
		pConfig = config.External.Linkedin
		p, err = provider.NewLinkedinProvider(pConfig, scopes)
	case LinkedInOIDCProvider:
		pConfig = config.External.LinkedinOIDC
		p, err = provider.NewLinkedinOIDCProvider(ctx, pConfig, scopes, a.oidcCache)
	case NotionProvider:
		pConfig = config.External.Notion
		p, err = provider.NewNotionProvider(pConfig)
	case SnapchatProvider:
		pConfig = config.External.Snapchat
		p, err = provider.NewSnapchatProvider(pConfig, scopes)
	case SpotifyProvider:
		pConfig = config.External.Spotify
		p, err = provider.NewSpotifyProvider(pConfig, scopes)
	case SlackProvider:
		pConfig = config.External.Slack
		p, err = provider.NewSlackProvider(pConfig, scopes)
	case SlackOIDCProvider:
		pConfig = config.External.SlackOIDC
		p, err = provider.NewSlackOIDCProvider(pConfig, scopes)
	case TwitchProvider:
		pConfig = config.External.Twitch
		p, err = provider.NewTwitchProvider(pConfig, scopes)
	case TwitterProvider:
		pConfig = config.External.Twitter
		p, err = provider.NewTwitterProvider(pConfig, scopes)
	case XProvider:
		pConfig = config.External.X
		p, err = provider.NewXProvider(pConfig, scopes)
	case VercelMarketplaceProvider:
		pConfig = config.External.VercelMarketplace
		p, err = provider.NewVercelMarketplaceProvider(ctx, pConfig, scopes, a.oidcCache)
	case WorkOSProvider:
		pConfig = config.External.WorkOS
		p, err = provider.NewWorkOSProvider(pConfig)
	case ZoomProvider:
		pConfig = config.External.Zoom
		p, err = provider.NewZoomProvider(pConfig)
	default:
		return nil, pConfig, fmt.Errorf("Provider %s could not be found", name)
	}

	return p, pConfig, err
}

// loadCustomProvider loads a custom OAuth or OIDC provider from the database
// identifier should be the full provider name with 'custom:' prefix (e.g., 'custom:github-enterprise')
func (a *API) loadCustomProvider(ctx context.Context, db *storage.Connection, identifier string, scopes string) (provider.Provider, conf.OAuthProviderConfiguration, error) {
	config := a.config
	var pConfig conf.OAuthProviderConfiguration

	externalURL := config.API.ExternalURL
	if config.CustomOAuth.ExternalURL != "" {
		externalURL = config.CustomOAuth.ExternalURL
	}
	redirectURL := strings.TrimRight(externalURL, "/") + "/callback"

	// Parse scopes (space-separated per RFC 6749)
	var scopeList []string
	if scopes != "" {
		scopeList = strings.Fields(scopes)
	}

	// Find the custom provider by identifier (which now includes 'custom:' prefix)
	customProvider, err := models.FindCustomOAuthProviderByIdentifier(db, identifier)
	if err != nil {
		if models.IsNotFoundError(err) {
			return nil, pConfig, fmt.Errorf("custom provider %s not found", identifier)
		}
		return nil, pConfig, fmt.Errorf("error finding custom provider: %w", err)
	}

	// Check if provider is enabled
	if !customProvider.Enabled {
		return nil, pConfig, fmt.Errorf("custom provider %s is disabled", identifier)
	}

	// Use provider scopes if not overridden
	if len(scopeList) == 0 {
		scopeList = customProvider.Scopes
	}

	// Decrypt client secret for runtime use
	clientSecret, err := customProvider.GetClientSecret(config.Security.DBEncryption)
	if err != nil {
		return nil, pConfig, fmt.Errorf("error decrypting client secret for provider %s: %w", identifier, err)
	}

	// Handle based on provider type
	if customProvider.IsOAuth2() {
		// OAuth2 provider
		if customProvider.AuthorizationURL == nil || customProvider.TokenURL == nil || customProvider.UserinfoURL == nil {
			return nil, pConfig, fmt.Errorf("OAuth2 provider %s missing required endpoints", identifier)
		}

		// Create custom OAuth provider instance
		p := provider.NewCustomOAuthProvider(
			customProvider.ClientID,
			clientSecret,
			*customProvider.AuthorizationURL,
			*customProvider.TokenURL,
			*customProvider.UserinfoURL,
			redirectURL,
			scopeList,
			customProvider.PKCEEnabled,
			customProvider.AcceptableClientIDs,
			customProvider.AttributeMapping,
			customProvider.AuthorizationParams,
			customProvider.CustomClaimsAllowlist,
		)

		// Build provider configuration
		pConfig = conf.OAuthProviderConfiguration{
			Enabled:       true,
			ClientID:      []string{customProvider.ClientID},
			Secret:        clientSecret,
			RedirectURI:   redirectURL,
			URL:           *customProvider.AuthorizationURL,
			EmailOptional: customProvider.EmailOptional,
		}

		return p, pConfig, nil
	}

	// OIDC provider
	if customProvider.Issuer == nil {
		return nil, pConfig, fmt.Errorf("OIDC provider %s missing issuer", identifier)
	}

	// Create custom OIDC provider instance
	p, err := provider.NewCustomOIDCProvider(
		ctx,
		customProvider.ClientID,
		clientSecret,
		redirectURL,
		scopeList,
		*customProvider.Issuer,
		customProvider.GetDiscoveryURL(),
		customProvider.PKCEEnabled,
		customProvider.AcceptableClientIDs,
		customProvider.AttributeMapping,
		customProvider.AuthorizationParams,
		customProvider.CustomClaimsAllowlist,
		a.oidcCache,
	)
	if err != nil {
		return nil, pConfig, fmt.Errorf("error creating OIDC provider: %w", err)
	}

	// Build provider configuration
	pConfig = conf.OAuthProviderConfiguration{
		Enabled:       true,
		ClientID:      []string{customProvider.ClientID},
		Secret:        clientSecret,
		RedirectURI:   redirectURL,
		URL:           p.Config().Endpoint.AuthURL,
		EmailOptional: customProvider.EmailOptional,
	}

	return p, pConfig, nil
}

func redirectErrors(handler apiHandler, w http.ResponseWriter, r *http.Request, u *url.URL) {
	ctx := r.Context()
	log := observability.GetLogEntry(r).Entry
	errorID := utilities.GetRequestID(ctx)
	err := handler(w, r)
	if err != nil {
		q := getErrorQueryString(err, errorID, log, u.Query())
		u.RawQuery = q.Encode()

		// TODO: deprecate returning error details in the query fragment
		hq := url.Values{}
		if q.Get("error") != "" {
			hq.Set("error", q.Get("error"))
		}
		if q.Get("error_description") != "" {
			hq.Set("error_description", q.Get("error_description"))
		}
		if q.Get("error_code") != "" {
			hq.Set("error_code", q.Get("error_code"))
		}
		// Add Supabase Auth identifier to help clients distinguish Supabase Auth redirects
		hq.Set("sb", "")
		u.Fragment = hq.Encode()
		http.Redirect(w, r, u.String(), http.StatusFound) // #nosec G710
	}
}

func getErrorQueryString(err error, errorID string, log logrus.FieldLogger, q url.Values) *url.Values {
	switch e := err.(type) {
	case *HTTPError:
		if e.ErrorCode == apierrors.ErrorCodeSignupDisabled {
			q.Set("error", "access_denied")
		} else if e.ErrorCode == apierrors.ErrorCodeUserBanned {
			q.Set("error", "access_denied")
		} else if e.ErrorCode == apierrors.ErrorCodeProviderEmailNeedsVerification {
			q.Set("error", "access_denied")
		} else if str, ok := oauthErrorMap[e.HTTPStatus]; ok {
			q.Set("error", str)
		} else {
			q.Set("error", "server_error")
		}
		if e.HTTPStatus >= http.StatusInternalServerError {
			e.ErrorID = errorID
			// this will get us the stack trace too
			log.WithError(e.Cause()).Error(e.Error())
		} else {
			log.WithError(e.Cause()).Info(e.Error())
		}
		q.Set("error_description", e.Message)
		q.Set("error_code", e.ErrorCode)
	case *OAuthError:
		q.Set("error", e.Err)
		q.Set("error_description", e.Description)
		log.WithError(e.Cause()).Info(e.Error())
	case ErrorCause:
		return getErrorQueryString(e.Cause(), errorID, log, q)
	default:
		error_type, error_description := "server_error", err.Error()

		// Provide better error messages for certain user-triggered Postgres errors.
		if pgErr := utilities.NewPostgresError(e); pgErr != nil {
			error_description = pgErr.Message
			if oauthErrorType, ok := oauthErrorMap[pgErr.HttpStatusCode]; ok {
				error_type = oauthErrorType
			}
		}

		q.Set("error", error_type)
		q.Set("error_description", error_description)
	}
	return &q
}

func (a *API) getExternalRedirectURL(r *http.Request) string {
	ctx := r.Context()
	config := a.config
	if config.External.RedirectURL != "" {
		return config.External.RedirectURL
	}
	if er := getExternalReferrer(ctx); er != "" {
		return er
	}
	return config.SiteURL
}

func (a *API) createNewIdentity(tx *storage.Connection, user *models.User, providerType string, identityData map[string]interface{}) (*models.Identity, error) {
	identity, err := models.NewIdentity(user, providerType, identityData)
	if err != nil {
		return nil, err
	}

	if terr := tx.Create(identity); terr != nil {
		return nil, apierrors.NewInternalServerError("Error creating identity").WithInternalError(terr)
	}

	return identity, nil
}
