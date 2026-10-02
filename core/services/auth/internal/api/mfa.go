package api

import (
	"bytes"
	"crypto/subtle"
	"encoding/json"
	"net/http"
	"net/url"
	"time"

	"github.com/aaronarduino/goqrsvg"
	svg "github.com/ajstarks/svgo"
	"github.com/boombuler/barcode/qr"
	wbnprotocol "github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/gofrs/uuid"
	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/sms_provider"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/crypto"
	"github.com/supabase/auth/internal/hooks/v0hooks"
	"github.com/supabase/auth/internal/metering"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
	"github.com/supabase/auth/internal/utilities"
)

const DefaultQRSize = 3

type EnrollFactorParams struct {
	FriendlyName string `json:"friendly_name"`
	FactorType   string `json:"factor_type"`
	Issuer       string `json:"issuer"`
	Phone        string `json:"phone"`
}

type TOTPObject struct {
	QRCode string `json:"qr_code,omitempty"`
	Secret string `json:"secret,omitempty"`
	URI    string `json:"uri,omitempty"`
}

type EnrollFactorResponse struct {
	ID           uuid.UUID   `json:"id"`
	Type         string      `json:"type"`
	FriendlyName string      `json:"friendly_name"`
	TOTP         *TOTPObject `json:"totp,omitempty"`
	Phone        string      `json:"phone,omitempty"`
}

type ChallengeFactorParams struct {
	Channel  string          `json:"channel"`
	WebAuthn *WebAuthnParams `json:"webauthn,omitempty"`
}

type VerifyFactorParams struct {
	ChallengeID uuid.UUID       `json:"challenge_id"`
	Code        string          `json:"code"`
	WebAuthn    *WebAuthnParams `json:"webauthn,omitempty"`
}

type ChallengeFactorResponse struct {
	ID        uuid.UUID              `json:"id"`
	Type      string                 `json:"type"`
	ExpiresAt int64                  `json:"expires_at,omitempty"`
	WebAuthn  *WebAuthnChallengeData `json:"webauthn,omitempty"`
}

type WebAuthnChallengeData struct {
	Type              string      `json:"type"` // "create" or "request"
	CredentialOptions interface{} `json:"credential_options"`
}

type WebAuthnParams struct {
	Type               string          `json:"type"` // "create" or "request"
	CredentialResponse json.RawMessage `json:"credential_response"`
}

type UnenrollFactorResponse struct {
	ID uuid.UUID `json:"id"`
}

func (a *API) getWebAuthnMFA() (*webauthn.WebAuthn, error) {
	rpConfig := a.config.WebAuthn

	return webauthn.New(&webauthn.Config{
		RPDisplayName: rpConfig.RPDisplayName,
		RPID:          rpConfig.RPID,
		RPOrigins:     rpConfig.RPOrigins,
	})
}

const (
	QRCodeGenerationErrorMessage = "Error generating QR Code"
)

func validateFactors(db *storage.Connection, user *models.User, newFactorName string, config *conf.GlobalConfiguration, session *models.Session) error {
	if err := models.DeleteExpiredFactors(db, config.MFA.FactorExpiryDuration); err != nil {
		return err
	}
	if err := db.Load(user, "Factors"); err != nil {
		return err
	}
	factorCount := len(user.Factors)
	numVerifiedFactors := 0

	for _, factor := range user.Factors {
		if factor.FriendlyName == newFactorName {
			return apierrors.NewUnprocessableEntityError(
				apierrors.ErrorCodeMFAFactorNameConflict,
				"A factor with the friendly name %q for this user already exists", newFactorName,
			)
		}
		if factor.IsVerified() {
			numVerifiedFactors++
		}
	}

	if factorCount >= int(config.MFA.MaxEnrolledFactors) {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeTooManyEnrolledMFAFactors, "Maximum number of verified factors reached, unenroll to continue")
	}

	if numVerifiedFactors >= config.MFA.MaxVerifiedFactors {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeTooManyEnrolledMFAFactors, "Maximum number of verified factors reached, unenroll to continue")
	}

	if numVerifiedFactors > 0 && session != nil && !session.IsAAL2() {
		return apierrors.NewForbiddenError(apierrors.ErrorCodeInsufficientAAL, "AAL2 required to enroll a new factor")
	}

	return nil
}

func isFactorTypeVerifyEnabled(config *conf.GlobalConfiguration, factorType string) bool {
	switch factorType {
	case models.TOTP:
		return config.MFA.TOTP.VerifyEnabled
	case models.Phone:
		return config.MFA.Phone.VerifyEnabled
	case models.WebAuthn:
		return config.MFA.WebAuthn.VerifyEnabled
	case models.RecoveryCode:
		return config.MFA.RecoveryCodes.VerifyEnabled
	default:
		return false
	}
}

// hasUsableNonRecoveryFactor reports whether the user has a second factor,
// other than recovery codes, that can actually be used at sign-in (verified and enabled in config).
func hasUsableNonRecoveryFactor(config *conf.GlobalConfiguration, factors []models.Factor, excludeID uuid.UUID) bool {
	for _, f := range factors {
		if f.ID == excludeID || !f.IsVerified() || f.IsRecoveryCodeFactor() {
			continue
		}

		if isFactorTypeVerifyEnabled(config, f.FactorType) {
			return true
		}
	}

	return false
}

func (a *API) enrollPhoneFactor(w http.ResponseWriter, r *http.Request, params *EnrollFactorParams) error {
	ctx := r.Context()
	config := a.config
	user := getUser(ctx)
	session := getSession(ctx)
	db := a.db.WithContext(ctx)
	if params.Phone == "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Phone number required to enroll Phone factor")
	}

	phone, err := validatePhone(params.Phone)
	if err != nil {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Invalid phone number format (E.164 required)")
	}

	var factorsToDelete []models.Factor
	for _, factor := range user.Factors {
		if factor.IsPhoneFactor() && factor.Phone.String() == phone {
			if factor.IsVerified() {
				return apierrors.NewUnprocessableEntityError(
					apierrors.ErrorCodeMFAVerifiedFactorExists,
					"A verified phone factor already exists, unenroll the existing factor to continue",
				)
			} else if factor.IsUnverified() {
				factorsToDelete = append(factorsToDelete, factor)
			}
		}
	}

	if err := db.Destroy(&factorsToDelete); err != nil {
		return apierrors.NewInternalServerError("Database error deleting unverified phone factors").WithInternalError(err)
	}

	if err := validateFactors(db, user, params.FriendlyName, a.config, session); err != nil {
		return err
	}

	factor := models.NewPhoneFactor(user, phone, params.FriendlyName)
	err = db.Transaction(func(tx *storage.Connection) error {
		if terr := tx.Create(factor); terr != nil {
			return terr
		}
		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.EnrollFactorAction, utilities.GetIPAddress(r), map[string]interface{}{
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
	return sendJSON(w, http.StatusOK, &EnrollFactorResponse{
		ID:           factor.ID,
		Type:         models.Phone,
		FriendlyName: factor.FriendlyName,
		Phone:        params.Phone,
	})
}

func (a *API) enrollWebAuthnFactor(w http.ResponseWriter, r *http.Request, params *EnrollFactorParams) error {
	ctx := r.Context()
	user := getUser(ctx)
	config := a.config
	session := getSession(ctx)
	db := a.db.WithContext(ctx)

	if err := validateFactors(db, user, params.FriendlyName, a.config, session); err != nil {
		return err
	}

	factor := models.NewWebAuthnFactor(user, params.FriendlyName)
	err := db.Transaction(func(tx *storage.Connection) error {
		if terr := tx.Create(factor); terr != nil {
			return terr
		}
		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.EnrollFactorAction, utilities.GetIPAddress(r), map[string]interface{}{
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
	return sendJSON(w, http.StatusOK, &EnrollFactorResponse{
		ID:           factor.ID,
		Type:         models.WebAuthn,
		FriendlyName: factor.FriendlyName,
	})
}

func (a *API) enrollTOTPFactor(w http.ResponseWriter, r *http.Request, params *EnrollFactorParams) error {
	ctx := r.Context()
	user := getUser(ctx)
	db := a.db.WithContext(ctx)
	config := a.config
	session := getSession(ctx)
	issuer := ""
	if params.Issuer == "" {
		u, err := url.ParseRequestURI(config.SiteURL)
		if err != nil {
			return apierrors.NewInternalServerError("site url is improperly formatted")
		}
		issuer = u.Host
	} else {
		issuer = params.Issuer
	}

	if err := validateFactors(db, user, params.FriendlyName, config, session); err != nil {
		return err
	}

	var factor *models.Factor
	var buf bytes.Buffer
	var key *otp.Key
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      issuer,
		AccountName: user.GetEmail(),
	})
	if err != nil {
		return apierrors.NewInternalServerError(QRCodeGenerationErrorMessage).WithInternalError(err)
	}

	svgData := svg.New(&buf)
	qrCode, _ := qr.Encode(key.String(), qr.H, qr.Auto)
	qs := goqrsvg.NewQrSVG(qrCode, DefaultQRSize)
	qs.StartQrSVG(svgData)
	if err = qs.WriteQrSVG(svgData); err != nil {
		return apierrors.NewInternalServerError(QRCodeGenerationErrorMessage).WithInternalError(err)
	}
	svgData.End()

	factor = models.NewTOTPFactor(user, params.FriendlyName)
	if err := factor.SetSecret(key.Secret(), config.Security.DBEncryption.Encrypt, config.Security.DBEncryption.EncryptionKeyID, config.Security.DBEncryption.EncryptionKey); err != nil {
		return err
	}

	err = db.Transaction(func(tx *storage.Connection) error {
		if terr := tx.Create(factor); terr != nil {
			return terr
		}

		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.EnrollFactorAction, utilities.GetIPAddress(r), map[string]interface{}{
			"factor_id": factor.ID,
		}); terr != nil {
			return terr
		}
		return nil
	})
	if err != nil {
		return err
	}
	return sendJSON(w, http.StatusOK, &EnrollFactorResponse{
		ID:           factor.ID,
		Type:         models.TOTP,
		FriendlyName: factor.FriendlyName,
		TOTP: &TOTPObject{
			// See: https://css-tricks.com/probably-dont-base64-svg/
			QRCode: buf.String(),
			Secret: key.Secret(),
			URI:    key.URL(),
		},
	})
}

func (a *API) EnrollFactor(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	user := getUser(ctx)
	session := getSession(ctx)
	config := a.config

	if session == nil || user == nil {
		return apierrors.NewInternalServerError("A valid session and a registered user are required to enroll a factor")
	}
	params := &EnrollFactorParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	switch params.FactorType {
	case models.Phone:
		if !config.MFA.Phone.EnrollEnabled {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFAPhoneEnrollDisabled, "MFA enroll is disabled for Phone")
		}
		return a.enrollPhoneFactor(w, r, params)
	case models.TOTP:
		if !config.MFA.TOTP.EnrollEnabled {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFATOTPEnrollDisabled, "MFA enroll is disabled for TOTP")
		}
		return a.enrollTOTPFactor(w, r, params)
	case models.WebAuthn:
		if !config.MFA.WebAuthn.EnrollEnabled {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFAWebAuthnEnrollDisabled, "MFA enroll is disabled for WebAuthn")
		}
		return a.enrollWebAuthnFactor(w, r, params)
	default:
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "factor_type needs to be totp, phone, or webauthn")
	}

}

func (a *API) challengePhoneFactor(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	config := a.config
	db := a.db.WithContext(ctx)
	user := getUser(ctx)
	factor := getFactor(ctx)
	ipAddress := utilities.GetIPAddress(r)
	params := &ChallengeFactorParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}
	channel := params.Channel
	if channel == "" {
		channel = sms_provider.SMSProvider
	}
	if !sms_provider.IsValidMessageChannel(channel, config) {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, InvalidChannelError)
	}

	if factor.IsPhoneFactor() && factor.LastChallengedAt != nil {
		if !factor.LastChallengedAt.Add(config.MFA.Phone.MaxFrequency).Before(time.Now()) {
			return apierrors.NewTooManyRequestsError(apierrors.ErrorCodeOverSMSSendRateLimit, "%s", generateFrequencyLimitErrorMessage(factor.LastChallengedAt, config.MFA.Phone.MaxFrequency))
		}
	}

	otp := crypto.GenerateOtp(config.MFA.Phone.OtpLength)

	challenge, err := factor.CreatePhoneChallenge(ipAddress, otp, config.Security.DBEncryption.Encrypt, config.Security.DBEncryption.EncryptionKeyID, config.Security.DBEncryption.EncryptionKey)
	if err != nil {
		return apierrors.NewInternalServerError("error creating SMS Challenge")
	}

	message, err := generateSMSFromTemplate(config.MFA.Phone.SMSTemplate, otp)
	if err != nil {
		return apierrors.NewInternalServerError("error generating sms template").WithInternalError(err)
	}

	phone := factor.Phone.String()

	if config.Hook.SendSMS.Enabled {
		input := v0hooks.NewSendSMSInput(
			r,
			user,
			v0hooks.SMS{
				OTP:     otp,
				SMSType: "mfa",
				Phone:   phone,
			},
		)
		output := v0hooks.SendSMSOutput{}
		err := a.hooksMgr.InvokeHook(db, r, input, &output)
		if err != nil {
			return apierrors.NewInternalServerError("error invoking hook")
		}
	} else {
		smsProvider, err := sms_provider.GetSmsProvider(*config)
		if err != nil {
			return apierrors.NewInternalServerError("Failed to get SMS provider").WithInternalError(err)
		}
		// We omit messageID for now, can consider reinstating if there are requests.
		if _, err = smsProvider.SendMessage(phone, message, channel, otp); err != nil {
			return apierrors.NewInternalServerError("error sending message").WithInternalError(err)
		}
	}
	if err := db.Transaction(func(tx *storage.Connection) error {
		if terr := factor.WriteChallengeToDatabase(tx, challenge); terr != nil {
			return terr
		}

		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.CreateChallengeAction, utilities.GetIPAddress(r), map[string]interface{}{
			"factor_id":     factor.ID,
			"factor_status": factor.Status,
		}); terr != nil {
			return terr
		}
		return nil
	}); err != nil {
		return err
	}
	return sendJSON(w, http.StatusOK, &ChallengeFactorResponse{
		ID:        challenge.ID,
		Type:      factor.FactorType,
		ExpiresAt: challenge.GetExpiryTime(config.MFA.ChallengeExpiryDuration).Unix(),
	})
}

func (a *API) challengeTOTPFactor(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	config := a.config
	db := a.db.WithContext(ctx)

	user := getUser(ctx)
	factor := getFactor(ctx)
	ipAddress := utilities.GetIPAddress(r)

	challenge := factor.CreateChallenge(ipAddress)

	if err := db.Transaction(func(tx *storage.Connection) error {
		if terr := factor.WriteChallengeToDatabase(tx, challenge); terr != nil {
			return terr
		}
		if terr := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.CreateChallengeAction, utilities.GetIPAddress(r), map[string]interface{}{
			"factor_id":     factor.ID,
			"factor_status": factor.Status,
		}); terr != nil {
			return terr
		}
		return nil
	}); err != nil {
		return err
	}

	return sendJSON(w, http.StatusOK, &ChallengeFactorResponse{
		ID:        challenge.ID,
		Type:      factor.FactorType,
		ExpiresAt: challenge.GetExpiryTime(config.MFA.ChallengeExpiryDuration).Unix(),
	})
}

func (a *API) challengeWebAuthnFactor(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)
	config := a.config

	user := getUser(ctx)
	factor := getFactor(ctx)
	ipAddress := utilities.GetIPAddress(r)

	params := &ChallengeFactorParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}
	webAuthn, err := a.getWebAuthnMFA()
	if err != nil {
		return err
	}
	var response *ChallengeFactorResponse
	var ws *models.WebAuthnSessionData
	var challenge *models.Challenge
	if factor.IsUnverified() {
		// Get existing WebAuthn credentials to exclude duplicates
		excludeList := []wbnprotocol.CredentialDescriptor{}
		existingCredentials := user.WebAuthnCredentials()
		for _, cred := range existingCredentials {
			excludeList = append(excludeList, wbnprotocol.CredentialDescriptor{
				Type:         wbnprotocol.PublicKeyCredentialType,
				CredentialID: cred.ID,
				Transport:    []wbnprotocol.AuthenticatorTransport{"usb", "nfc"},
			})
		}

		options, session, err := webAuthn.BeginRegistration(user, webauthn.WithExclusions(excludeList))
		if err != nil {
			return apierrors.NewInternalServerError("Failed to generate WebAuthn registration data").WithInternalError(err)
		}
		ws = &models.WebAuthnSessionData{
			SessionData: session,
		}
		challenge = ws.ToChallenge(factor.ID, ipAddress)

		response = &ChallengeFactorResponse{
			Type: factor.FactorType,
			ID:   challenge.ID,
			WebAuthn: &WebAuthnChallengeData{
				Type:              "create",
				CredentialOptions: options,
			},
		}

	} else if factor.IsVerified() {
		options, session, err := webAuthn.BeginLogin(user)
		if err != nil {
			return err
		}
		ws = &models.WebAuthnSessionData{
			SessionData: session,
		}
		challenge = ws.ToChallenge(factor.ID, ipAddress)
		response = &ChallengeFactorResponse{
			Type: factor.FactorType,
			ID:   challenge.ID,
			WebAuthn: &WebAuthnChallengeData{
				Type:              "request",
				CredentialOptions: options,
			},
		}

	}

	if err := factor.WriteChallengeToDatabase(db, challenge); err != nil {
		return err
	}
	response.ExpiresAt = challenge.GetExpiryTime(config.MFA.ChallengeExpiryDuration).Unix()

	return sendJSON(w, http.StatusOK, response)

}

func (a *API) validateChallenge(r *http.Request, db *storage.Connection, factor *models.Factor, challengeID uuid.UUID) (*models.Challenge, error) {
	config := a.config
	currentIP := utilities.GetIPAddress(r)

	challenge, err := factor.FindChallengeByID(db, challengeID)
	if err != nil {
		if models.IsNotFoundError(err) {
			return nil, apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFAFactorNotFound, "MFA factor with the provided challenge ID not found")
		}
		return nil, apierrors.NewInternalServerError("Database error finding Challenge").WithInternalError(err)
	}

	if challenge.VerifiedAt != nil || challenge.IPAddress != currentIP {
		return nil, apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFAIPAddressMismatch, "Challenge and verify IP addresses mismatch.")
	}

	if challenge.HasExpired(config.MFA.ChallengeExpiryDuration) {
		if err := db.Destroy(challenge); err != nil {
			return nil, apierrors.NewInternalServerError("Database error deleting challenge").WithInternalError(err)
		}
		return nil, apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFAChallengeExpired, "MFA challenge %v has expired, verify against another challenge or create a new challenge.", challenge.ID)
	}

	return challenge, nil
}

func (a *API) ChallengeFactor(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	config := a.config
	factor := getFactor(ctx)

	switch factor.FactorType {
	case models.Phone:
		if !config.MFA.Phone.VerifyEnabled {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFAPhoneVerifyDisabled, "MFA verification is disabled for Phone")
		}
		return a.challengePhoneFactor(w, r)

	case models.TOTP:
		if !config.MFA.TOTP.VerifyEnabled {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFATOTPVerifyDisabled, "MFA verification is disabled for TOTP")
		}
		return a.challengeTOTPFactor(w, r)
	case models.WebAuthn:
		if !config.MFA.WebAuthn.VerifyEnabled {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFAWebAuthnVerifyDisabled, "MFA verification is disabled for WebAuthn")
		}
		return a.challengeWebAuthnFactor(w, r)
	default:
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "factor_type needs to be totp, phone, or webauthn")
	}

}

func (a *API) verifyTOTPFactor(w http.ResponseWriter, r *http.Request, params *VerifyFactorParams) error {
	var err error
	ctx := r.Context()
	user := getUser(ctx)
	factor := getFactor(ctx)
	config := a.config
	db := a.db.WithContext(ctx)

	challenge, err := a.validateChallenge(r, db, factor, params.ChallengeID)
	if err != nil {
		return err
	}

	secret, shouldReEncrypt, err := factor.GetSecret(config.Security.DBEncryption.DecryptionKeys, config.Security.DBEncryption.Encrypt, config.Security.DBEncryption.EncryptionKeyID)
	if err != nil {
		return apierrors.NewInternalServerError("Database error verifying MFA TOTP secret").WithInternalError(err)
	}

	valid, verr := totp.ValidateCustom(params.Code, secret, time.Now().UTC(), totp.ValidateOpts{
		Period:    30,
		Skew:      1,
		Digits:    otp.DigitsSix,
		Algorithm: otp.AlgorithmSHA1,
	})

	if config.Hook.MFAVerificationAttempt.Enabled {
		input := v0hooks.NewMFAVerificationAttemptInput(
			r,
			user.ID,
			factor.ID,
			factor.FactorType,
			valid,
		)

		output := v0hooks.MFAVerificationAttemptOutput{}
		err := a.hooksMgr.InvokeHook(nil, r, input, &output)
		if err != nil {
			return err
		}

		if output.Decision == v0hooks.HookRejection {
			if err := models.Logout(db, user.ID); err != nil {
				return err
			}

			if output.Message == "" {
				output.Message = v0hooks.DefaultMFAHookRejectionMessage
			}

			return apierrors.NewForbiddenError(apierrors.ErrorCodeMFAVerificationRejected, "%s", output.Message)
		}
	}
	if !valid {
		if shouldReEncrypt && config.Security.DBEncryption.Encrypt {
			if err := factor.SetSecret(secret, true, config.Security.DBEncryption.EncryptionKeyID, config.Security.DBEncryption.EncryptionKey); err != nil {
				return err
			}

			if err := db.UpdateOnly(factor, "secret"); err != nil {
				return err
			}
		}
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFAVerificationFailed, "Invalid TOTP code entered").WithInternalError(verr)
	}

	var token *AccessTokenResponse
	verified := false
	err = db.Transaction(func(tx *storage.Connection) error {
		var terr error
		if terr = models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.VerifyFactorAction, utilities.GetIPAddress(r), map[string]interface{}{
			"factor_id":    factor.ID,
			"challenge_id": challenge.ID,
			"factor_type":  factor.FactorType,
		}); terr != nil {
			return terr
		}
		if terr = challenge.Verify(tx); terr != nil {
			return terr
		}
		if !factor.IsVerified() {
			if terr = factor.UpdateStatus(tx, models.FactorStateVerified); terr != nil {
				return terr
			}
			verified = true
		}
		if shouldReEncrypt && config.Security.DBEncryption.Encrypt {
			es, terr := crypto.NewEncryptedString(factor.ID.String(), []byte(secret), config.Security.DBEncryption.EncryptionKeyID, config.Security.DBEncryption.EncryptionKey)
			if terr != nil {
				return terr
			}

			factor.Secret = es.String()
			if terr := tx.UpdateOnly(factor, "secret"); terr != nil {
				return terr
			}
		}
		user, terr = models.FindUserByID(tx, user.ID)
		if terr != nil {
			return terr
		}

		token, terr = a.updateMFASessionAndClaims(r, tx, user, models.TOTPSignIn, models.GrantParams{
			FactorID: &factor.ID,
		})
		if terr != nil {
			return terr
		}
		if terr = models.InvalidateSessionsWithAALLessThan(tx, user.ID, models.AAL2.String()); terr != nil {
			return apierrors.NewInternalServerError("Failed to update sessions. %s", terr)
		}
		if terr = models.DeleteUnverifiedFactors(tx, user, factor.FactorType); terr != nil {
			return apierrors.NewInternalServerError("Error removing unverified factors. %s", terr)
		}
		return nil
	})
	if err != nil {
		return err
	}

	// Send MFA factor enrolled notification email if enabled and the factor was just verified
	if verified && config.Mailer.Notifications.MFAFactorEnrolledEnabled && user.GetEmail() != "" {
		if err := a.sendMFAFactorEnrolledNotification(r, db, user, factor.FactorType); err != nil {
			// Log the error but don't fail the verification
			logrus.WithError(err).Warn("Unable to send MFA factor enrolled notification email")
		}
	}

	metering.RecordLogin(metering.LoginTypeMFA, user.ID, &metering.LoginData{
		Provider: metering.ProviderMFATOTP,
	})

	return sendJSON(w, http.StatusOK, token)

}

func (a *API) verifyPhoneFactor(w http.ResponseWriter, r *http.Request, params *VerifyFactorParams) error {
	ctx := r.Context()
	config := a.config
	user := getUser(ctx)
	factor := getFactor(ctx)
	db := a.db.WithContext(ctx)
	currentIP := utilities.GetIPAddress(r)

	challenge, err := a.validateChallenge(r, db, factor, params.ChallengeID)
	if err != nil {
		return err
	}

	if challenge.VerifiedAt != nil || challenge.IPAddress != currentIP {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFAIPAddressMismatch, "Challenge and verify IP addresses mismatch")
	}

	if challenge.HasExpired(config.MFA.ChallengeExpiryDuration) {
		if err := db.Destroy(challenge); err != nil {
			return apierrors.NewInternalServerError("Database error deleting challenge").WithInternalError(err)
		}
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFAChallengeExpired, "MFA challenge %v has expired, verify against another challenge or create a new challenge.", challenge.ID)
	}
	var valid bool
	var otpCode string
	var shouldReEncrypt bool
	if config.Sms.IsTwilioVerifyProvider() {
		smsProvider, err := sms_provider.GetSmsProvider(*config)
		if err != nil {
			return apierrors.NewInternalServerError("Failed to get SMS provider").WithInternalError(err)
		}
		if err := smsProvider.VerifyOTP(factor.Phone.String(), params.Code); err != nil {
			return apierrors.NewForbiddenError(apierrors.ErrorCodeOTPExpired, "Token has expired or is invalid").WithInternalError(err)
		}
		valid = true
	} else {
		otpCode, shouldReEncrypt, err = challenge.GetOtpCode(config.Security.DBEncryption.DecryptionKeys, config.Security.DBEncryption.Encrypt, config.Security.DBEncryption.EncryptionKeyID)
		if err != nil {
			return apierrors.NewInternalServerError("Database error verifying MFA TOTP secret").WithInternalError(err)
		}
		valid = subtle.ConstantTimeCompare([]byte(otpCode), []byte(params.Code)) == 1
	}
	if config.Hook.MFAVerificationAttempt.Enabled {
		input := v0hooks.NewMFAVerificationAttemptInput(
			r,
			user.ID,
			factor.ID,
			factor.FactorType,
			valid,
		)

		output := v0hooks.MFAVerificationAttemptOutput{}
		err := a.hooksMgr.InvokeHook(nil, r, input, &output)
		if err != nil {
			return err
		}

		if output.Decision == v0hooks.HookRejection {
			if err := models.Logout(db, user.ID); err != nil {
				return err
			}

			if output.Message == "" {
				output.Message = v0hooks.DefaultMFAHookRejectionMessage
			}

			return apierrors.NewForbiddenError(apierrors.ErrorCodeMFAVerificationRejected, "%s", output.Message)
		}
	}
	if !valid {
		if shouldReEncrypt && config.Security.DBEncryption.Encrypt {
			if err := challenge.SetOtpCode(otpCode, true, config.Security.DBEncryption.EncryptionKeyID, config.Security.DBEncryption.EncryptionKey); err != nil {
				return err
			}

			if err := db.UpdateOnly(challenge, "otp_code"); err != nil {
				return err
			}
		}
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFAVerificationFailed, "Invalid MFA Phone code entered")
	}

	var token *AccessTokenResponse
	verified := false
	err = db.Transaction(func(tx *storage.Connection) error {
		var terr error
		if terr = models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.VerifyFactorAction, utilities.GetIPAddress(r), map[string]interface{}{
			"factor_id":    factor.ID,
			"challenge_id": challenge.ID,
			"factor_type":  factor.FactorType,
		}); terr != nil {
			return terr
		}
		if terr = challenge.Verify(tx); terr != nil {
			return terr
		}
		if !factor.IsVerified() {
			if terr = factor.UpdateStatus(tx, models.FactorStateVerified); terr != nil {
				return terr
			}
			verified = true
		}
		user, terr = models.FindUserByID(tx, user.ID)
		if terr != nil {
			return terr
		}

		token, terr = a.updateMFASessionAndClaims(r, tx, user, models.MFAPhone, models.GrantParams{
			FactorID: &factor.ID,
		})
		if terr != nil {
			return terr
		}
		if terr = models.InvalidateSessionsWithAALLessThan(tx, user.ID, models.AAL2.String()); terr != nil {
			return apierrors.NewInternalServerError("Failed to update sessions. %s", terr)
		}
		if terr = models.DeleteUnverifiedFactors(tx, user, factor.FactorType); terr != nil {
			return apierrors.NewInternalServerError("Error removing unverified factors. %s", terr)
		}
		return nil
	})
	if err != nil {
		return err
	}

	// Send MFA factor enrolled notification email if enabled and the factor was just verified
	if verified && config.Mailer.Notifications.MFAFactorEnrolledEnabled && user.GetEmail() != "" {
		if err := a.sendMFAFactorEnrolledNotification(r, db, user, factor.FactorType); err != nil {
			// Log the error but don't fail the verification
			logrus.WithError(err).Warn("Unable to send MFA factor enrolled notification email")
		}
	}

	metering.RecordLogin(metering.LoginTypeMFA, user.ID, &metering.LoginData{
		Provider: metering.ProviderMFAPhone,
	})

	return sendJSON(w, http.StatusOK, token)
}

func (a *API) verifyWebAuthnFactor(w http.ResponseWriter, r *http.Request, params *VerifyFactorParams) error {
	ctx := r.Context()
	config := a.config
	user := getUser(ctx)
	factor := getFactor(ctx)
	db := a.db.WithContext(ctx)

	var webAuthn *webauthn.WebAuthn
	var credential *webauthn.Credential
	var err error

	switch {
	case params.WebAuthn == nil:
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "WebAuthn config required")
	case params.WebAuthn.Type != "create" && params.WebAuthn.Type != "request":
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "WebAuthn type must be create or request")
	case params.WebAuthn.CredentialResponse == nil:
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "credential_response required")
	default:
		webAuthn, err = a.getWebAuthnMFA()
		if err != nil {
			return err
		}
	}

	challenge, err := a.validateChallenge(r, db, factor, params.ChallengeID)
	if err != nil {
		return err
	}
	webAuthnSession := *challenge.WebAuthnSessionData.SessionData

	var parsedResponse interface{}
	switch params.WebAuthn.Type {
	case "create":
		parsedResponse, err = wbnprotocol.ParseCredentialCreationResponseBody(bytes.NewReader(params.WebAuthn.CredentialResponse))
		if err != nil {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Invalid credential_response")
		}
		credential, err = webAuthn.CreateCredential(user, webAuthnSession, parsedResponse.(*wbnprotocol.ParsedCredentialCreationData))
		if err != nil {
			return err
		}

	case "request":
		parsedResponse, err = wbnprotocol.ParseCredentialRequestResponseBody(bytes.NewReader(params.WebAuthn.CredentialResponse))
		if err != nil {
			return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Invalid credential_response")
		}
		credential, err = webAuthn.ValidateLogin(user, webAuthnSession, parsedResponse.(*wbnprotocol.ParsedCredentialAssertionData))
		if err != nil {
			return apierrors.NewInternalServerError("Failed to validate WebAuthn MFA response").WithInternalError(err)
		}
	}

	// Once the challenge is validated, we consume the challenge
	if err := db.Destroy(challenge); err != nil {
		return apierrors.NewInternalServerError("Database error deleting challenge").WithInternalError(err)
	}
	var token *AccessTokenResponse
	verified := false
	err = db.Transaction(func(tx *storage.Connection) error {
		var terr error
		if terr = models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.VerifyFactorAction, utilities.GetIPAddress(r), map[string]interface{}{
			"factor_id":    factor.ID,
			"challenge_id": challenge.ID,
			"factor_type":  factor.FactorType,
		}); terr != nil {
			return terr
		}
		// Challenge verification not needed as the challenge is destroyed on use
		if !factor.IsVerified() {
			if terr = factor.UpdateStatus(tx, models.FactorStateVerified); terr != nil {
				return terr
			}
			if terr = factor.SaveWebAuthnCredential(tx, credential); terr != nil {
				return terr
			}
			verified = true
		}

		if terr = factor.UpdateLastWebAuthnChallenge(tx, challenge, params.WebAuthn.Type, parsedResponse); terr != nil {
			return terr
		}
		user, terr = models.FindUserByID(tx, user.ID)
		if terr != nil {
			return terr
		}
		token, terr = a.updateMFASessionAndClaims(r, tx, user, models.MFAWebAuthn, models.GrantParams{
			FactorID: &factor.ID,
		})
		if terr != nil {
			return terr
		}
		if terr = models.InvalidateSessionsWithAALLessThan(tx, user.ID, models.AAL2.String()); terr != nil {
			return apierrors.NewInternalServerError("Failed to update session").WithInternalError(terr)
		}
		if terr = models.DeleteUnverifiedFactors(tx, user, models.WebAuthn); terr != nil {
			return apierrors.NewInternalServerError("Failed to remove unverified MFA WebAuthn factors").WithInternalError(terr)
		}
		return nil
	})
	if err != nil {
		return err
	}

	// Send MFA factor enrolled notification email if enabled and the factor was just verified
	if verified && config.Mailer.Notifications.MFAFactorEnrolledEnabled && user.GetEmail() != "" {
		if err := a.sendMFAFactorEnrolledNotification(r, db, user, factor.FactorType); err != nil {
			// Log the error but don't fail the verification
			logrus.WithError(err).Warn("Unable to send MFA factor enrolled notification email")
		}
	}

	metering.RecordLogin(metering.LoginTypeMFA, user.ID, &metering.LoginData{
		Provider: metering.ProviderMFAWebAuthn,
	})

	return sendJSON(w, http.StatusOK, token)
}

func (a *API) VerifyFactor(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	factor := getFactor(ctx)
	config := a.config

	params := &VerifyFactorParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}
	if params.Code == "" && factor.FactorType != models.WebAuthn {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Code needs to be non-empty")
	}

	switch factor.FactorType {
	case models.Phone:
		if !config.MFA.Phone.VerifyEnabled {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFAPhoneVerifyDisabled, "MFA verification is disabled for Phone")
		}

		return a.verifyPhoneFactor(w, r, params)
	case models.TOTP:
		if !config.MFA.TOTP.VerifyEnabled {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFATOTPVerifyDisabled, "MFA verification is disabled for TOTP")
		}
		return a.verifyTOTPFactor(w, r, params)
	case models.WebAuthn:
		if !config.MFA.WebAuthn.VerifyEnabled {
			return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFAWebAuthnEnrollDisabled, "MFA verification is disabled for WebAuthn")
		}
		return a.verifyWebAuthnFactor(w, r, params)
	default:
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "factor_type needs to be totp, phone, or webauthn")
	}

}

func (a *API) UnenrollFactor(w http.ResponseWriter, r *http.Request) error {
	var err error
	ctx := r.Context()
	config := a.config
	user := getUser(ctx)
	factor := getFactor(ctx)
	session := getSession(ctx)
	db := a.db.WithContext(ctx)

	if factor == nil || session == nil || user == nil {
		return apierrors.NewInternalServerError("A valid session and factor are required to unenroll a factor")
	}

	if factor.IsRecoveryCodeFactor() {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeValidationFailed, "Recovery codes cannot be unenrolled with this endpoint, use DELETE /factors/recovery-codes")
	}

	if factor.IsVerified() && !session.IsAAL2() {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeInsufficientAAL, "AAL2 required to unenroll verified factor")
	}

	factorType := factor.FactorType

	err = db.Transaction(func(tx *storage.Connection) error {
		var terr error

		// Recovery codes can never be a user's only second factor.
		if factor.IsVerified() {
			_, terr := models.FindRecoveryCodeSetForUpdate(tx, user.ID)
			if terr == nil {
				if terr := tx.Load(user, "Factors"); terr != nil {
					return apierrors.NewInternalServerError("Database error loading factors").WithInternalError(terr)
				}

				if !hasUsableNonRecoveryFactor(config, user.Factors, factor.ID) {
					return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeMFARecoveryCodesSoleFactor, "Recovery codes cannot be the only verified factor. Please enroll another factor before unenrolling this one or delete your recovery codes.")
				}
			} else if !models.IsNotFoundError(terr) {
				return apierrors.NewInternalServerError("Database error locking recovery code set").WithInternalError(terr)
			}

			// no recovery codes are enrolled, nothing to protect.
		}

		if terr := tx.Destroy(factor); terr != nil {
			return terr
		}
		if terr = models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.UnenrollFactorAction, utilities.GetIPAddress(r), map[string]interface{}{
			"factor_id":     factor.ID,
			"factor_status": factor.Status,
			"session_id":    session.ID,
		}); terr != nil {
			return terr
		}
		if terr = factor.DowngradeSessionsToAAL1(tx); terr != nil {
			return terr
		}
		return nil
	})
	if err != nil {
		return err
	}

	// Send MFA factor unenrolled notification email if enabled
	if config.Mailer.Notifications.MFAFactorUnenrolledEnabled && user.GetEmail() != "" {
		if err := a.sendMFAFactorUnenrolledNotification(r, db, user, factorType); err != nil {
			// Log the error but don't fail the unenrollment
			logrus.WithError(err).Warn("Unable to send MFA factor unenrolled notification email")
		}
	}

	return sendJSON(w, http.StatusOK, &UnenrollFactorResponse{
		ID: factor.ID,
	})
}
