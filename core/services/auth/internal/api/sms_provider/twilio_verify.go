package sms_provider

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/utilities"
)

const (
	verifyServiceApiBase = "https://verify.twilio.com/v2/Services/"
)

type TwilioVerifyProvider struct {
	Config  *conf.TwilioVerifyProviderConfiguration
	APIPath string
}

type VerificationResponse struct {
	To              string `json:"to"`
	Status          string `json:"status"`
	Channel         string `json:"channel"`
	Valid           bool   `json:"valid"`
	VerificationSID string `json:"sid"`
	ErrorCode       string `json:"error_code"`
	ErrorMessage    string `json:"error_message"`
}

// See: https://www.twilio.com/docs/verify/api/verification-check
type VerificationCheckResponse struct {
	To           string `json:"to"`
	Status       string `json:"status"`
	Channel      string `json:"channel"`
	Valid        bool   `json:"valid"`
	ErrorCode    string `json:"error_code"`
	ErrorMessage string `json:"error_message"`
}

// Creates a SmsProvider with the Twilio Config
func NewTwilioVerifyProvider(config conf.TwilioVerifyProviderConfiguration) (SmsProvider, error) {
	if err := config.Validate(); err != nil {
		return nil, err
	}
	apiPath := verifyServiceApiBase + config.MessageServiceSid + "/Verifications"

	return &TwilioVerifyProvider{
		Config:  &config,
		APIPath: apiPath,
	}, nil
}

func (t *TwilioVerifyProvider) SendMessage(phone, message, channel, otp string) (string, error) {
	switch channel {
	case SMSProvider, WhatsappProvider:
		return t.SendSms(phone, message, channel)
	default:
		return "", fmt.Errorf("channel type %q is not supported for Twilio", channel)
	}
}

// Send an SMS containing the OTP with Twilio's API
func (t *TwilioVerifyProvider) SendSms(phone, message, channel string) (string, error) {
	// Unlike Programmable Messaging, Verify does not require a prefix for channel
	receiver := "+" + phone
	body := url.Values{
		"To":      {receiver},
		"Channel": {channel},
	}
	client := &http.Client{Timeout: defaultTimeout}
	r, err := http.NewRequest("POST", t.APIPath, strings.NewReader(body.Encode()))
	if err != nil {
		return "", err
	}
	r.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	r.SetBasicAuth(t.Config.AccountSid, t.Config.AuthToken)
	res, err := client.Do(r)
	if err != nil {
		return "", err
	}
	defer utilities.SafeClose(res.Body)
	if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusCreated {
		resp := &twilioErrResponse{}
		if err := json.NewDecoder(res.Body).Decode(resp); err != nil {
			return "", err
		}
		return "", resp
	}

	resp := &VerificationResponse{}
	derr := json.NewDecoder(res.Body).Decode(resp)
	if derr != nil {
		return "", derr
	}
	return resp.VerificationSID, nil
}

func (t *TwilioVerifyProvider) VerifyOTP(phone, code string) error {
	verifyPath := verifyServiceApiBase + t.Config.MessageServiceSid + "/VerificationCheck"
	receiver := "+" + phone

	body := url.Values{
		"To":   {receiver}, // twilio api requires "+" extension to be included
		"Code": {code},
	}
	client := &http.Client{Timeout: defaultTimeout}
	r, err := http.NewRequest("POST", verifyPath, strings.NewReader(body.Encode()))
	if err != nil {
		return err
	}
	r.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	r.SetBasicAuth(t.Config.AccountSid, t.Config.AuthToken)
	res, err := client.Do(r)
	if err != nil {
		return err
	}
	defer utilities.SafeClose(res.Body)
	if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusCreated {
		resp := &twilioErrResponse{}
		if err := json.NewDecoder(res.Body).Decode(resp); err != nil {
			return err
		}
		return resp
	}
	resp := &VerificationCheckResponse{}
	derr := json.NewDecoder(res.Body).Decode(resp)
	if derr != nil {
		return derr
	}

	if resp.Status != "approved" || !resp.Valid {
		return fmt.Errorf("twilio verification error: %v %v", resp.ErrorMessage, resp.Status)
	}

	return nil
}
