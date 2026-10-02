package api

import (
	"context"
	"net/http"

	"github.com/gofrs/uuid"

	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/hooks/v0hooks"
	"github.com/supabase/auth/internal/metering"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/observability"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/tokens"
)

// Aliases for backward compatibility
type AccessTokenClaims = tokens.AccessTokenClaims
type AccessTokenResponse = tokens.AccessTokenResponse

// PasswordGrantParams are the parameters the ResourceOwnerPasswordGrant method accepts
type PasswordGrantParams struct {
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

// PKCEGrantParams are the parameters the PKCEGrant method accepts
type PKCEGrantParams struct {
	AuthCode     string `json:"auth_code"`
	CodeVerifier string `json:"code_verifier"`
}

const useCookieHeader = "x-use-cookie"
const InvalidLoginMessage = "Invalid login credentials"

// Token is the endpoint for OAuth access token requests
func (a *API) Token(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	grantType := r.FormValue("grant_type")

	handler := a.ResourceOwnerPasswordGrant
	limiter := a.limiterOpts.Token

	switch grantType {
	case "password":
		// set above
	case "refresh_token":
		handler = a.RefreshTokenGrant
	case "id_token":
		handler = a.IdTokenGrant
	case "pkce":
		handler = a.PKCE
	case "web3":
		handler = a.Web3Grant
		limiter = a.limiterOpts.Web3
	default:
		return apierrors.NewBadRequestError(apierrors.ErrorCodeInvalidCredentials, "unsupported_grant_type")
	}

	if err := a.performRateLimiting(limiter, r); err != nil {
		return err
	}

	return handler(ctx, w, r)
}

// ResourceOwnerPasswordGrant implements the password grant type flow
func (a *API) ResourceOwnerPasswordGrant(ctx context.Context, w http.ResponseWriter, r *http.Request) error {
	db := a.db.WithContext(ctx)

	params := &PasswordGrantParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	aud := a.requestAud(ctx, r)
	config := a.config

	if params.Email != "" && params.Phone != "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Only an email address or phone number should be provided on login.")
	}
	var user *models.User
	var grantParams models.GrantParams
	var provider string
	var err error

	grantParams.FillGrantParams(r)

	if params.Email != "" {
		provider = EmailProvider
		if !config.External.Email.Enabled {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeEmailProviderDisabled, "Email logins are disabled")
		}
		user, err = models.FindUserByEmailAndAudience(db, params.Email, aud)
	} else if params.Phone != "" {
		provider = PhoneProvider
		if !config.External.Phone.Enabled {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodePhoneProviderDisabled, "Phone logins are disabled")
		}
		params.Phone = formatPhoneNumber(params.Phone)
		user, err = models.FindUserByPhoneAndAudience(db, params.Phone, aud)
	} else {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "missing email or phone")
	}

	if err != nil {
		if models.IsNotFoundError(err) {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeInvalidCredentials, InvalidLoginMessage)
		}
		return apierrors.NewInternalServerError("Database error querying schema").WithInternalError(err)
	}

	if !user.HasPassword() {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeInvalidCredentials, InvalidLoginMessage)
	}

	if user.IsBanned() {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeUserBanned, "User is banned")
	}

	isValidPassword, shouldReEncrypt, err := user.Authenticate(ctx, db, params.Password, config.Security.DBEncryption.DecryptionKeys, config.Security.DBEncryption.Encrypt, config.Security.DBEncryption.EncryptionKeyID)
	if err != nil {
		return err
	}

	var weakPasswordError *WeakPasswordError
	if isValidPassword {
		if err := a.checkPasswordStrength(ctx, params.Password); err != nil {
			if wpe, ok := err.(*WeakPasswordError); ok {
				weakPasswordError = wpe
			} else {
				observability.GetLogEntry(r).Entry.WithError(err).Warn("Password strength check on sign-in failed")
			}
		}

		if shouldReEncrypt {
			if err := user.SetPassword(ctx, params.Password, true, config.Security.DBEncryption.EncryptionKeyID, config.Security.DBEncryption.EncryptionKey); err != nil {
				return err
			}

			// directly change this in the database without
			// calling user.UpdatePassword() because this
			// is not a password change, just encryption
			// change in the database
			if err := db.UpdateOnly(user, "encrypted_password"); err != nil {
				return err
			}
		}
	}

	if config.Hook.PasswordVerificationAttempt.Enabled {
		input := v0hooks.NewPasswordVerificationAttemptInput(
			r,
			user.ID,
			isValidPassword,
		)
		output := v0hooks.PasswordVerificationAttemptOutput{}
		if err := a.hooksMgr.InvokeHook(nil, r, input, &output); err != nil {
			return err
		}

		if output.Decision == v0hooks.HookRejection {
			if output.Message == "" {
				output.Message = v0hooks.DefaultPasswordHookRejectionMessage
			}
			if output.ShouldLogoutUser {
				if err := models.Logout(db, user.ID); err != nil {
					return err
				}
			}
			return apierrors.NewBadRequestError(apierrors.ErrorCodeInvalidCredentials, "%s", output.Message)
		}
	}
	if !isValidPassword {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeInvalidCredentials, InvalidLoginMessage)
	}

	if params.Email != "" && !user.IsConfirmed() {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeEmailNotConfirmed, "Email not confirmed")
	} else if params.Phone != "" && !user.IsPhoneConfirmed() {
		return apierrors.NewBadRequestError(apierrors.ErrorCodePhoneNotConfirmed, "Phone not confirmed")
	}

	var token *AccessTokenResponse
	err = db.Transaction(func(tx *storage.Connection) error {
		var terr error
		if terr = models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.LoginAction, "", map[string]interface{}{
			"provider": provider,
		}); terr != nil {
			return terr
		}
		token, terr = a.tokenService.IssueRefreshToken(r, w.Header(), tx, user, models.PasswordGrant, grantParams)
		if terr != nil {
			return terr
		}

		return nil
	})
	if err != nil {
		return err
	}

	token.WeakPassword = weakPasswordError

	metering.RecordLogin(metering.LoginTypePassword, user.ID, &metering.LoginData{
		Provider: provider,
	})
	return sendJSON(w, http.StatusOK, token)
}

func (a *API) PKCE(ctx context.Context, w http.ResponseWriter, r *http.Request) error {
	db := a.db.WithContext(ctx)
	config := a.config
	var grantParams models.GrantParams

	// There is a slight problem with this as it will pick-up the
	// User-Agent and IP addresses from the server if used on the server
	// side. Currently there's no mechanism to distinguish, but the server
	// can be told to at least propagate the User-Agent header.
	grantParams.FillGrantParams(r)

	params := &PKCEGrantParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	if params.AuthCode == "" || params.CodeVerifier == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "invalid request: both auth code and code verifier should be non-empty")
	}

	flowState, err := models.FindFlowStateByAuthCode(db, params.AuthCode)
	// Sanity check in case user ID was not set properly
	if models.IsNotFoundError(err) || flowState.UserID == nil {
		return apierrors.NewNotFoundError(apierrors.ErrorCodeFlowStateNotFound, "invalid flow state, no valid flow state found")
	} else if err != nil {
		return err
	}
	if flowState.IsExpired(a.config.External.FlowStateExpiryDuration) {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeFlowStateExpired, "invalid flow state, flow state has expired")
	}

	user, err := models.FindUserByID(db, *flowState.UserID)
	if err != nil {
		return err
	}
	if err := flowState.VerifyPKCE(params.CodeVerifier); err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeBadCodeVerifier, "%s", err.Error())
	}

	var token *AccessTokenResponse
	err = db.Transaction(func(tx *storage.Connection) error {
		var terr error
		authMethod, err := models.ParseAuthenticationMethod(flowState.AuthenticationMethod)
		if err != nil {
			return err
		}
		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.LoginAction, "", map[string]interface{}{
			"provider_type": flowState.ProviderType,
		}); terr != nil {
			return terr
		}
		token, terr = a.tokenService.IssueRefreshToken(r, w.Header(), tx, user, authMethod, grantParams)
		if terr != nil {
			// error type is already handled in issueRefreshToken
			return terr
		}
		token.ProviderAccessToken = flowState.ProviderAccessToken
		// Because not all providers give out a refresh token
		// See corresponding OAuth2 spec: <https://www.rfc-editor.org/rfc/rfc6749.html#section-5.1>
		if flowState.ProviderRefreshToken != "" {
			token.ProviderRefreshToken = flowState.ProviderRefreshToken
		}
		if terr = tx.Destroy(flowState); terr != nil {
			return terr
		}
		return nil
	})
	if err != nil {
		return err
	}

	metering.RecordLogin(metering.LoginTypePKCE, user.ID, &metering.LoginData{
		Provider: flowState.ProviderType,
	})
	return sendJSON(w, http.StatusOK, token)
}

func (a *API) generateAccessToken(r *http.Request, tx *storage.Connection, user *models.User, sessionId *uuid.UUID, authenticationMethod models.AuthenticationMethod) (string, int64, error) {
	return a.tokenService.GenerateAccessToken(r, tx, tokens.GenerateAccessTokenParams{
		User:                 user,
		SessionID:            sessionId,
		AuthenticationMethod: authenticationMethod,
	})
}

func (a *API) issueRefreshToken(r *http.Request, headers http.Header, conn *storage.Connection, user *models.User, authenticationMethod models.AuthenticationMethod, grantParams models.GrantParams) (*tokens.AccessTokenResponse, error) {
	return a.tokenService.IssueRefreshToken(r, headers, conn, user, authenticationMethod, grantParams)
}

func (a *API) updateMFASessionAndClaims(r *http.Request, tx *storage.Connection, user *models.User, authenticationMethod models.AuthenticationMethod, grantParams models.GrantParams) (*tokens.AccessTokenResponse, error) {
	ctx := r.Context()
	config := a.config
	var tokenString string
	var expiresAt int64
	var issuedRefreshToken string

	currentClaims := getClaims(ctx)
	sessionId, err := uuid.FromString(currentClaims.SessionId)
	if err != nil {
		return nil, apierrors.NewInternalServerError("Cannot read SessionId claim as UUID").WithInternalError(err)
	}

	err = tx.Transaction(func(tx *storage.Connection) error {
		if terr := models.AddClaimToSession(tx, sessionId, authenticationMethod); terr != nil {
			return terr
		}

		session, terr := models.FindSessionByID(tx, sessionId, true)
		if terr != nil {
			return terr
		}

		if err := tx.Load(user, "Identities"); err != nil {
			return err
		}

		// issue a new refresh token on successful verification
		if session.RefreshTokenHmacKey != nil && session.RefreshTokenCounter != nil {
			signingKey, _, terr := session.GetRefreshTokenHmacKey(config.Security.DBEncryption)
			if terr != nil {
				return apierrors.NewInternalServerError("Failed to get session's refresh token key").WithInternalError(terr)
			}

			// Incrementing the refresh token counter by 2 here is
			// counter intuitive, but is important for security. It
			// means that the previous refresh token (issued with
			// AAL1) will no longer be able to issue AAL2 sessions.
			// It forces the client to have received the refresh
			// token from the MFA verification flow.
			counter := *session.RefreshTokenCounter + 2
			session.RefreshTokenCounter = &counter

			issuedRefreshToken = (&crypto.RefreshToken{
				Version:   0,
				SessionID: session.ID,
				Counter:   *session.RefreshTokenCounter,
			}).Encode(signingKey)

			if terr := session.UpdateOnlyRefreshToken(tx); terr != nil {
				return apierrors.NewInternalServerError("Failed to update session").WithInternalError(terr)
			}
		} else {
			// Legacy RTs: swap to ensure current token is the latest one

			currentToken, terr := models.FindTokenBySessionID(tx, &session.ID)
			if terr != nil {
				return terr
			}

			refreshToken, terr := models.GrantRefreshTokenSwap(config.AuditLog, r, tx, user, currentToken)
			if terr != nil {
				return terr
			}

			issuedRefreshToken = refreshToken.Token
		}

		aal, _, terr := session.CalculateAALAndAMR(user)
		if terr != nil {
			return terr
		}

		if err := session.UpdateAALAndAssociatedFactor(tx, aal, grantParams.FactorID); err != nil {
			return err
		}

		tokenString, expiresAt, terr = a.tokenService.GenerateAccessToken(r, tx, tokens.GenerateAccessTokenParams{
			User:                 user,
			SessionID:            &session.ID,
			AuthenticationMethod: authenticationMethod,
		})

		if terr != nil {
			httpErr, ok := terr.(*HTTPError)
			if ok {
				return httpErr
			}
			return apierrors.NewInternalServerError("error generating jwt token").WithInternalError(terr)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &tokens.AccessTokenResponse{
		Token:        tokenString,
		TokenType:    "bearer",
		ExpiresIn:    int(expiresAt - a.Now().Unix()),
		ExpiresAt:    expiresAt,
		RefreshToken: issuedRefreshToken,
		User:         user,
	}, nil
}
