package api

import (
	"context"

	"github.com/supabase/auth/internal/security"
)

// MockCaptchaVerifier is a mock implementation of security.CaptchaVerifier.
type MockCaptchaVerifier struct {
	Result       *security.VerificationResponse
	Err          error
	LastToken    string
	LastClientIP string
}

func (m *MockCaptchaVerifier) Verify(ctx context.Context, token, clientIP string) (*security.VerificationResponse, error) {
	m.LastToken = token
	m.LastClientIP = clientIP

	if m.Err != nil {
		return nil, m.Err
	}

	return m.Result, nil
}
