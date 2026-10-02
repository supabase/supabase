package api

import (
	"strings"
	"time"

	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/sms_provider"
	mail "github.com/supabase/auth/internal/mailer"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
)

// verifyUserAndTokenFromOTT is the EnableOTTAsSourceOfTruth path. It finds the
// challenge in the one_time_tokens table and derives the user from that row,
// instead of finding the user by identifier and comparing the users.*_token
// columns. A lookup miss is rejected as an expired or invalid token.
func (a *API) verifyUserAndTokenFromOTT(conn *storage.Connection, params *VerifyParams, aud string) (*models.User, error) {
	config := a.config

	// Twilio Verify and test OTPs are verified without a local challenge
	if params.Type == smsVerification || params.Type == phoneChangeVerification {
		if testOTP, ok := config.Sms.GetTestOTP(params.Phone, time.Now()); ok && params.Token == testOTP {
			return a.findUserForTestOTP(conn, params, aud)
		}
		if !config.Hook.SendSMS.Enabled && config.Sms.IsTwilioVerifyProvider() {
			return a.verifyPhoneWithTwilio(conn, params, aud)
		}
	}

	ott, err := a.verifyOneTimeToken(conn, params)
	if err != nil {
		return nil, err
	}

	// Resolve the generic email type to the flow that issued the token, so the caller runs the correct post-verification step.
	params.Type = resolveEmailOTPType(params.Type, ott.TokenType)

	user, err := models.FindUserByID(conn, ott.UserID)
	if models.IsNotFoundError(err) {
		return nil, apierrors.NewForbiddenError(apierrors.ErrorCodeOTPExpired, "Token has expired or is invalid").WithInternalError(err)
	} else if err != nil {
		return nil, apierrors.NewInternalServerError("Database error finding user").WithInternalError(err)
	}

	if err := validateUserForOTT(params, ott, user, aud); err != nil {
		return nil, err
	}

	if user.IsBanned() {
		return nil, apierrors.NewForbiddenError(apierrors.ErrorCodeUserBanned, "User is banned")
	}
	return user, nil
}

func (a *API) verifyPhoneWithTwilio(conn *storage.Connection, params *VerifyParams, aud string) (*models.User, error) {
	tokenType, ok := verifyTypeToTokenType(params.Type)
	if !ok {
		// The caller only routes phone types here, so in practice this should never happen.
		return nil, apierrors.NewInternalServerError("Twilio Verify lookup called for unknown verification type %q", params.Type)
	}

	ott, err := models.FindOneTimeTokenByRelatesTo(conn, params.Phone, tokenType)
	if models.IsNotFoundError(err) {
		return nil, apierrors.NewForbiddenError(apierrors.ErrorCodeOTPExpired, "Token has expired or is invalid").WithInternalError(err)
	} else if err != nil {
		return nil, apierrors.NewInternalServerError("Database error finding one time token").WithInternalError(err)
	}

	user, err := models.FindUserByID(conn, ott.UserID)
	if models.IsNotFoundError(err) {
		return nil, apierrors.NewForbiddenError(apierrors.ErrorCodeOTPExpired, "Token has expired or is invalid").WithInternalError(err)
	} else if err != nil {
		return nil, apierrors.NewInternalServerError("Database error finding user").WithInternalError(err)
	}

	if err := validateUserForOTT(params, ott, user, aud); err != nil {
		return nil, err
	}

	if user.IsBanned() {
		return nil, apierrors.NewForbiddenError(apierrors.ErrorCodeUserBanned, "User is banned")
	}
	if err := a.verifyOTPWithTwilio(params.Phone, params.Token); err != nil {
		return nil, apierrors.NewForbiddenError(apierrors.ErrorCodeOTPExpired, "Token has expired or is invalid").WithInternalError(err)
	}
	return user, nil
}

// findUserForTestOTP resolves the user for a phone verification whose code
// matched a configured test OTP. A test OTP has no local challenge.
func (a *API) findUserForTestOTP(conn *storage.Connection, params *VerifyParams, aud string) (*models.User, error) {
	var user *models.User
	var err error

	switch params.Type {
	case phoneChangeVerification:
		user, err = models.FindUserByPhoneChangeAndAudience(conn, params.Phone, aud)
	case smsVerification:
		user, err = models.FindUserByPhoneAndAudience(conn, params.Phone, aud)
	default:
		// The caller only routes phone types here, so in practice this should never happen.
		return nil, apierrors.NewInternalServerError("Test OTP lookup called for non-phone verification type %q", params.Type)
	}
	if models.IsNotFoundError(err) {
		return nil, apierrors.NewForbiddenError(apierrors.ErrorCodeOTPExpired, "Token has expired or is invalid").WithInternalError(err)
	} else if err != nil {
		return nil, apierrors.NewInternalServerError("Database error finding user").WithInternalError(err)
	}

	if user.IsBanned() {
		return nil, apierrors.NewForbiddenError(apierrors.ErrorCodeUserBanned, "User is banned")
	}
	return user, nil
}

// verifyOTPWithTwilio asks Twilio Verify to check the code. Twilio generates
// and delivers its own code, so there is no local challenge to compare.
func (a *API) verifyOTPWithTwilio(phone, code string) error {
	smsProvider, err := sms_provider.GetSmsProvider(*a.config)
	if err != nil {
		return apierrors.NewInternalServerError("Failed to get SMS provider").WithInternalError(err)
	}
	twilioVerify, ok := smsProvider.(*sms_provider.TwilioVerifyProvider)
	if !ok {
		return apierrors.NewInternalServerError("SMS provider is not Twilio Verify")
	}
	if err := twilioVerify.VerifyOTP(phone, code); err != nil {
		return apierrors.NewForbiddenError(apierrors.ErrorCodeOTPExpired, "Token has expired or is invalid").WithInternalError(err)
	}
	return nil
}

func (a *API) verifyOneTimeToken(conn *storage.Connection, params *VerifyParams) (*models.OneTimeToken, error) {
	tokenTypes := verifyTypeToTokenTypes(params.Type, a.config.Mailer.SecureEmailChangeEnabled)
	if len(tokenTypes) == 0 {
		return nil, apierrors.NewForbiddenError(apierrors.ErrorCodeOTPExpired, "Token has expired or is invalid").WithInternalMessage("unknown verification type")
	}

	ott, err := models.FindOneTimeTokenWithPKCEFallback(conn, params.TokenHash, tokenTypes...)
	if models.IsNotFoundError(err) {
		return nil, apierrors.NewForbiddenError(apierrors.ErrorCodeOTPExpired, "Token has expired or is invalid").WithInternalMessage("one time token not found")
	} else if err != nil {
		return nil, apierrors.NewInternalServerError("Database error finding one time token").WithInternalError(err)
	}

	if ott.IsExpired() {
		return nil, apierrors.NewForbiddenError(apierrors.ErrorCodeOTPExpired, "Token has expired or is invalid").WithInternalMessage("one time token has expired")
	}

	return ott, nil
}

// verifyTypeToTokenTypes returns nil for an unknown verification type.
func verifyTypeToTokenTypes(verifyType string, secureEmailChangeEnabled bool) []models.OneTimeTokenType {
	switch verifyType {
	case mail.EmailOTPVerification:
		return []models.OneTimeTokenType{models.ConfirmationToken, models.RecoveryToken}
	case mail.EmailChangeVerification:
		// Secure email change off: accept the new address token only, as FindUserForEmailChange does.
		if !secureEmailChangeEnabled {
			return []models.OneTimeTokenType{models.EmailChangeTokenNew}
		}
		return []models.OneTimeTokenType{models.EmailChangeTokenCurrent, models.EmailChangeTokenNew}
	}

	tokenType, ok := verifyTypeToTokenType(verifyType)
	if !ok {
		return nil
	}
	return []models.OneTimeTokenType{tokenType}
}

// verifyTypeToTokenType maps a verification type that has exactly one token
// type. ok is false for an unknown type. ConfirmationToken is the zero value of
// OneTimeTokenType, so callers must check ok instead of the returned type.
func verifyTypeToTokenType(verifyType string) (models.OneTimeTokenType, bool) {
	switch verifyType {
	case mail.SignupVerification, mail.InviteVerification:
		return models.ConfirmationToken, true
	case mail.RecoveryVerification, mail.MagicLinkVerification:
		return models.RecoveryToken, true
	case smsVerification:
		// phone signup codes are stored as confirmation tokens
		return models.ConfirmationToken, true
	case phoneChangeVerification:
		return models.PhoneChangeToken, true
	default:
		return 0, false
	}
}

func resolveEmailOTPType(verifyType string, tokenType models.OneTimeTokenType) string {
	if verifyType == mail.EmailOTPVerification {
		switch tokenType {
		case models.ConfirmationToken:
			return mail.SignupVerification
		case models.RecoveryToken:
			return mail.MagicLinkVerification
		}
	}
	return verifyType
}

// validateUserForOTT checks that the user found from a one_time_tokens row is
// the one the request is entitled to act on.
//
// The legacy path gets these guarantees for free from its identifier-keyed lookups (which also filter on
// aud and is_sso_user), so a mismatch there is a not-found.
//
// The one_time_tokens path finds the user by token hash, so it has to check the binding itself.
func validateUserForOTT(params *VerifyParams, ott *models.OneTimeToken, user *models.User, aud string) error {
	mismatch := apierrors.NewForbiddenError(apierrors.ErrorCodeOTPExpired, "Token has expired or is invalid")

	if user.IsSSOUser {
		return mismatch.WithInternalMessage("SSO users cannot be verified with one time tokens")
	}

	if user.Aud != aud {
		return mismatch.WithInternalMessage("user audience does not match")
	}

	switch params.Type {
	case smsVerification:
		if params.Phone == "" || user.GetPhone() != params.Phone {
			return mismatch.WithInternalMessage("user phone does not match")
		}
	case phoneChangeVerification:
		if params.Phone == "" || user.PhoneChange != params.Phone {
			return mismatch.WithInternalMessage("user phone does not match")
		}
	case mail.EmailChangeVerification:
		expected := user.EmailChange
		if ott.TokenType == models.EmailChangeTokenCurrent {
			expected = user.GetEmail()
		}
		if params.Email == "" || !strings.EqualFold(expected, params.Email) {
			return mismatch.WithInternalMessage("user email does not match")
		}
	default: // Signup, Invite, Recovery, MagicLink
		if params.Email == "" || !strings.EqualFold(user.GetEmail(), params.Email) {
			return mismatch.WithInternalMessage("user email does not match")
		}
	}
	return nil
}
