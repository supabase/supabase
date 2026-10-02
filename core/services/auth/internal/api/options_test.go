package api

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/supabase/auth/internal/api/apilimiter"
	"github.com/supabase/auth/internal/conf"
)

func TestNewLimiterOptions(t *testing.T) {
	cfg := &conf.GlobalConfiguration{}
	cfg.ApplyDefaults()

	rl := apilimiter.New(cfg)
	assert.NotNil(t, rl.Email)
	assert.NotNil(t, rl.Phone)
	assert.NotNil(t, rl.Signups)
	assert.NotNil(t, rl.AnonymousSignIns)
	assert.NotNil(t, rl.Recover)
	assert.NotNil(t, rl.Resend)
	assert.NotNil(t, rl.MagicLink)
	assert.NotNil(t, rl.Otp)
	assert.NotNil(t, rl.Token)
	assert.NotNil(t, rl.Verify)
	assert.NotNil(t, rl.User)
	assert.NotNil(t, rl.FactorVerify)
	assert.NotNil(t, rl.FactorChallenge)
	assert.NotNil(t, rl.SSO)
	assert.NotNil(t, rl.SAMLAssertion)
}
