package mailer

import (
	"context"
	"net/http"
	"net/url"

	"github.com/supabase/auth/internal/models"
)

const (
	SignupVerification             = "signup"
	RecoveryVerification           = "recovery"
	InviteVerification             = "invite"
	MagicLinkVerification          = "magiclink"
	EmailChangeVerification        = "email_change"
	EmailOTPVerification           = "email"
	EmailChangeCurrentVerification = "email_change_current"
	EmailChangeNewVerification     = "email_change_new"
	ReauthenticationVerification   = "reauthentication"

	// Account Changes Notifications
	PasswordChangedNotification     = "password_changed_notification"
	EmailChangedNotification        = "email_changed_notification"
	PhoneChangedNotification        = "phone_changed_notification"
	IdentityLinkedNotification      = "identity_linked_notification"
	IdentityUnlinkedNotification    = "identity_unlinked_notification"
	MFAFactorEnrolledNotification   = "mfa_factor_enrolled_notification"
	MFAFactorUnenrolledNotification = "mfa_factor_unenrolled_notification"
)

// Mailer defines the interface a mailer must implement.
type Mailer interface {
	InviteMail(r *http.Request, user *models.User, otp, referrerURL string, externalURL *url.URL) error
	ConfirmationMail(r *http.Request, user *models.User, otp, referrerURL string, externalURL *url.URL) error
	RecoveryMail(r *http.Request, user *models.User, otp, referrerURL string, externalURL *url.URL) error
	MagicLinkMail(r *http.Request, user *models.User, otp, referrerURL string, externalURL *url.URL) error
	EmailChangeMail(r *http.Request, user *models.User, otpNew, otpCurrent, referrerURL string, externalURL *url.URL) error
	ReauthenticateMail(r *http.Request, user *models.User, otp string) error
	GetEmailActionLink(user *models.User, actionType, referrerURL string, externalURL *url.URL) (string, error)

	// Account Changes Notifications
	PasswordChangedNotificationMail(r *http.Request, user *models.User) error
	EmailChangedNotificationMail(r *http.Request, user *models.User, oldEmail string) error
	PhoneChangedNotificationMail(r *http.Request, user *models.User, oldPhone string) error
	IdentityLinkedNotificationMail(r *http.Request, user *models.User, provider string) error
	IdentityUnlinkedNotificationMail(r *http.Request, user *models.User, provider, recipientEmail string) error
	MFAFactorEnrolledNotificationMail(r *http.Request, user *models.User, factorType string) error
	MFAFactorUnenrolledNotificationMail(r *http.Request, user *models.User, factorType string) error
}

// TODO(cstockton): Mail(...) -> Mail(Email{...}) ?
type Client interface {
	Mail(
		ctx context.Context,
		to string,
		subject string,
		body string,
		headers map[string][]string,
		typ string,
	) error
}

type EmailData struct {
	Token           string `json:"token"`
	TokenHash       string `json:"token_hash"`
	RedirectTo      string `json:"redirect_to"`
	EmailActionType string `json:"email_action_type"`
	SiteURL         string `json:"site_url"`
	TokenNew        string `json:"token_new"`
	TokenHashNew    string `json:"token_hash_new"`
	OldEmail        string `json:"old_email"`
	OldPhone        string `json:"old_phone"`
	Provider        string `json:"provider"`
	FactorType      string `json:"factor_type"`
}
