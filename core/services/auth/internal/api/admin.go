package api

import (
	"context"
	"net/http"
	"time"

	"github.com/fatih/structs"
	"github.com/go-chi/chi/v5"
	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"github.com/sethvargo/go-password/password"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/provider"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/observability"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/utilities"
	"golang.org/x/crypto/bcrypt"
)

type AdminUserParams struct {
	Id           string                 `json:"id"`
	Aud          string                 `json:"aud"`
	Role         string                 `json:"role"`
	Email        string                 `json:"email"`
	Phone        string                 `json:"phone"`
	Password     *string                `json:"password"`
	PasswordHash string                 `json:"password_hash"`
	EmailConfirm bool                   `json:"email_confirm"`
	PhoneConfirm bool                   `json:"phone_confirm"`
	UserMetaData map[string]interface{} `json:"user_metadata"`
	AppMetaData  map[string]interface{} `json:"app_metadata"`
	BanDuration  string                 `json:"ban_duration"`
}

type adminUserDeleteParams struct {
	ShouldSoftDelete bool `json:"should_soft_delete"`
}

type adminUserUpdateFactorParams struct {
	FriendlyName string `json:"friendly_name"`
	Phone        string `json:"phone"`
}

type AdminListUsersResponse struct {
	Users      []*models.User            `json:"users"`
	Aud        string                    `json:"aud"`
	Pagination *CursorPaginationResponse `json:"pagination,omitempty"`
}

func (a *API) loadUser(w http.ResponseWriter, r *http.Request) (context.Context, error) {
	ctx := r.Context()
	db := a.db.WithContext(ctx)

	userID, err := uuid.FromString(chi.URLParam(r, "user_id"))
	if err != nil {
		return nil, apierrors.NewNotFoundError(apierrors.ErrorCodeValidationFailed, "user_id must be an UUID")
	}

	observability.LogEntrySetField(r, "user_id", userID)

	u, err := models.FindUserByID(db, userID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return nil, apierrors.NewNotFoundError(apierrors.ErrorCodeUserNotFound, "User not found")
		}
		return nil, apierrors.NewInternalServerError("Database error loading user").WithInternalError(err)
	}

	return withUser(ctx, u), nil
}

// Use only after requireAuthentication, so that there is a valid user
func (a *API) loadFactor(w http.ResponseWriter, r *http.Request) (context.Context, error) {
	ctx := r.Context()
	db := a.db.WithContext(ctx)
	user := getUser(ctx)
	factorID, err := uuid.FromString(chi.URLParam(r, "factor_id"))
	if err != nil {
		return nil, apierrors.NewNotFoundError(apierrors.ErrorCodeValidationFailed, "factor_id must be an UUID")
	}

	observability.LogEntrySetField(r, "factor_id", factorID)

	factor, err := user.FindOwnedFactorByID(db, factorID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return nil, apierrors.NewNotFoundError(apierrors.ErrorCodeMFAFactorNotFound, "Factor not found")
		}
		return nil, apierrors.NewInternalServerError("Database error loading factor").WithInternalError(err)
	}
	return withFactor(ctx, factor), nil
}

func (a *API) getAdminParams(r *http.Request) (*AdminUserParams, error) {
	params := &AdminUserParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return nil, err
	}

	return params, nil
}

// useCursorPagination reports whether the request should be served with
// cursor-based (keyset) pagination. It requires the experimental flag to be on
// and neither offset-style param (`page`, `per_page`) present, so existing
// clients that page by number keep the offset behavior.
func (a *API) useCursorPagination(r *http.Request) bool {
	if !a.config.Experimental.CursorPaginationEnabled {
		return false
	}
	query := r.URL.Query()
	return query.Get("page") == "" && query.Get("per_page") == ""
}

// adminUsers responds with a list of all users in a given audience
func (a *API) adminUsers(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)
	aud := a.requestAud(ctx, r)

	sortParams, err := sort(r, map[string]bool{models.CreatedAt: true}, []models.SortField{{Name: models.CreatedAt, Dir: models.Descending}})
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Bad Sort Parameters: %v", err)
	}

	filter := r.URL.Query().Get("filter")

	if a.useCursorPagination(r) {
		return a.adminUsersKeyset(w, r, db, aud, sortParams, filter)
	}

	pageParams, err := paginate(r)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Bad Pagination Parameters: %v", err).WithInternalError(err)
	}

	users, err := models.FindUsersInAudience(db, aud, pageParams, sortParams, filter)
	if err != nil {
		return apierrors.NewInternalServerError("Database error finding users").WithInternalError(err)
	}
	addPaginationHeaders(w, r, pageParams)

	return sendJSON(w, http.StatusOK, AdminListUsersResponse{
		Users: users,
		Aud:   aud,
	})
}

// adminUsersKeyset serves the admin user list with cursor-based pagination:
// no COUNT(*) and no OFFSET. It fetches Limit+1 rows to detect whether another
// page exists, trims to Limit, and emits the next cursor via both the response
// body and a Link: rel="next" header.
func (a *API) adminUsersKeyset(w http.ResponseWriter, r *http.Request, db *storage.Connection, aud string, sortParams *models.SortParams, filter string) error {
	p, err := parseKeysetParams(r)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Bad Pagination Parameters: %v", err).WithInternalError(err)
	}

	users, err := models.FindUsersInAudienceKeyset(db, aud, p, sortParams, filter)
	if err != nil {
		return apierrors.NewInternalServerError("Database error finding users").WithInternalError(err)
	}

	hasMore := uint64(len(users)) > p.Limit
	var nextCursor *Cursor
	if hasMore {
		users = users[:p.Limit]
		last := users[len(users)-1]
		nextCursor = &Cursor{CreatedAt: last.CreatedAt, ID: last.ID}
	}

	addKeysetPaginationHeaders(w, r, nextCursor)

	pagination := &CursorPaginationResponse{HasMore: hasMore}
	if nextCursor != nil {
		pagination.NextCursor = nextCursor.String()
	}

	return sendJSON(w, http.StatusOK, AdminListUsersResponse{
		Users:      users,
		Aud:        aud,
		Pagination: pagination,
	})
}

// adminUserGet returns information about a single user
func (a *API) adminUserGet(w http.ResponseWriter, r *http.Request) error {
	user := getUser(r.Context())

	return sendJSON(w, http.StatusOK, user)
}

// adminUserUpdate updates a single user object
func (a *API) adminUserUpdate(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)
	config := a.config
	user := getUser(ctx)
	adminUser := getAdminUser(ctx)
	params, err := a.getAdminParams(r)
	if err != nil {
		return err
	}

	if params.Email != "" {
		params.Email, err = a.validateEmail(params.Email)
		if err != nil {
			return err
		}
	}

	if params.Phone != "" {
		params.Phone, err = validatePhone(params.Phone)
		if err != nil {
			return err
		}
	}

	var banDuration *time.Duration
	if params.BanDuration != "" {
		duration := time.Duration(0)
		if params.BanDuration != "none" {
			duration, err = time.ParseDuration(params.BanDuration)
			if err != nil {
				return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "invalid format for ban duration: %v", err)
			}
		}
		banDuration = &duration
	}

	// must be evaluated before setting password below (via user.SetPassword)
	addingFirstPassword := params.Password != nil && *params.Password != "" && !user.HasPassword()

	if params.Password != nil {
		password := *params.Password

		if err := a.checkPasswordStrength(ctx, password); err != nil {
			return err
		}

		if err := user.SetPassword(ctx, password, config.Security.DBEncryption.Encrypt, config.Security.DBEncryption.EncryptionKeyID, config.Security.DBEncryption.EncryptionKey); err != nil {
			return err
		}
	}

	err = db.Transaction(func(tx *storage.Connection) error {
		if params.Role != "" {
			if terr := user.SetRole(tx, params.Role); terr != nil {
				return terr
			}
		}

		if params.EmailConfirm {
			if terr := user.Confirm(tx); terr != nil {
				return terr
			}
		}

		if params.PhoneConfirm {
			if terr := user.ConfirmPhone(tx); terr != nil {
				return terr
			}
		}

		if params.Password != nil {
			if terr := user.UpdatePassword(tx, nil); terr != nil {
				return terr
			}
		}

		var identities []models.Identity
		if params.Email != "" {
			if identity, terr := models.FindIdentityByIdAndProvider(tx, user.ID.String(), EmailProvider); terr != nil && !models.IsNotFoundError(terr) {
				return terr
			} else if identity == nil {
				// if the user doesn't have an existing email
				// then updating the user's email should create a new email identity
				i, terr := a.createNewIdentity(tx, user, EmailProvider, structs.Map(provider.Claims{
					Subject:       user.ID.String(),
					Email:         params.Email,
					EmailVerified: params.EmailConfirm,
				}))
				if terr != nil {
					return terr
				}
				identities = append(identities, *i)
			} else {
				// update the existing email identity
				if terr := identity.UpdateIdentityData(tx, map[string]interface{}{
					"email":          params.Email,
					"email_verified": params.EmailConfirm,
				}); terr != nil {
					return terr
				}
			}
			if user.IsAnonymous && params.EmailConfirm {
				user.IsAnonymous = false
				if terr := tx.UpdateOnly(user, "is_anonymous"); terr != nil {
					return terr
				}
			}

			if terr := user.SetEmail(tx, params.Email); terr != nil {
				return terr
			}
		}

		if params.Phone != "" {
			if identity, terr := models.FindIdentityByIdAndProvider(tx, user.ID.String(), PhoneProvider); terr != nil && !models.IsNotFoundError(terr) {
				return terr
			} else if identity == nil {
				// if the user doesn't have an existing phone
				// then updating the user's phone should create a new phone identity
				identity, terr := a.createNewIdentity(tx, user, PhoneProvider, structs.Map(provider.Claims{
					Subject:       user.ID.String(),
					Phone:         params.Phone,
					PhoneVerified: params.PhoneConfirm,
				}))
				if terr != nil {
					return terr
				}
				identities = append(identities, *identity)
			} else {
				// update the existing phone identity
				if terr := identity.UpdateIdentityData(tx, map[string]interface{}{
					"phone":          params.Phone,
					"phone_verified": params.PhoneConfirm,
				}); terr != nil {
					return terr
				}
			}
			if user.IsAnonymous && params.PhoneConfirm {
				user.IsAnonymous = false
				if terr := tx.UpdateOnly(user, "is_anonymous"); terr != nil {
					return terr
				}
			}
			if terr := user.SetPhone(tx, params.Phone); terr != nil {
				return terr
			}
		}

		// Reassigning a user's email or phone changes the account's contact
		// method, so any outstanding recovery/confirmation/email-change/
		// phone-change tokens issued before the change can no longer be
		// trusted (e.g. a recovery link still deliverable to the old
		// mailbox). Clear them, matching the treatment the password branch
		// above and UpdateUserEmailFromIdentities already apply.
		if params.Email != "" || params.Phone != "" {
			if terr := user.ClearAllPendingTokens(tx); terr != nil {
				return terr
			}
		}
		user.Identities = append(user.Identities, identities...)

		if addingFirstPassword {
			if terr := a.ensureEmailIdentityForPassword(tx, user); terr != nil {
				return terr
			}
		}

		if params.AppMetaData != nil {
			if terr := user.UpdateAppMetaData(tx, params.AppMetaData); terr != nil {
				return terr
			}
		}

		if params.UserMetaData != nil {
			if terr := user.UpdateUserMetaData(tx, params.UserMetaData); terr != nil {
				return terr
			}
		}

		if banDuration != nil {
			if terr := user.Ban(tx, *banDuration); terr != nil {
				return terr
			}
		}

		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, adminUser, models.UserModifiedAction, "", map[string]interface{}{
			"user_id":    user.ID,
			"user_email": user.Email,
			"user_phone": user.Phone,
		}); terr != nil {
			return terr
		}
		return nil
	})

	if err != nil {
		return apierrors.NewInternalServerError("Error updating user").WithInternalError(err)
	}

	return sendJSON(w, http.StatusOK, user)
}

// adminUserCreate creates a new user based on the provided data
func (a *API) adminUserCreate(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)
	config := a.config

	adminUser := getAdminUser(ctx)
	params, err := a.getAdminParams(r)
	if err != nil {
		return err
	}

	aud := a.requestAud(ctx, r)
	if params.Aud != "" {
		aud = params.Aud
	}

	if params.Email == "" && params.Phone == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Cannot create a user without either an email or phone")
	}

	var providers []string
	if params.Email != "" {
		params.Email, err = a.validateEmail(params.Email)
		if err != nil {
			return err
		}
		if user, err := models.IsDuplicatedEmail(db, params.Email, aud, nil, config.Experimental.ProviderLinkingDomains); err != nil {
			return apierrors.NewInternalServerError("Database error checking email").WithInternalError(err)
		} else if user != nil {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeEmailExists, DuplicateEmailMsg)
		}
		providers = append(providers, EmailProvider)
	}

	if params.Phone != "" {
		params.Phone, err = validatePhone(params.Phone)
		if err != nil {
			return err
		}
		if exists, err := models.IsDuplicatedPhone(db, params.Phone, aud); err != nil {
			return apierrors.NewInternalServerError("Database error checking phone").WithInternalError(err)
		} else if exists {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodePhoneExists, "Phone number already registered by another user")
		}
		providers = append(providers, PhoneProvider)
	}

	if params.Password != nil && params.PasswordHash != "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Only a password or a password hash should be provided")
	}

	// Enforce the configured password strength policy on a client-supplied
	// plaintext password, matching adminUserUpdate.
	if params.Password != nil && *params.Password != "" {
		if err := a.checkPasswordStrength(ctx, *params.Password); err != nil {
			return err
		}
	}

	if (params.Password == nil || *params.Password == "") && params.PasswordHash == "" {
		password, err := password.Generate(64, 10, 0, false, true)
		if err != nil {
			return apierrors.NewInternalServerError("Error generating password").WithInternalError(err)
		}
		params.Password = &password
	}

	var user *models.User
	if params.PasswordHash != "" {
		user, err = models.NewUserWithPasswordHash(params.Phone, params.Email, params.PasswordHash, aud, params.UserMetaData)
	} else {
		user, err = models.NewUser(params.Phone, params.Email, *params.Password, aud, params.UserMetaData)
	}

	if err != nil {
		if errors.Is(err, bcrypt.ErrPasswordTooLong) {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "%s", err.Error())
		}
		return apierrors.NewInternalServerError("Error creating user").WithInternalError(err)
	}

	if params.Id != "" {
		customId, err := uuid.FromString(params.Id)
		if err != nil {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "ID must conform to the uuid v4 format")
		}
		if customId == uuid.Nil {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "ID cannot be a nil uuid")
		}
		user.ID = customId
	}

	user.AppMetaData = map[string]interface{}{
		// TODO: Deprecate "provider" field
		// default to the first provider in the providers slice
		"provider":  providers[0],
		"providers": providers,
	}

	var banDuration *time.Duration
	if params.BanDuration != "" {
		duration := time.Duration(0)
		if params.BanDuration != "none" {
			duration, err = time.ParseDuration(params.BanDuration)
			if err != nil {
				return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "invalid format for ban duration: %v", err)
			}
		}
		banDuration = &duration
	}

	err = db.Transaction(func(tx *storage.Connection) error {
		if terr := tx.Create(user); terr != nil {
			return terr
		}

		var identities []models.Identity
		if user.GetEmail() != "" {
			identity, terr := a.createNewIdentity(tx, user, EmailProvider, structs.Map(provider.Claims{
				Subject: user.ID.String(),
				Email:   user.GetEmail(),
			}))

			if terr != nil {
				return terr
			}
			identities = append(identities, *identity)
		}

		if user.GetPhone() != "" {
			identity, terr := a.createNewIdentity(tx, user, PhoneProvider, structs.Map(provider.Claims{
				Subject: user.ID.String(),
				Phone:   user.GetPhone(),
			}))

			if terr != nil {
				return terr
			}
			identities = append(identities, *identity)
		}

		user.Identities = identities

		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, adminUser, models.UserSignedUpAction, "", map[string]interface{}{
			"user_id":    user.ID,
			"user_email": user.Email,
			"user_phone": user.Phone,
			"provider":   providers[0], // complying with the user.AppMetaData["provider"] field as above
		}); terr != nil {
			return terr
		}

		role := config.JWT.DefaultGroupName
		if params.Role != "" {
			role = params.Role
		}
		if terr := user.SetRole(tx, role); terr != nil {
			return terr
		}

		if params.AppMetaData != nil {
			if terr := user.UpdateAppMetaData(tx, params.AppMetaData); terr != nil {
				return terr
			}
		}

		if params.EmailConfirm {
			if terr := user.Confirm(tx); terr != nil {
				return terr
			}
		}

		if params.PhoneConfirm {
			if terr := user.ConfirmPhone(tx); terr != nil {
				return terr
			}
		}

		if banDuration != nil {
			if terr := user.Ban(tx, *banDuration); terr != nil {
				return terr
			}
		}

		return nil
	})

	if err != nil {
		return apierrors.NewInternalServerError("Database error creating new user").WithInternalError(err)
	}

	return sendJSON(w, http.StatusOK, user)
}

// adminUserDelete deletes a user
func (a *API) adminUserDelete(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	user := getUser(ctx)
	config := a.config
	adminUser := getAdminUser(ctx)
	db := a.db.WithContext(ctx)

	// ShouldSoftDelete defaults to false
	params := &adminUserDeleteParams{}
	if body, _ := utilities.GetBodyBytes(r); len(body) != 0 {
		// we only want to parse the body if it's not empty
		// retrieveRequestParams will handle any errors with stream
		if err := retrieveRequestParams(r, params); err != nil {
			return err
		}
	}

	err := db.Transaction(func(tx *storage.Connection) error {
		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, adminUser, models.UserDeletedAction, "", map[string]interface{}{
			"user_id":    user.ID,
			"user_email": user.Email,
			"user_phone": user.Phone,
		}); terr != nil {
			return apierrors.NewInternalServerError("Error recording audit log entry").WithInternalError(terr)
		}

		if params.ShouldSoftDelete {
			if user.DeletedAt != nil {
				// user has been soft deleted already
				return nil
			}
			if terr := user.SoftDeleteUser(tx); terr != nil {
				return apierrors.NewInternalServerError("Error soft deleting user").WithInternalError(terr)
			}

			if terr := user.SoftDeleteUserIdentities(tx); terr != nil {
				return apierrors.NewInternalServerError("Error soft deleting user identities").WithInternalError(terr)
			}

			// hard delete all associated factors
			if terr := models.DeleteFactorsByUserId(tx, user.ID); terr != nil {
				return apierrors.NewInternalServerError("Error deleting user's factors").WithInternalError(terr)
			}
			// hard delete all associated WebAuthn credentials
			if terr := models.DeleteWebAuthnCredentialsByUserID(tx, user.ID); terr != nil {
				return apierrors.NewInternalServerError("Error deleting user's WebAuthn credentials").WithInternalError(terr)
			}
			// hard delete all associated sessions
			if terr := models.Logout(tx, user.ID); terr != nil {
				return apierrors.NewInternalServerError("Error deleting user's sessions").WithInternalError(terr)
			}
		} else {
			if terr := tx.Destroy(user); terr != nil {
				return apierrors.NewInternalServerError("Database error deleting user").WithInternalError(terr)
			}
		}

		return nil
	})
	if err != nil {
		return err
	}

	return sendJSON(w, http.StatusOK, map[string]interface{}{})
}

func (a *API) adminUserDeleteFactor(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	config := a.config
	user := getUser(ctx)
	factor := getFactor(ctx)
	db := a.db.WithContext(ctx)

	err := db.Transaction(func(tx *storage.Connection) error {
		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.DeleteFactorAction, utilities.GetIPAddress(r), map[string]interface{}{
			"user_id":   user.ID,
			"factor_id": factor.ID,
		}); terr != nil {
			return terr
		}
		if terr := tx.Destroy(factor); terr != nil {
			return apierrors.NewInternalServerError("Database error deleting factor").WithInternalError(terr)
		}
		if terr := factor.DowngradeSessionsToAAL1(tx); terr != nil {
			return apierrors.NewInternalServerError("Database error downgrading sessions").WithInternalError(terr)
		}
		return nil
	})
	if err != nil {
		return err
	}
	return sendJSON(w, http.StatusOK, factor)
}

func (a *API) adminUserGetFactors(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	user := getUser(ctx)
	return sendJSON(w, http.StatusOK, user.Factors)
}

// adminUserUpdate updates a single factor object
func (a *API) adminUserUpdateFactor(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	config := a.config
	factor := getFactor(ctx)
	user := getUser(ctx)
	adminUser := getAdminUser(ctx)
	params := &adminUserUpdateFactorParams{}
	db := a.db.WithContext(ctx)

	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	err := db.Transaction(func(tx *storage.Connection) error {
		if params.FriendlyName != "" {
			if terr := factor.UpdateFriendlyName(tx, params.FriendlyName); terr != nil {
				return terr
			}
		}

		if params.Phone != "" && factor.IsPhoneFactor() {
			phone, err := validatePhone(params.Phone)
			if err != nil {
				return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Invalid phone number format (E.164 required)")
			}
			if terr := factor.UpdatePhone(tx, phone); terr != nil {
				return terr
			}
		}

		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, adminUser, models.UpdateFactorAction, "", map[string]interface{}{
			"user_id":     user.ID,
			"factor_id":   factor.ID,
			"factor_type": factor.FactorType,
		}); terr != nil {
			return terr
		}
		return nil
	})
	if err != nil {
		return err
	}

	return sendJSON(w, http.StatusOK, factor)
}
