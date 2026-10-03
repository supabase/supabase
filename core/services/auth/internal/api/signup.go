package api

import (
	"context"
	"net/http"
	"time"

	"github.com/fatih/structs"
	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/provider"
	"github.com/supabase/auth/internal/api/sms_provider"
	"github.com/supabase/auth/internal/metering"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
)

// SignupParams are the parameters the Signup endpoint accepts
type SignupParams struct {
	Email               string                 `json:"email"`
	Phone               string                 `json:"phone"`
	Password            string                 `json:"password"`
	Data                map[string]interface{} `json:"data"`
	Provider            string                 `json:"-"`
	Aud                 string                 `json:"-"`
	Channel             string                 `json:"channel"`
	CodeChallengeMethod string                 `json:"code_challenge_method"`
	CodeChallenge       string                 `json:"code_challenge"`
}

func (a *API) validateSignupParams(ctx context.Context, p *SignupParams) error {
	config := a.config

	if p.Password == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Signup requires a valid password")
	}

	if err := a.checkPasswordStrength(ctx, p.Password); err != nil {
		return err
	}
	if p.Email != "" && p.Phone != "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Only an email address or phone number should be provided on signup.")
	}
	if p.Provider == PhoneProvider && !sms_provider.IsValidMessageChannel(p.Channel, config) {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, InvalidChannelError)
	}
	// PKCE not needed as phone signups already return access token in body
	if p.Phone != "" && p.CodeChallenge != "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "PKCE not supported for phone signups")
	}
	if err := validatePKCEParams(p.CodeChallengeMethod, p.CodeChallenge); err != nil {
		return err
	}

	return nil
}

func (p *SignupParams) ConfigureDefaults() {
	if p.Email != "" {
		p.Provider = EmailProvider
	} else if p.Phone != "" {
		p.Provider = PhoneProvider
	}
	if p.Data == nil {
		p.Data = make(map[string]interface{})
	}

	// For backwards compatibility, we default to SMS if params Channel is not specified
	if p.Phone != "" && p.Channel == "" {
		p.Channel = sms_provider.SMSProvider
	}
}

func (params *SignupParams) ToUserModel(isSSOUser bool) (user *models.User, err error) {
	switch params.Provider {
	case EmailProvider:
		user, err = models.NewUser("", params.Email, params.Password, params.Aud, params.Data)
	case PhoneProvider:
		user, err = models.NewUser(params.Phone, "", params.Password, params.Aud, params.Data)
	case AnonymousProvider:
		user, err = models.NewUser("", "", "", params.Aud, params.Data)
		user.IsAnonymous = true
	default:
		// handles external provider case
		user, err = models.NewUser("", params.Email, params.Password, params.Aud, params.Data)
	}
	if err != nil {
		err = apierrors.NewInternalServerError("Database error creating user").WithInternalError(err)
		return
	}
	user.IsSSOUser = isSSOUser
	if user.AppMetaData == nil {
		user.AppMetaData = make(map[string]interface{})
	}

	user.Identities = make([]models.Identity, 0)

	if params.Provider != AnonymousProvider {
		// TODO: Deprecate "provider" field
		user.AppMetaData["provider"] = params.Provider

		user.AppMetaData["providers"] = []string{params.Provider}
	}

	return user, nil
}

// Signup is the endpoint for registering a new user
func (a *API) Signup(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	config := a.config
	db := a.db.WithContext(ctx)

	if config.DisableSignup {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeSignupDisabled, "Signups not allowed for this instance")
	}

	params := &SignupParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	params.ConfigureDefaults()

	if err := a.validateSignupParams(ctx, params); err != nil {
		return err
	}

	var err error
	flowType := getFlowFromChallenge(params.CodeChallenge)

	var user *models.User
	var grantParams models.GrantParams

	grantParams.FillGrantParams(r)

	params.Aud = a.requestAud(ctx, r)

	switch params.Provider {
	case EmailProvider:
		if !config.External.Email.Enabled {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeEmailProviderDisabled, "Email signups are disabled")
		}
		params.Email, err = a.validateEmail(params.Email)
		if err != nil {
			return err
		}
		user, err = models.IsDuplicatedEmail(db, params.Email, params.Aud, nil, config.Experimental.ProviderLinkingDomains)
	case PhoneProvider:
		if !config.External.Phone.Enabled {
			return apierrors.NewBadRequestError(apierrors.ErrorCodePhoneProviderDisabled, "Phone signups are disabled")
		}
		params.Phone, err = validatePhone(params.Phone)
		if err != nil {
			return err
		}
		user, err = models.FindUserByPhoneAndAudience(db, params.Phone, params.Aud)
	default:
		msg := ""
		if config.External.Email.Enabled && config.External.Phone.Enabled {
			msg = "Sign up only available with email or phone provider"
		} else if config.External.Email.Enabled {
			msg = "Sign up only available with email provider"
		} else if config.External.Phone.Enabled {
			msg = "Sign up only available with phone provider"
		} else {
			msg = "Sign up with this provider not possible"
		}

		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "%s", msg)
	}

	if err != nil && !models.IsNotFoundError(err) {
		return apierrors.NewInternalServerError("Database error finding user").WithInternalError(err)
	}

	var signupUser *models.User
	if user == nil {
		// always call this outside of a database transaction as this method
		// can be computationally hard and block due to password hashing
		signupUser, err = params.ToUserModel(false /* <- isSSOUser */)
		if err != nil {
			return err
		}
		if err := a.triggerBeforeUserCreated(r, db, signupUser); err != nil {
			return err
		}
	}

	err = db.Transaction(func(tx *storage.Connection) error {
		var terr error
		if user != nil {
			if (params.Provider == EmailProvider && user.IsConfirmed()) || (params.Provider == PhoneProvider && user.IsPhoneConfirmed()) {
				return UserExistsError
			}
			// do not update the user because we can't be sure of their claimed identity
		} else {
			user, terr = a.signupNewUser(tx, signupUser)
			if terr != nil {
				return terr
			}
		}
		identity, terr := models.FindIdentityByIdAndProvider(tx, user.ID.String(), params.Provider)
		if terr != nil {
			if !models.IsNotFoundError(terr) {
				return terr
			}
			identityData := structs.Map(provider.Claims{
				Subject: user.ID.String(),
				Email:   user.GetEmail(),
			})
			for k, v := range params.Data {
				if _, ok := identityData[k]; !ok {
					identityData[k] = v
				}
			}
			identity, terr = a.createNewIdentity(tx, user, params.Provider, identityData)
			if terr != nil {
				return terr
			}
			if terr := user.RemoveUnconfirmedIdentities(tx, identity); terr != nil {
				return terr
			}
		}
		user.Identities = []models.Identity{*identity}

		if params.Provider == EmailProvider && !user.IsConfirmed() {
			if config.Mailer.Autoconfirm {
				if terr = models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.UserSignedUpAction, "", map[string]interface{}{
					"provider": params.Provider,
				}); terr != nil {
					return terr
				}
				if terr = user.Confirm(tx); terr != nil {
					return apierrors.NewInternalServerError("Database error updating user").WithInternalError(terr)
				}
			} else {
				if terr = models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.UserConfirmationRequestedAction, "", map[string]interface{}{
					"provider": params.Provider,
				}); terr != nil {
					return terr
				}
				if isPKCEFlow(flowType) {
					_, terr := generateFlowState(tx, params.Provider, models.EmailSignup, params.CodeChallengeMethod, params.CodeChallenge, &user.ID)
					if terr != nil {
						return terr
					}
				}
				if terr = a.sendConfirmation(r, tx, user, flowType); terr != nil {
					return terr
				}
			}
		} else if params.Provider == PhoneProvider && !user.IsPhoneConfirmed() {
			if config.Sms.Autoconfirm {
				if terr = models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.UserSignedUpAction, "", map[string]interface{}{
					"provider": params.Provider,
					"channel":  params.Channel,
				}); terr != nil {
					return terr
				}
				if terr = user.ConfirmPhone(tx); terr != nil {
					return apierrors.NewInternalServerError("Database error updating user").WithInternalError(terr)
				}
			} else {
				if terr = models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.UserConfirmationRequestedAction, "", map[string]interface{}{
					"provider": params.Provider,
				}); terr != nil {
					return terr
				}
				if _, terr := a.sendPhoneConfirmation(r, tx, user, params.Phone, phoneConfirmationOtp, params.Channel); terr != nil {
					return terr
				}
			}
		}

		return nil
	})

	if err != nil {
		if errors.Is(err, UserExistsError) {
			err = db.Transaction(func(tx *storage.Connection) error {
				if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.UserRepeatedSignUpAction, "", map[string]interface{}{
					"provider": params.Provider,
				}); terr != nil {
					return terr
				}
				return nil
			})
			if err != nil {
				return err
			}
			if config.Mailer.Autoconfirm || config.Sms.Autoconfirm {
				return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeUserAlreadyExists, "User already registered")
			}
			sanitizedUser, err := sanitizeUser(user, params)
			if err != nil {
				return err
			}
			return sendJSON(w, http.StatusOK, sanitizedUser)
		}
		return err
	}

	// handles case where Mailer.Autoconfirm is true or Phone.Autoconfirm is true
	if user.IsConfirmed() || user.IsPhoneConfirmed() {
		var token *AccessTokenResponse
		err = db.Transaction(func(tx *storage.Connection) error {
			var terr error
			if terr = models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.LoginAction, "", map[string]interface{}{
				"provider": params.Provider,
			}); terr != nil {
				return terr
			}
			token, terr = a.issueRefreshToken(r, w.Header(), tx, user, models.PasswordGrant, grantParams)

			if terr != nil {
				return terr
			}
			return nil
		})
		if err != nil {
			return err
		}
		metering.RecordLogin(metering.LoginTypePassword, user.ID, &metering.LoginData{
			Provider: params.Provider,
			// add extra context to indicate this is immediate login right after signup
			Extra: map[string]interface{}{
				"immediate_login_after_signup": true,
			},
		})
		return sendJSON(w, http.StatusOK, token)
	}
	if user.HasBeenInvited() {
		// Remove sensitive fields
		user.UserMetaData = map[string]interface{}{}
		user.Identities = []models.Identity{}
	}

	// Trigger the after user created hook.
	if err := a.triggerAfterUserCreated(r, db, user); err != nil {
		return apierrors.NewInternalServerError("Error invoking hook").WithInternalError(err)
	}
	return sendJSON(w, http.StatusOK, user)
}

// sanitizeUser removes all user sensitive information from the user object
// Should be used whenever we want to prevent information about whether a user is registered or not from leaking
func sanitizeUser(u *models.User, params *SignupParams) (*models.User, error) {
	now := time.Now()

	u.ID = uuid.Must(uuid.NewV4())

	u.Role, u.EmailChange = "", ""
	u.CreatedAt, u.UpdatedAt, u.ConfirmationSentAt = now, now, &now
	u.LastSignInAt, u.ConfirmedAt, u.EmailChangeSentAt, u.EmailConfirmedAt, u.PhoneConfirmedAt = nil, nil, nil, nil, nil
	u.Identities = make([]models.Identity, 0)
	u.UserMetaData = params.Data
	u.Aud = params.Aud

	// sanitize app_metadata
	u.AppMetaData = map[string]interface{}{
		"provider":  params.Provider,
		"providers": []string{params.Provider},
	}

	// sanitize param fields
	switch params.Provider {
	case EmailProvider:
		u.Phone = ""
	case PhoneProvider:
		u.Email = ""
	default:
		u.Phone, u.Email = "", ""
	}

	return u, nil
}

func (a *API) signupNewUser(conn *storage.Connection, user *models.User) (*models.User, error) {
	config := a.config

	err := conn.Transaction(func(tx *storage.Connection) error {
		var terr error
		if terr = tx.Create(user); terr != nil {
			return apierrors.NewInternalServerError("Database error saving new user").WithInternalError(terr)
		}
		if terr = user.SetRole(tx, config.JWT.DefaultGroupName); terr != nil {
			return apierrors.NewInternalServerError("Database error updating user").WithInternalError(terr)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	// there may be triggers or generated column values in the database that will modify the
	// user data as it is being inserted. thus we load the user object
	// again to fetch those changes.
	if err := conn.Reload(user); err != nil {
		return nil, apierrors.NewInternalServerError("Database error loading user after sign-up").WithInternalError(err)
	}
	return user, nil
}
