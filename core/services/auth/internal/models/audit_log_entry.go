package models

import (
	"bytes"
	"fmt"
	"net/http"
	"time"

	"maps"

	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/observability"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/utilities"
)

type AuditAction string
type auditLogType string

const (
	LoginAction                     AuditAction = "login"
	LogoutAction                    AuditAction = "logout"
	InviteAcceptedAction            AuditAction = "invite_accepted"
	UserSignedUpAction              AuditAction = "user_signedup"
	UserInvitedAction               AuditAction = "user_invited"
	UserDeletedAction               AuditAction = "user_deleted"
	UserModifiedAction              AuditAction = "user_modified"
	UserRecoveryRequestedAction     AuditAction = "user_recovery_requested"
	UserReauthenticateAction        AuditAction = "user_reauthenticate_requested"
	UserConfirmationRequestedAction AuditAction = "user_confirmation_requested"
	UserRepeatedSignUpAction        AuditAction = "user_repeated_signup"
	UserUpdatePasswordAction        AuditAction = "user_updated_password"
	TokenRevokedAction              AuditAction = "token_revoked"
	TokenRefreshedAction            AuditAction = "token_refreshed"
	EnrollFactorAction              AuditAction = "factor_in_progress"
	UnenrollFactorAction            AuditAction = "factor_unenrolled"
	CreateChallengeAction           AuditAction = "challenge_created"
	VerifyFactorAction              AuditAction = "verification_attempted"
	DeleteFactorAction              AuditAction = "factor_deleted"
	UpdateFactorAction              AuditAction = "factor_updated"
	IdentityLinkAction              AuditAction = "identity_linked"
	IdentityUnlinkAction            AuditAction = "identity_unlinked"
	PasskeyCreatedAction            AuditAction = "passkey_created"
	PasskeyUpdatedAction            AuditAction = "passkey_updated"
	PasskeyDeletedAction            AuditAction = "passkey_deleted"
	RecoveryCodesGeneratedAction    AuditAction = "recovery_codes_generated"
	RecoveryCodesVerifiedAction     AuditAction = "recovery_codes_verified"
	RecoveryCodesRegeneratedAction  AuditAction = "recovery_codes_regenerated"
	RecoveryCodesDeletedAction      AuditAction = "recovery_codes_deleted"

	account auditLogType = "account"
	team    auditLogType = "team"
	token   auditLogType = "token"
	user    auditLogType = "user"
	factor  auditLogType = "factor"
)

var ActionLogTypeMap = map[AuditAction]auditLogType{
	LoginAction:                     account,
	LogoutAction:                    account,
	InviteAcceptedAction:            account,
	UserSignedUpAction:              team,
	UserInvitedAction:               team,
	UserDeletedAction:               team,
	TokenRevokedAction:              token,
	TokenRefreshedAction:            token,
	UserModifiedAction:              user,
	UserRecoveryRequestedAction:     user,
	UserReauthenticateAction:        user,
	UserConfirmationRequestedAction: user,
	UserRepeatedSignUpAction:        user,
	UserUpdatePasswordAction:        user,
	IdentityLinkAction:              user,
	IdentityUnlinkAction:            user,
	EnrollFactorAction:              factor,
	UnenrollFactorAction:            factor,
	CreateChallengeAction:           factor,
	VerifyFactorAction:              factor,
	DeleteFactorAction:              factor,
	UpdateFactorAction:              factor,
	RecoveryCodesGeneratedAction:    factor,
	RecoveryCodesVerifiedAction:     factor,
	RecoveryCodesRegeneratedAction:  factor,
	RecoveryCodesDeletedAction:      factor,
	PasskeyCreatedAction:            user,
	PasskeyUpdatedAction:            user,
	PasskeyDeletedAction:            user,
}

// AuditLogEntry is the database model for audit log entries.
type AuditLogEntry struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Payload   JSONMap   `json:"payload" db:"payload"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	IPAddress string    `json:"ip_address" db:"ip_address"`

	DONTUSEINSTANCEID uuid.UUID `json:"-" db:"instance_id"`
}

func (AuditLogEntry) TableName() string {
	tableName := "audit_log_entries"
	return tableName
}

func NewAuditLogEntry(config conf.AuditLogConfiguration, r *http.Request, tx *storage.Connection, actor *User, action AuditAction, ipAddress string, traits map[string]interface{}) error {
	id := uuid.Must(uuid.NewV4())

	username := actor.GetEmail()

	if actor.GetPhone() != "" {
		username = actor.GetPhone()
	}

	payload := map[string]interface{}{
		"actor_id":       actor.ID,
		"actor_via_sso":  actor.IsSSOUser,
		"actor_username": username,
		"action":         action,
		"log_type":       ActionLogTypeMap[action],
	}

	if name, ok := actor.UserMetaData["full_name"]; ok {
		payload["actor_name"] = name
	}

	if traits != nil {
		payload["traits"] = traits
	}

	observability.LogEntrySetFields(r, logrus.Fields{
		"auth_event": logrus.Fields(payload),
	})

	// AUDIT LOGGING FIX: Log each audit event immediately as a separate log entry
	//
	// BUG: The observability.LogEntrySetFields() above adds to request context, causing
	// multiple audit events in the same request to overwrite each other. For example,
	// refresh token requests call NewAuditLogEntry() twice (token_refreshed, then
	// token_revoked) but only the last event (token_revoked) was logged.
	//
	// SOLUTION: Create immediate separate log entries with "auth_audit_event" key.
	// This ensures all audit events are captured without overwriting.
	//
	// TRANSITION: We keep the existing "auth_event" for backward compatibility during
	// the transition period. This fix may impact metrics that count audit events,
	// as previously missing events (like token_refreshed) will now appear in logs.
	// Eventually, we should remove the observability.LogEntrySetFields() call above
	// once new logging is proven stable.
	auditLogPayload := make(map[string]interface{})
	maps.Copy(auditLogPayload, payload)
	auditLogPayload["audit_log_id"] = id
	auditLogPayload["ip_address"] = ipAddress
	auditLogPayload["created_at"] = time.Now().UTC()

	if requestID := utilities.GetRequestID(r.Context()); requestID != "" {
		auditLogPayload["request_id"] = requestID
	}
	if userAgent := r.Header.Get("User-Agent"); userAgent != "" {
		auditLogPayload["user_agent"] = userAgent
	}
	logrus.WithFields(logrus.Fields{
		"auth_audit_event": auditLogPayload,
	}).Info("audit_event")

	if config.DisablePostgres {
		return nil
	}

	l := AuditLogEntry{
		ID:        id,
		Payload:   JSONMap(payload),
		IPAddress: ipAddress,
	}

	if err := tx.Create(&l); err != nil {
		return errors.Wrap(err, "Database error creating audit log entry")
	}

	return nil
}

func FindAuditLogEntries(tx *storage.Connection, filterColumns []string, filterValue string, pageParams *Pagination) ([]*AuditLogEntry, error) {
	q := tx.Q().Order("created_at desc").Where("instance_id = ?", uuid.Nil)

	if len(filterColumns) > 0 && filterValue != "" {
		lf := "%" + filterValue + "%"

		builder := bytes.NewBufferString("(")
		values := make([]interface{}, len(filterColumns))

		for idx, col := range filterColumns {
			fmt.Fprintf(builder, "payload->>'%s' ILIKE ?", col)
			values[idx] = lf

			if idx+1 < len(filterColumns) {
				builder.WriteString(" OR ")
			}
		}
		builder.WriteString(")")

		q = q.Where(builder.String(), values...)
	}

	logs := []*AuditLogEntry{}
	var err error
	if pageParams != nil {
		err = q.Paginate(int(pageParams.Page), int(pageParams.PerPage)).All(&logs) // #nosec G115
		pageParams.Count = uint64(q.Paginator.TotalEntriesSize)                    // #nosec G115
	} else {
		err = q.All(&logs)
	}

	return logs, err
}
