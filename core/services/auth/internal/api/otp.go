package api

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"

	"github.com/sethvargo/go-password/password"
	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/api/sms_provider"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/models"
	"github.com/supabase/auth/internal/storage"
)

// OtpParams contains the request body params for the otp endpoint
type OtpParams struct {
	Email               string                 `json:"email"`
	Phone               string                 `json:"phone"`
	CreateUser          bool                   `json:"create_user"`
	Data                map[string]interface{} `json:"data"`
	Channel             string                 `json:"channel"`
	CodeChallengeMethod string                 `json:"code_challenge_method"`
	CodeChallenge       string                 `json:"code_challenge"`
}

// SmsParams contains the request body params for sms otp
type SmsParams struct {
	Phone               string                 `json:"phone"`
	Channel             string                 `json:"channel"`
	Data                map[string]interface{} `json:"data"`
	CodeChallengeMethod string                 `json:"code_challenge_method"`
	CodeChallenge       string                 `json:"code_challenge"`
}

func (p *OtpParams) Validate() error {
	if p.Email != "" && p.Phone != "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Only an email address or phone number should be provided")
	}
	if p.Email != "" && p.Channel != "" {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "Channel should only be specified with Phone OTP")
	}
	if err := validatePKCEParams(p.CodeChallengeMethod, p.CodeChallenge); err != nil {
		return err
	}
	return nil
}

func (p *SmsParams) Validate(config *conf.GlobalConfiguration) error {
	var err error
	p.Phone, err = validatePhone(p.Phone)
	if err != nil {
		return err
	}
	if !sms_provider.IsValidMessageChannel(p.Channel, config) {
		return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, InvalidChannelError)
	}
	return nil
}

// Otp returns the MagicLink or SmsOtp handler based on the request body params
func (a *API) Otp(w http.ResponseWriter, r *http.Request) error {
	params := &OtpParams{
		CreateUser: true,
	}
	if params.Data == nil {
		params.Data = make(map[string]interface{})
	}

	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	if err := params.Validate(); err != nil {
		return err
	}
	if params.Data == nil {
		params.Data = make(map[string]interface{})
	}

	if ok, err := a.shouldCreateUser(r, params); !ok {
		return apierrors.NewUnprocessableEntityError(apierrors.ErrorCodeOTPDisabled, "Signups not allowed for otp")
	} else if err != nil {
		return err
	}

	if params.Email != "" {
		return a.MagicLink(w, r)
	} else if params.Phone != "" {
		return a.SmsOtp(w, r)
	}

	return apierrors.NewBadRequestError(apierrors.ErrorCodeValidationFailed, "One of email or phone must be set")
}

type SmsOtpResponse struct {
	MessageID string `json:"message_id,omitempty"`
}

// SmsOtp sends the user an otp via sms
func (a *API) SmsOtp(w http.ResponseWriter, r *http.Request) error {
	ctx := r.Context()
	db := a.db.WithContext(ctx)
	config := a.config

	if !config.External.Phone.Enabled {
		return apierrors.NewBadRequestError(apierrors.ErrorCodePhoneProviderDisabled, "Unsupported phone provider")
	}
	var err error

	params := &SmsParams{}
	if err := retrieveRequestParams(r, params); err != nil {
		return err
	}

	// For backwards compatibility, we default to SMS if params Channel is not specified
	if params.Phone != "" && params.Channel == "" {
		params.Channel = sms_provider.SMSProvider
	}

	if err := params.Validate(config); err != nil {
		return err
	}

	var isNewUser bool
	aud := a.requestAud(ctx, r)
	user, err := models.FindUserByPhoneAndAudience(db, params.Phone, aud)
	if err != nil {
		if models.IsNotFoundError(err) {
			isNewUser = true
		} else {
			return apierrors.NewInternalServerError("Database error finding user").WithInternalError(err)
		}
	}
	if user != nil {
		isNewUser = !user.IsPhoneConfirmed()
	}
	if isNewUser {
		// User either doesn't exist or hasn't completed the signup process.
		// Sign them up with temporary password.
		password, err := password.Generate(64, 10, 1, false, true)
		if err != nil {
			return apierrors.NewInternalServerError("error creating user").WithInternalError(err)
		}

		signUpParams := &SignupParams{
			Phone:    params.Phone,
			Password: password,
			Data:     params.Data,
			Channel:  params.Channel,
		}
		newBodyContent, err := json.Marshal(signUpParams)
		if err != nil {
			// SignupParams must be marshallable
			panic(err)
		}
		r.Body = io.NopCloser(bytes.NewReader(newBodyContent))

		fakeResponse := &responseStub{}

		if config.Sms.Autoconfirm {
			// signups are autoconfirmed, send otp after signup
			if err := a.Signup(fakeResponse, r); err != nil {
				return err
			}

			signUpParams := &SignupParams{
				Phone:   params.Phone,
				Channel: params.Channel,
			}
			newBodyContent, err := json.Marshal(signUpParams)
			if err != nil {
				// SignupParams must be marshallable
				panic(err)
			}
			r.Body = io.NopCloser(bytes.NewReader(newBodyContent))
			return a.SmsOtp(w, r)
		}

		if err := a.Signup(fakeResponse, r); err != nil {
			return err
		}
		return sendJSON(w, http.StatusOK, make(map[string]string))
	}

	messageID := ""
	err = db.Transaction(func(tx *storage.Connection) error {
		if err := models.NewAuditLogEntry(config.AuditLog, r, tx, user, models.UserRecoveryRequestedAction, "", map[string]interface{}{
			"channel": params.Channel,
		}); err != nil {
			return err
		}
		mID, serr := a.sendPhoneConfirmation(r, tx, user, params.Phone, phoneConfirmationOtp, params.Channel)
		if serr != nil {
			return serr
		}
		messageID = mID
		return nil
	})

	if err != nil {
		return err
	}

	return sendJSON(w, http.StatusOK, SmsOtpResponse{
		MessageID: messageID,
	})
}

func (a *API) shouldCreateUser(r *http.Request, params *OtpParams) (bool, error) {
	ctx := r.Context()
	db := a.db.WithContext(ctx)

	if !params.CreateUser {
		ctx := r.Context()
		aud := a.requestAud(ctx, r)
		var err error
		if params.Email != "" {
			params.Email, err = a.validateEmail(params.Email)
			if err != nil {
				return false, err
			}
			_, err = models.FindUserByEmailAndAudience(db, params.Email, aud)
		} else if params.Phone != "" {
			params.Phone, err = validatePhone(params.Phone)
			if err != nil {
				return false, err
			}
			_, err = models.FindUserByPhoneAndAudience(db, params.Phone, aud)
		}

		if err != nil && models.IsNotFoundError(err) {
			return false, nil
		}
	}
	return true, nil
}
