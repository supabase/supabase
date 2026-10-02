package api

import (
	"github.com/supabase/auth/internal/api/apilimiter"
	"github.com/supabase/auth/internal/mailer"
	"github.com/supabase/auth/internal/security"
	"github.com/supabase/auth/internal/tokens"
)

type Option interface {
	apply(*API)
}

type optionFunc func(*API)

func (f optionFunc) apply(a *API) { f(a) }

func WithMailer(m mailer.Mailer) Option {
	return optionFunc(func(a *API) {
		a.mailer = m
	})
}

func WithTokenService(service *tokens.Service) Option {
	return optionFunc(func(a *API) {
		a.tokenService = service
	})
}

func WithCaptchaVerifier(v security.CaptchaVerifier) Option {
	return optionFunc(func(a *API) {
		a.captchaVerifier = v
	})
}

func WithLimiter(v *apilimiter.Limiter) Option {
	return optionFunc(func(a *API) {
		a.limiterOpts = v
	})
}
