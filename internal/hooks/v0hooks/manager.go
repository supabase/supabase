package v0hooks

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/supabase/auth/internal/api/apierrors"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/hooks/hookshttp"
	"github.com/supabase/auth/internal/hooks/hookspgfunc"
	"github.com/supabase/auth/internal/observability"
	"github.com/supabase/auth/internal/storage"
)

type Manager struct {
	config *conf.GlobalConfiguration
	http   *hookshttp.Dispatcher
	pgfunc *hookspgfunc.Dispatcher
}

func NewManager(
	config *conf.GlobalConfiguration,
	httpDr *hookshttp.Dispatcher,
	pgfuncDr *hookspgfunc.Dispatcher,
) *Manager {
	return &Manager{
		config: config,
		http:   httpDr,
		pgfunc: pgfuncDr,
	}
}

func (o *Manager) Enabled(name Name) bool {
	if cfg, ok := configByName(&o.config.Hook, name); ok {
		return cfg.Enabled
	}
	return false
}

func configByName(
	cfg *conf.HookConfiguration,
	name Name,
) (*conf.ExtensibilityPointConfiguration, bool) {
	switch name {
	case SendSMS:
		return &cfg.SendSMS, true
	case SendEmail:
		return &cfg.SendEmail, true
	case CustomizeAccessToken:
		return &cfg.CustomAccessToken, true
	case MFAVerification:
		return &cfg.MFAVerificationAttempt, true
	case PasswordVerification:
		return &cfg.PasswordVerificationAttempt, true
	case BeforeUserCreated:
		return &cfg.BeforeUserCreated, true
	case AfterUserCreated:
		return &cfg.AfterUserCreated, true
	default:
		return nil, false
	}
}

func (o *Manager) InvokeHook(
	conn *storage.Connection,
	r *http.Request,
	input, output any,
) error {
	return o.invokeHook(conn, r, input, output)
}

// invokeHook invokes the hook code. conn can be nil, in which case a new
// transaction is opened. If calling invokeHook within a transaction, always
// pass the current transaction, as pool-exhaustion deadlocks are very easy to
// trigger.
func (o *Manager) invokeHook(
	conn *storage.Connection,
	r *http.Request,
	input, output any,
) error {
	switch input.(type) {
	default:
		return apierrors.NewInternalServerError(
			"Unknown hook type %T.", input)

	case *SendSMSInput:
		if _, ok := output.(*SendSMSOutput); !ok {
			return apierrors.NewInternalServerError(
				"output should be *hooks.SendSMSOutput")
		}
		return o.dispatch(
			r.Context(), &o.config.Hook.SendSMS, conn, input, output)

	case *SendEmailInput:
		if _, ok := output.(*SendEmailOutput); !ok {
			return apierrors.NewInternalServerError(
				"output should be *hooks.SendEmailOutput")
		}
		return o.dispatch(
			r.Context(), &o.config.Hook.SendEmail, conn, input, output)

	case *MFAVerificationAttemptInput:
		if _, ok := output.(*MFAVerificationAttemptOutput); !ok {
			return apierrors.NewInternalServerError(
				"output should be *hooks.MFAVerificationAttemptOutput")
		}
		return o.dispatch(
			r.Context(), &o.config.Hook.MFAVerificationAttempt, conn, input, output)

	case *PasswordVerificationAttemptInput:
		if _, ok := output.(*PasswordVerificationAttemptOutput); !ok {
			return apierrors.NewInternalServerError(
				"output should be *hooks.PasswordVerificationAttemptOutput")
		}
		return o.dispatch(
			r.Context(), &o.config.Hook.PasswordVerificationAttempt, conn, input, output)

	case *CustomAccessTokenInput:
		_, ok := output.(*CustomAccessTokenOutput)
		if !ok {
			return apierrors.NewInternalServerError(
				"output should be *hooks.CustomAccessTokenOutput")
		}
		return o.dispatch(
			r.Context(), &o.config.Hook.CustomAccessToken, conn, input, output)

	case *BeforeUserCreatedInput:
		if _, ok := output.(*BeforeUserCreatedOutput); !ok {
			return apierrors.NewInternalServerError(
				"output should be *hooks.BeforeUserCreatedOutput")
		}
		return o.dispatch(
			r.Context(), &o.config.Hook.BeforeUserCreated, conn, input, output)

	case *AfterUserCreatedInput:
		_, ok := output.(*AfterUserCreatedOutput)
		if !ok {
			return apierrors.NewInternalServerError(
				"output should be *hooks.AfterUserCreatedOutput")
		}
		return o.dispatch(
			r.Context(), &o.config.Hook.AfterUserCreated, conn, input, output)
	}
}

func (o *Manager) dispatch(
	ctx context.Context,
	hookConfig *conf.ExtensibilityPointConfiguration,
	conn *storage.Connection,
	input, output any,
) error {
	logEntry := observability.GetLogEntryFromContext(ctx)
	hookStart := time.Now()

	var err error
	switch {
	case strings.HasPrefix(hookConfig.URI, "http:") ||
		strings.HasPrefix(hookConfig.URI, "https:"):
		err = o.http.Dispatch(ctx, hookConfig, input, output)

	case strings.HasPrefix(hookConfig.URI, "pg-functions:"):
		err = o.pgfunc.Dispatch(ctx, hookConfig, conn, input, output)

	default:
		return fmt.Errorf(
			"unsupported protocol: %q only postgres hooks and HTTPS functions"+
				" are supported at the moment", hookConfig.URI)
	}

	duration := time.Since(hookStart)

	if err != nil {
		logEntry.Entry.WithFields(logrus.Fields{
			"action":   "run_hook",
			"hook":     hookConfig.URI,
			"success":  false,
			"duration": duration.Microseconds(),
		}).WithError(err).Warn("Hook errored out")

		e := new(apierrors.HTTPError)
		if errors.As(err, &e) {
			return e
		}
		return apierrors.NewInternalServerError(
			"Error running hook URI: %v", hookConfig.URI).WithInternalError(err)
	}

	logEntry.Entry.WithFields(logrus.Fields{
		"action":   "run_hook",
		"hook":     hookConfig.URI,
		"success":  true,
		"duration": duration.Microseconds(),
	}).WithError(err).Info("Hook ran successfully")

	return nil
}
