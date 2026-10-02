package sms_provider

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/utilities"
	"golang.org/x/exp/utf8string"
)

const (
	defaultVonageApiBase = "https://rest.nexmo.com"
)

type VonageProvider struct {
	Config  *conf.VonageProviderConfiguration
	APIPath string
}

type VonageResponseMessage struct {
	MessageID string `json:"message-id"`
	Status    string `json:"status"`
	ErrorText string `json:"error-text"`
}

type VonageResponse struct {
	Messages []VonageResponseMessage `json:"messages"`
}

// Creates a SmsProvider with the Vonage Config
func NewVonageProvider(config conf.VonageProviderConfiguration) (SmsProvider, error) {
	if err := config.Validate(); err != nil {
		return nil, err
	}

	apiPath := defaultVonageApiBase + "/sms/json"
	return &VonageProvider{
		Config:  &config,
		APIPath: apiPath,
	}, nil
}

func (t *VonageProvider) SendMessage(phone, message, channel, otp string) (string, error) {
	switch channel {
	case SMSProvider:
		return t.SendSms(phone, message)
	default:
		return "", fmt.Errorf("channel type %q is not supported for Vonage", channel)
	}
}

// Send an SMS containing the OTP with Vonage's API
func (t *VonageProvider) SendSms(phone string, message string) (string, error) {
	body := url.Values{
		"from":       {t.Config.From},
		"to":         {phone},
		"text":       {message},
		"api_key":    {t.Config.ApiKey},
		"api_secret": {t.Config.ApiSecret},
	}

	isMessageContainUnicode := !utf8string.NewString(message).IsASCII()
	if isMessageContainUnicode {
		body.Set("type", "unicode")
	}

	client := &http.Client{Timeout: defaultTimeout}
	r, err := http.NewRequest("POST", t.APIPath, strings.NewReader(body.Encode()))
	if err != nil {
		return "", err
	}

	r.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	res, err := client.Do(r)
	if err != nil {
		return "", err
	}
	defer utilities.SafeClose(res.Body)

	resp := &VonageResponse{}
	derr := json.NewDecoder(res.Body).Decode(resp)
	if derr != nil {
		return "", derr
	}

	if len(resp.Messages) <= 0 {
		return "", errors.New("vonage error: Internal Error")
	}

	// A status of zero indicates success; a non-zero value means something went wrong.
	if resp.Messages[0].Status != "0" {
		return resp.Messages[0].MessageID, fmt.Errorf("vonage error: %v (status: %v) for message %s", resp.Messages[0].ErrorText, resp.Messages[0].Status, resp.Messages[0].MessageID)
	}

	return resp.Messages[0].MessageID, nil
}

func (t *VonageProvider) VerifyOTP(phone, code string) error {
	return fmt.Errorf("VerifyOTP is not supported for Vonage")
}
