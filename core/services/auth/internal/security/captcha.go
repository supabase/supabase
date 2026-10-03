package security

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/pkg/errors"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/utilities"
)

type VerificationResponse struct {
	Success    bool     `json:"success"`
	ErrorCodes []string `json:"error-codes"`
	Hostname   string   `json:"hostname"`
}

// CaptchaVerifier abstracts CAPTCHA verification for different providers (hCaptcha, Cloudflare Turnstile, etc.)
// and allows for mocking in tests.
type CaptchaVerifier interface {
	Verify(ctx context.Context, token, clientIP string) (*VerificationResponse, error)
}

// HTTPCaptchaVerifier is the default implementation that calls out to hCaptcha / Turnstile.
type HTTPCaptchaVerifier struct {
	client   *http.Client
	secret   string
	provider string
}

func NewCaptchaVerifier(cfg *conf.CaptchaConfiguration) *HTTPCaptchaVerifier {
	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 10 * time.Second
	}

	return &HTTPCaptchaVerifier{
		client:   &http.Client{Timeout: timeout},
		secret:   strings.TrimSpace(cfg.Secret),
		provider: cfg.Provider,
	}
}

func (v *HTTPCaptchaVerifier) Verify(ctx context.Context, token, clientIP string) (*VerificationResponse, error) {
	captchaURL, err := getCaptchaURL(v.provider)
	if err != nil {
		return nil, err
	}

	return v.verifyCaptchaCode(ctx, token, clientIP, captchaURL)
}

func (v *HTTPCaptchaVerifier) verifyCaptchaCode(ctx context.Context, token, clientIP, captchaURL string) (*VerificationResponse, error) {
	data := url.Values{}
	data.Set("secret", v.secret)
	data.Set("response", token)
	data.Set("remoteip", clientIP)
	// TODO (darora): pipe through sitekey

	r, err := http.NewRequestWithContext(ctx, "POST", captchaURL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, errors.Wrap(err, "couldn't initialize request object for captcha check")
	}
	r.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	r.Header.Add("Content-Length", strconv.Itoa(len(data.Encode())))
	res, err := v.client.Do(r)
	if err != nil {
		return nil, errors.Wrap(err, "failed to verify captcha response")
	}
	defer utilities.SafeClose(res.Body)

	var verificationResponse VerificationResponse

	if err := json.NewDecoder(res.Body).Decode(&verificationResponse); err != nil {
		return nil, errors.Wrap(err, "failed to decode captcha response: not JSON")
	}

	return &verificationResponse, nil
}

func getCaptchaURL(captchaProvider string) (string, error) {
	switch captchaProvider {
	case "hcaptcha":
		return "https://hcaptcha.com/siteverify", nil
	case "turnstile":
		return "https://challenges.cloudflare.com/turnstile/v0/siteverify", nil
	default:
		return "", fmt.Errorf("captcha Provider %q could not be found", captchaProvider)
	}
}
