package api

import (
	"context"
	"crypto/sha256"
	"fmt"
	"net/http"
	"slices"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/provider"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/metering"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/observability"
	"github.com/supabase/auth/internal/storage"
)

// IdTokenGrantParams are the parameters the IdTokenGrant method accepts
type IdTokenGrantParams struct {
	IdToken      string `json:"id_token"`
	AccessToken  string `json:"access_token"`
	Nonce        string `json:"nonce"`
	Provider     string `json:"provider"`
	ClientID     string `json:"client_id"`
	Issuer       string `json:"issuer"`
	LinkIdentity bool   `json:"link_identity"`
}

func (p *IdTokenGrantParams) getProvider(ctx context.Context, db *storage.Connection, config *conf.GlobalConfiguration, r *http.Request, cache *provider.OIDCProviderCache) (*oidc.Provider, bool, string, []string, bool, error) {
	log := observability.GetLogEntry(r).Entry

	var cfg *conf.OAuthProviderConfiguration
	var issuer string
	var providerType string
	var acceptableClientIDs []string

	if p.Issuer != "" {
		log.WithField("issuer", p.Issuer).WithField("provider", p.Provider).Info("Issuer provided in request.")
	}

	switch true {
	case p.Provider == AppleProvider || provider.IsAppleIssuer(p.Issuer):
		cfg = &config.External.Apple
		providerType = AppleProvider

		detectedIssuer, err := provider.DetectAppleIDTokenIssuer(ctx, p.IdToken)
		if err != nil {
			return nil, false, "", nil, false, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Unable to detect issuer in ID token for Apple provider").WithInternalError(err)
		}

		if !provider.IsAppleIssuer(detectedIssuer) {
			return nil, false, "", nil, false, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Detected ID token issuer is not an Apple ID token issuer")
		}

		if p.Issuer != "" && p.Issuer != detectedIssuer {
			return nil, false, "", nil, false, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Provided issuer does not match ID token issuer")
		}

		issuer = detectedIssuer
		acceptableClientIDs = append(acceptableClientIDs, config.External.Apple.ClientID...)

		if config.External.IosBundleId != "" {
			acceptableClientIDs = append(acceptableClientIDs, config.External.IosBundleId)
		}

	case p.Provider == GoogleProvider || p.Issuer == provider.IssuerGoogle:
		cfg = &config.External.Google
		providerType = GoogleProvider
		issuer = provider.IssuerGoogle
		acceptableClientIDs = append(acceptableClientIDs, config.External.Google.ClientID...)

	case p.Provider == AzureProvider || provider.IsAzureIssuer(p.Issuer):
		detectedIssuer, err := provider.DetectAzureIDTokenIssuer(ctx, p.IdToken)
		if err != nil {
			return nil, false, "", nil, false, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Unable to detect issuer in ID token for Azure provider").WithInternalError(err)
		}

		if !strings.HasPrefix(detectedIssuer, "https://login.microsoftonline.com/") && !strings.HasPrefix(detectedIssuer, "https://sts.windows.net/") {
			return nil, false, "", nil, false, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Detected ID token issuer is not an Azure ID token issuer")
		}

		if p.Issuer != "" && p.Issuer != detectedIssuer {
			return nil, false, "", nil, false, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Provided issuer does not match ID token issuer")
		}

		issuer = detectedIssuer
		cfg = &config.External.Azure
		providerType = AzureProvider
		acceptableClientIDs = append(acceptableClientIDs, config.External.Azure.ClientID...)

	case p.Provider == FacebookProvider || p.Issuer == provider.IssuerFacebook:
		cfg = &config.External.Facebook
		// Facebook (Limited Login) nonce check is not supported
		cfg.SkipNonceCheck = true
		providerType = FacebookProvider
		issuer = provider.IssuerFacebook
		acceptableClientIDs = append(acceptableClientIDs, config.External.Facebook.ClientID...)

	case p.Provider == KeycloakProvider || (config.External.Keycloak.Enabled && config.External.Keycloak.URL != "" && p.Issuer == config.External.Keycloak.URL):
		cfg = &config.External.Keycloak
		providerType = KeycloakProvider
		issuer = config.External.Keycloak.URL
		acceptableClientIDs = append(acceptableClientIDs, config.External.Keycloak.ClientID...)

	case p.Provider == KakaoProvider || p.Issuer == provider.IssuerKakao:
		cfg = &config.External.Kakao
		providerType = KakaoProvider
		issuer = provider.IssuerKakao
		acceptableClientIDs = append(acceptableClientIDs, config.External.Kakao.ClientID...)

	case p.Provider == VercelMarketplaceProvider || p.Issuer == provider.IssuerVercelMarketplace:
		cfg = &config.External.VercelMarketplace
		providerType = VercelMarketplaceProvider
		issuer = provider.IssuerVercelMarketplace
		acceptableClientIDs = append(acceptableClientIDs, config.External.VercelMarketplace.ClientID...)

	case p.Provider == SnapchatProvider || p.Issuer == provider.IssuerSnapchat:
		cfg = &config.External.Snapchat
		providerType = SnapchatProvider
		issuer = provider.IssuerSnapchat
		acceptableClientIDs = append(acceptableClientIDs, config.External.Snapchat.ClientID...)

	case strings.HasPrefix(p.Provider, "custom:"):
		if !config.CustomOAuth.Enabled {
			return nil, false, "", nil, false, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Custom OAuth providers are disabled")
		}
		// Custom OIDC provider - identifier already includes 'custom:' prefix
		customProvider, err := models.FindCustomOAuthProviderByIdentifier(db, p.Provider)
		if err != nil {
			if models.IsNotFoundError(err) {
				return nil, false, "", nil, false, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Custom provider %q not found", p.Provider)
			}
			return nil, false, "", nil, false, apierrors.NewInternalServerError("Error finding custom provider").WithInternalError(err)
		}

		if !customProvider.Enabled {
			return nil, false, "", nil, false, apierrors.NewBadRequestError(apierrors.ErrorCodeProviderDisabled, "Custom provider %q is disabled", p.Provider)
		}

		// Ensure it's an OIDC provider
		if !customProvider.IsOIDC() {
			return nil, false, "", nil, false, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Provider %q is not an OIDC provider", p.Provider)
		}

		if customProvider.Issuer == nil {
			return nil, false, "", nil, false, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "OIDC provider %q missing issuer", p.Provider)
		}

		providerType = p.Provider
		issuer = *customProvider.Issuer
		acceptableClientIDs = append(acceptableClientIDs, customProvider.ClientID)
		acceptableClientIDs = append(acceptableClientIDs, customProvider.AcceptableClientIDs...)

		cfg = &conf.OAuthProviderConfiguration{
			Enabled:        true, // already checked above
			SkipNonceCheck: customProvider.SkipNonceCheck,
			EmailOptional:  customProvider.EmailOptional,
		}

	default:
		log.WithField("issuer", p.Issuer).WithField("client_id", p.ClientID).Warn("Use of POST /token with arbitrary issuer and client_id is deprecated for security reasons. Please switch to using the API with provider only!")

		allowed := false
		if slices.Contains(config.External.AllowedIdTokenIssuers, p.Issuer) {
			allowed = true
			providerType = p.Issuer
			acceptableClientIDs = []string{p.ClientID}
			issuer = p.Issuer
		}

		if !allowed {
			return nil, false, "", nil, false, apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Custom OIDC provider %q not allowed", p.Provider)
		}

		cfg = &conf.OAuthProviderConfiguration{
			Enabled:        true,
			SkipNonceCheck: false,
		}
	}

	if !cfg.Enabled {
		return nil, false, "", nil, false, apierrors.NewBadRequestError(apierrors.ErrorCodeProviderDisabled, "Provider (issuer %q) is not enabled", issuer)
	}

	oidcCtx := ctx
	if providerType == AppleProvider {
		oidcCtx = oidc.InsecureIssuerURLContext(ctx, issuer)
	}

	oidcProvider, err := cache.GetProvider(oidcCtx, issuer)
	if err != nil {
		return nil, false, "", nil, cfg.EmailOptional, err
	}

	return oidcProvider, cfg.SkipNonceCheck, providerType, acceptableClientIDs, cfg.EmailOptional, nil
}

// IdTokenGrant implements the id_token grant type flow
func (a *API) IdTokenGrant(ctx context.Context, w http.ResponseWriter, r *http.Request) error {
	log := observability.GetLogEntry(r).Entry

	db := a.db.WithContext(ctx)
	config := a.config

	params := &IdTokenGrantParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	if params.IdToken == "" {
		return apierrors.NewOAuthError("invalid request", "id_token required")
	}

	if params.Provider == "" && (params.ClientID == "" || params.Issuer == "") {
		return apierrors.NewOAuthError("invalid request", "provider or client_id and issuer required")
	}

	if params.LinkIdentity {
		if r.Header.Get("Authorization") == "" {
			return apierrors.NewOAuthError("invalid request", "Linking requires a valid user access token in Authorization")
		}

		requireAuthCtx, err := a.requireAuthentication(w, r)
		if err != nil {
			return err
		}

		targetUser := getUser(requireAuthCtx)
		if targetUser == nil {
			return apierrors.NewOAuthError("invalid request", "Linking requires a valid user authentication")
		}

		// set it so linkIdentityToUser works below
		ctx = withTargetUser(ctx, targetUser)
	}

	oidcProvider, skipNonceCheck, providerType, acceptableClientIDs, emailOptional, err := params.getProvider(ctx, db, config, r, a.oidcCache)
	if err != nil {
		return err
	}

	var oidcConfig *oidc.Config

	if providerType == AppleProvider {
		oidcConfig = &oidc.Config{
			SkipClientIDCheck: true,
			SkipIssuerCheck:   true,
		}
	}

	idToken, userData, err := provider.ParseIDToken(ctx, oidcProvider, oidcConfig, params.IdToken, provider.ParseIDTokenOptions{
		SkipAccessTokenCheck: params.AccessToken == "",
		AccessToken:          params.AccessToken,
	})
	if err != nil {
		return apierrors.NewOAuthError("invalid request", "Bad ID token").WithInternalError(err)
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

	if idToken.Subject == "" {
		return apierrors.NewOAuthError("invalid request", "Missing sub claim in id_token")
	}

	correctAudience := false
	for _, clientID := range acceptableClientIDs {
		if clientID == "" {
			continue
		}

		if slices.Contains(idToken.Audience, clientID) {
			correctAudience = true
			break
		}
	}

	if !correctAudience {
		return apierrors.NewOAuthError("invalid request", fmt.Sprintf("Unacceptable audience in id_token: %v", idToken.Audience))
	}

	if !skipNonceCheck {
		tokenHasNonce := idToken.Nonce != ""
		paramsHasNonce := params.Nonce != ""

		if tokenHasNonce != paramsHasNonce {
			return apierrors.NewOAuthError("invalid request", "Passed nonce and nonce in id_token should either both exist or not.")
		} else if tokenHasNonce && paramsHasNonce {
			// verify nonce to mitigate replay attacks
			hash := fmt.Sprintf("%x", sha256.Sum256([]byte(params.Nonce)))
			if hash != idToken.Nonce {
				return apierrors.NewOAuthError("invalid nonce", "Nonces mismatch")
			}
		}
	}

	if params.AccessToken == "" {
		if idToken.AccessTokenHash != "" {
			log.Warn("ID token has a at_hash claim, but no access_token parameter was provided. In future versions, access_token will be mandatory as it's security best practice.")
		}
	} else {
		if idToken.AccessTokenHash == "" {
			log.Info("ID token does not have a at_hash claim, access_token parameter is unused.")
		}
	}

	var createdUser bool
	var token *AccessTokenResponse
	var grantParams models.GrantParams

	grantParams.FillGrantParams(r)

	if !params.LinkIdentity {
		if err := a.triggerBeforeUserCreatedExternal(r, db, userData, providerType); err != nil {
			return err
		}
	}

	var user *models.User
	if err := db.Transaction(func(tx *storage.Connection) error {
		var terr error

		var decision models.AccountLinkingDecision
		if params.LinkIdentity {
			user, terr = a.linkIdentityToUser(r, ctx, tx, userData, providerType)
		} else {
			decision, user, terr = a.createAccountFromExternalIdentity(tx, r, userData, providerType, emailOptional)
		}
		createdUser = decision == models.CreateAccount
		if terr != nil {
			return terr
		}

		token, terr = a.issueRefreshToken(r, w.Header(), tx, user, models.OAuth, grantParams)
		if terr != nil {
			return terr
		}

		return nil
	}); err != nil {
		switch err.(type) {
		case *storage.CommitWithError:
			return err
		case *HTTPError:
			return err
		default:
			return apierrors.NewOAuthError("server_error", "Internal Server Error").WithInternalError(err)
		}
	}
	if createdUser {
		if err := a.triggerAfterUserCreated(r, db, user); err != nil {
			return err
		}
	}

	metering.RecordLogin(metering.LoginTypeOIDC, token.User.ID, &metering.LoginData{
		Provider: providerType,
	})

	return sendJSON(w, http.StatusOK, token)
}
