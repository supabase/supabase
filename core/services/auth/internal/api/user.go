package api

import (
	"context"
	"net/http"
	"time"

	"github.com/gofrs/uuid"
	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/sms_provider"
	"github.com/supabase/auth/internal/mailer"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
)

// UserUpdateParams parameters for updating a user
type UserUpdateParams struct {
	Email               string                 `json:"email"`
	Password            *string                `json:"password"`
	CurrentPassword     *string                `json:"current_password,omitempty"`
	Nonce               string                 `json:"nonce"`
	Data                map[string]interface{} `json:"data"`
	AppData             map[string]interface{} `json:"app_metadata,omitempty"`
	Phone               string                 `json:"phone"`
	Channel             string                 `json:"channel"`
	CodeChallenge       string                 `json:"code_challenge"`
	CodeChallengeMethod string                 `json:"code_challenge_method"`
}

func (a *API) validateUserUpdateParams(ctx context.Context, p *UserUpdateParams) error {
	config := a.config

	var err error
	if p.Email != "" {
		p.Email, err = a.validateEmail(p.Email)
		if err != nil {
			return err
		}
	}

	if p.Phone != "" {
		if p.Phone, err = validatePhone(p.Phone); err != nil {
			return err
		}
		if p.Channel == "" {
			p.Channel = sms_provider.SMSProvider
		}
		if !sms_provider.IsValidMessageChannel(p.Channel, config) {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, InvalidChannelError)
		}
	}

	if p.Password != nil {
		if err := a.checkPasswordStrength(ctx, *p.Password); err != nil {
			return err
		}
	}

	return nil
}

// UserGet returns a user
func (a *API) UserGet(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	claims := getClaims(ctx)
	if claims == nil {
		return apierrors.NewInternalServerError("Could not read claims")
	}

	aud := a.requestAud(ctx, r)
	audienceFromClaims, _ := claims.GetAudience()
	if len(audienceFromClaims) == 0 || aud != audienceFromClaims[0] {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Token audience doesn't match request audience")
	}

	user := getUser(ctx)
	return sendJSON(w, http.StatusOK, user)
}

// UserUpdate updates fields on a user
func (a *API) UserUpdate(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)
	config := a.config
	aud := a.requestAud(ctx, r)

	params := &UserUpdateParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	user := getUser(ctx)
	session := getSession(ctx)

	if err := a.validateUserUpdateParams(ctx, params); err != nil {
		return err
	}

	if params.AppData != nil && !isAdmin(user, config) {
		if !isAdmin(user, config) {
			return apierrors.NewForbiddenError(apierrors.ErrorCodeNotAdmin, "Updating app_metadata requires admin privileges")
		}
	}

	if user.HasMFAEnabled() && !session.IsAAL2() {
		if (params.Password != nil && *params.Password != "") || (params.Email != "" && user.GetEmail() != params.Email) || (params.Phone != "" && user.GetPhone() != params.Phone) {
			return apierrors.NewHTTPError(http.StatusUnauthorized, apierrors.ErrorCodeInsufficientAAL, "AAL2 session is required to update email or password when MFA is enabled.")
		}
	}

	if user.IsAnonymous {
		if params.Password != nil && *params.Password != "" {
			if params.Email == "" && params.Phone == "" {
				return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeValidationFailed, "Updating password of an anonymous user without an email or phone is not allowed")
			}
		}
	}

	// TODO: Check if a user is SSO via rows in identities table, not via this flag.
	if user.IsSSOUser {
		updatingForbiddenFields := false

		updatingForbiddenFields = updatingForbiddenFields || (params.Password != nil && *params.Password != "")
		updatingForbiddenFields = updatingForbiddenFields || (params.Email != "" && params.Email != user.GetEmail())
		updatingForbiddenFields = updatingForbiddenFields || (params.Phone != "" && params.Phone != user.GetPhone())
		updatingForbiddenFields = updatingForbiddenFields || (params.Nonce != "")

		if updatingForbiddenFields {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeUserSSOManaged, "Updating email, phone, password of a SSO account only possible via SSO")
		}
	}

	if params.Email != "" && user.GetEmail() != params.Email {
		if duplicateUser, err := models.IsDuplicatedEmail(db, params.Email, aud, user, config.Experimental.ProviderLinkingDomains); err != nil {
			return apierrors.NewInternalServerError("Database error checking email").WithInternalError(err)
		} else if duplicateUser != nil {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeEmailExists, DuplicateEmailMsg)
		}
	}

	if params.Phone != "" && user.GetPhone() != params.Phone {
		if exists, err := models.IsDuplicatedPhone(db, params.Phone, aud); err != nil {
			return apierrors.NewInternalServerError("Database error checking phone").WithInternalError(err)
		} else if exists {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodePhoneExists, DuplicatePhoneMsg)
		}
	}

	// must be captured before setting password below (via user.SetPassword)
	addingFirstPassword := params.Password != nil && *params.Password != "" && !user.HasPassword()

	if params.Password != nil {
		if config.Security.UpdatePasswordRequireReauthentication {
			now := time.Now()
			// we require reauthentication if the user hasn't signed in recently in the current session
			if session == nil || now.After(session.CreatedAt.Add(24*time.Hour)) {
				if len(params.Nonce) == 0 {
					return apierrors.NewBadRequestError(apierrors.ErrorCodeReauthenticationNeeded, "Password update requires reauthentication")
				}
				if err := a.verifyReauthentication(params.Nonce, db, config, user); err != nil {
					return err
				}
			}
		}

		password := *params.Password
		if password != "" {
			isSamePassword := false

			if user.HasPassword() {
				// current password required when updating password
				if config.Security.UpdatePasswordRequireCurrentPassword {
					// ensure user is not in a password recovery flow
					if !session.IsRecovery() {
						if params.CurrentPassword == nil || *params.CurrentPassword == "" {
							return apierrors.NewBadRequestError(apierrors.ErrorCodeCurrentPasswordRequired, "Current password required when setting new password.")
						}
						isCurrentPasswordCorrect, _, err := user.Authenticate(ctx, db, *params.CurrentPassword, config.Security.DBEncryption.DecryptionKeys, false, "")
						if err != nil {
							return err
						}
						if !isCurrentPasswordCorrect {
							return apierrors.NewBadRequestError(apierrors.ErrorCodeCurrentPasswordMismatch, "Current password required when setting new password.")
						}
					}
				}
				auth, _, err := user.Authenticate(ctx, db, password, config.Security.DBEncryption.DecryptionKeys, false, "")
				if err != nil {
					return err
				}

				isSamePassword = auth
			}

			if isSamePassword {
				return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeSamePassword, "New password should be different from the old password.")
			}
		}

		if err := user.SetPassword(ctx, password, config.Security.DBEncryption.Encrypt, config.Security.DBEncryption.EncryptionKeyID, config.Security.DBEncryption.EncryptionKey); err != nil {
			return err
		}
	}

	err := db.Transaction(func(tx *storage.Connection) error {
		var terr error
		if params.Password != nil {
			var sessionID *uuid.UUID
			if session != nil {
				sessionID = &session.ID
			}

			if terr = user.UpdatePassword(tx, sessionID); terr != nil {
				return apierrors.NewInternalServerError("Error during password storage").WithInternalError(terr)
			}

			if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.UserUpdatePasswordAction, "", nil); terr != nil {
				return terr
			}

			// this is the first time a user sets a password on their account
			// TODO(fm): we may want to relax it to also create identities for existing passwords
			if addingFirstPassword {
				if terr := a.ensureEmailIdentityForPassword(tx, user); terr != nil {
					return terr
				}
			}

			// send a Password Changed email notification to the user to inform them that their password has been changed
			if config.Mailer.Notifications.PasswordChangedEnabled && user.GetEmail() != "" {
				if err := a.sendPasswordChangedNotification(r, tx, user); err != nil {
					// we don't want to fail the whole request if the email can't be sent
					logrus.WithError(err).Warn("Unable to send password changed notification email")
				}
			}
		}

		if params.Data != nil {
			if terr = user.UpdateUserMetaData(tx, params.Data); terr != nil {
				return apierrors.NewInternalServerError("Error updating user").WithInternalError(terr)
			}
		}

		if params.AppData != nil {
			if terr = user.UpdateAppMetaData(tx, params.AppData); terr != nil {
				return apierrors.NewInternalServerError("Error updating user").WithInternalError(terr)
			}
		}

		if params.Email != "" && params.Email != user.GetEmail() {
			if user.IsAnonymous && config.Mailer.Autoconfirm {
				// anonymous users can add an email with automatic confirmation, which is similar to signing up
				// permanent users always need to verify their email address when changing it
				user.EmailChange = params.Email
				if _, terr := a.emailChangeVerify(r, tx, &VerifyParams{
					Type:  mailer.EmailChangeVerification,
					Email: params.Email,
				}, user); terr != nil {
					return terr
				}

			} else {
				flowType := getFlowFromChallenge(params.CodeChallenge)
				if isPKCEFlow(flowType) {
					_, terr := generateFlowState(tx, models.EmailChange.String(), models.EmailChange, params.CodeChallengeMethod, params.CodeChallenge, &user.ID)
					if terr != nil {
						return terr
					}

				}
				if terr = a.sendEmailChange(r, tx, user, params.Email, flowType); terr != nil {
					return terr
				}
			}
		}

		if params.Phone != "" && params.Phone != user.GetPhone() {
			if config.Sms.Autoconfirm {
				user.PhoneChange = params.Phone
				if _, terr := a.smsVerify(r, tx, user, &VerifyParams{
					Type:  phoneChangeVerification,
					Phone: params.Phone,
				}); terr != nil {
					return terr
				}
			} else {
				if _, terr := a.sendPhoneConfirmation(r, tx, user, params.Phone, phoneChangeVerification, params.Channel); terr != nil {
					return terr
				}
			}
		}

		if terr = models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.UserModifiedAction, "", nil); terr != nil {
			return apierrors.NewInternalServerError("Error recording audit log entry").WithInternalError(terr)
		}

		return nil
	})
	if err != nil {
		return err
	}

	return sendJSON(w, http.StatusOK, user)
}
