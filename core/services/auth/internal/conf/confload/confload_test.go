package confload

import (
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/supabase/auth/internal/conf"
)

func TestGlobal(t *testing.T) {
	os.Setenv("GOTRUE_SITE_URL", "http://localhost:8080")
	os.Setenv("GOTRUE_DB_DRIVER", "postgres")
	os.Setenv("GOTRUE_DB_DATABASE_URL", "fake")
	os.Setenv("GOTRUE_OPERATOR_TOKEN", "token")
	os.Setenv("GOTRUE_API_REQUEST_ID_HEADER", "X-Request-ID")
	os.Setenv("GOTRUE_JWT_SECRET", "secret")
	os.Setenv("API_EXTERNAL_URL", "http://localhost:9999")
	os.Setenv("GOTRUE_HOOK_MFA_VERIFICATION_ATTEMPT_URI", "pg-functions://postgres/auth/count_failed_attempts")
	os.Setenv("GOTRUE_HOOK_SEND_SMS_SECRETS", "v1,whsec_aWxpa2VzdXBhYmFzZXZlcnltdWNoYW5kaWhvcGV5b3Vkb3Rvbw==")
	os.Setenv("GOTRUE_SMTP_HEADERS", `{"X-PM-Metadata-project-ref":["project_ref"],"X-SES-Message-Tags":["ses:feedback-id-a=project_ref,ses:feedback-id-b=$messageType"]}`)
	os.Setenv("GOTRUE_MAILER_EMAIL_VALIDATION_SERVICE_HEADERS", `{"apikey":["test"]}`)
	os.Setenv("GOTRUE_SMTP_LOGGING_ENABLED", "true")
	gc, err := LoadGlobal("")
	require.NoError(t, err)
	assert.Equal(t, true, gc.SMTP.LoggingEnabled)
	require.NotNil(t, gc)
	assert.Equal(t, "X-Request-ID", gc.API.RequestIDHeader)
	assert.Equal(t, "pg-functions://postgres/auth/count_failed_attempts", gc.Hook.MFAVerificationAttempt.URI)

	{
		hdrs := gc.SMTP.NormalizedHeaders()
		require.NoError(t, err)
		assert.Equal(t, 1, len(hdrs["X-PM-Metadata-project-ref"]))
		assert.Equal(t, "project_ref", hdrs["X-PM-Metadata-project-ref"][0])
	}

	{
		hdrs := gc.Mailer.GetEmailValidationServiceHeaders()
		require.NoError(t, err)
		assert.Equal(t, 1, len(hdrs["apikey"]))
		assert.Equal(t, "test", hdrs["apikey"][0])
	}

	{
		os.Setenv("GOTRUE_RATE_LIMIT_EMAIL_SENT", "0/1h")

		gc, err := LoadGlobal("")
		require.NoError(t, err)
		assert.Equal(t, float64(0), gc.RateLimitEmailSent.Events)
		assert.Equal(t, time.Hour, gc.RateLimitEmailSent.OverTime)
	}

	{
		os.Setenv("GOTRUE_RATE_LIMIT_EMAIL_SENT", "10/1h")

		gc, err := LoadGlobal("")
		require.NoError(t, err)
		assert.Equal(t, float64(10), gc.RateLimitEmailSent.Events)
		assert.Equal(t, time.Hour, gc.RateLimitEmailSent.OverTime)
	}

	{
		gc, err := LoadGlobal("")
		require.NoError(t, err)
		assert.Equal(t, false, gc.Mailer.EmailBackgroundSending)

		os.Setenv("GOTRUE_MAILER_EMAIL_BACKGROUND_SENDING", "true")
		gc, err = LoadGlobal("")
		require.NoError(t, err)
		assert.Equal(t, true, gc.Mailer.EmailBackgroundSending)
	}

	{
		cfg, err := LoadGlobalFromEnv()
		require.NoError(t, err)
		require.NotNil(t, cfg)
	}

	{
		cfg, err := LoadGlobal("")
		require.NoError(t, err)
		require.NotNil(t, cfg)
	}

	{
		cfg, err := LoadGlobal("__invalid__")
		require.Error(t, err)
		require.Nil(t, cfg)
	}

	{
		os.Setenv("GOTRUE_MAILER_AUTOCONFIRM", "TRUE")
		os.Setenv("GOTRUE_MAILER_ALLOW_UNVERIFIED_EMAIL_SIGN_INS", "TRUE")
		cfg, err := LoadGlobal("")
		require.Error(t, err)
		require.Nil(t, cfg)
		os.Setenv("GOTRUE_MAILER_AUTOCONFIRM", "FALSE")
		os.Setenv("GOTRUE_MAILER_ALLOW_UNVERIFIED_EMAIL_SIGN_INS", "FALSE")
	}

	{
		os.Setenv("API_EXTERNAL_URL", "")
		cfg := new(conf.GlobalConfiguration)
		err := loadGlobal(cfg)
		require.Error(t, err)
		os.Setenv("API_EXTERNAL_URL", "http://localhost:9999")
	}

	{
		os.Setenv("API_EXTERNAL_URL", "")
		cfg := new(conf.GlobalConfiguration)
		cfg.Hook = conf.HookConfiguration{
			PasswordVerificationAttempt: conf.ExtensibilityPointConfiguration{
				Enabled: true,
				URI:     "\n",
			},
		}

		err := cfg.PopulateGlobal()
		require.Error(t, err)
		os.Setenv("API_EXTERNAL_URL", "http://localhost:9999")
	}

	{
		os.Setenv("API_EXTERNAL_URL", "")
		cfg := new(conf.GlobalConfiguration)
		cfg.Hook = conf.HookConfiguration{
			SendSMS: conf.ExtensibilityPointConfiguration{
				Enabled: true,
				URI:     "\n",
			},
		}

		err := cfg.PopulateGlobal()
		require.Error(t, err)
		os.Setenv("API_EXTERNAL_URL", "http://localhost:9999")
	}

	{
		os.Setenv("API_EXTERNAL_URL", "")
		cfg := new(conf.GlobalConfiguration)
		cfg.Hook = conf.HookConfiguration{
			SendEmail: conf.ExtensibilityPointConfiguration{
				Enabled: true,
				URI:     "\n",
			},
		}

		err := cfg.PopulateGlobal()
		require.Error(t, err)
		os.Setenv("API_EXTERNAL_URL", "http://localhost:9999")
	}

	{
		os.Setenv("API_EXTERNAL_URL", "")
		cfg := new(conf.GlobalConfiguration)
		cfg.Hook = conf.HookConfiguration{
			MFAVerificationAttempt: conf.ExtensibilityPointConfiguration{
				Enabled: true,
				URI:     "\n",
			},
		}

		err := cfg.PopulateGlobal()
		require.Error(t, err)
		os.Setenv("API_EXTERNAL_URL", "http://localhost:9999")
	}

	{
		os.Setenv("API_EXTERNAL_URL", "")
		cfg := new(conf.GlobalConfiguration)
		cfg.Hook = conf.HookConfiguration{
			CustomAccessToken: conf.ExtensibilityPointConfiguration{
				Enabled: true,
				URI:     "\n",
			},
		}

		err := cfg.PopulateGlobal()
		require.Error(t, err)
		os.Setenv("API_EXTERNAL_URL", "http://localhost:9999")
	}

	{
		os.Setenv("API_EXTERNAL_URL", "")
		cfg := new(conf.GlobalConfiguration)
		cfg.Hook = conf.HookConfiguration{
			BeforeUserCreated: conf.ExtensibilityPointConfiguration{
				Enabled: true,
				URI:     "\n",
			},
		}

		err := cfg.PopulateGlobal()
		require.Error(t, err)
		os.Setenv("API_EXTERNAL_URL", "http://localhost:9999")
	}

	{
		os.Setenv("API_EXTERNAL_URL", "")
		cfg := new(conf.GlobalConfiguration)
		cfg.Hook = conf.HookConfiguration{
			AfterUserCreated: conf.ExtensibilityPointConfiguration{
				Enabled: true,
				URI:     "\n",
			},
		}

		err := cfg.PopulateGlobal()
		require.Error(t, err)
		os.Setenv("API_EXTERNAL_URL", "http://localhost:9999")
	}

}

func TestExperimentalProviderLinkingDomains(t *testing.T) {
	os.Clearenv()
	os.Setenv("GOTRUE_SITE_URL", "http://localhost:8080")
	os.Setenv("GOTRUE_DB_DRIVER", "postgres")
	os.Setenv("GOTRUE_DB_DATABASE_URL", "fake")
	os.Setenv("GOTRUE_OPERATOR_TOKEN", "token")
	os.Setenv("GOTRUE_JWT_SECRET", "secret")
	os.Setenv("API_EXTERNAL_URL", "http://localhost:9999")
	os.Setenv("GOTRUE_EXPERIMENTAL_PROVIDER_LINKING_DOMAINS", "github=social,custom:google=social")

	cfg, err := LoadGlobalFromEnv()
	require.NoError(t, err)
	require.NotNil(t, cfg)
	assert.Equal(t, conf.ProviderLinkingDomains{
		"github":        "social",
		"custom:google": "social",
	}, cfg.Experimental.ProviderLinkingDomains)
}

func TestExperimentalCursorPaginationEnabled(t *testing.T) {
	baseEnv := func() {
		os.Clearenv()
		os.Setenv("GOTRUE_SITE_URL", "http://localhost:8080")
		os.Setenv("GOTRUE_DB_DRIVER", "postgres")
		os.Setenv("GOTRUE_DB_DATABASE_URL", "fake")
		os.Setenv("GOTRUE_OPERATOR_TOKEN", "token")
		os.Setenv("GOTRUE_JWT_SECRET", "secret")
		os.Setenv("API_EXTERNAL_URL", "http://localhost:9999")
	}

	// defaults to false when unset
	{
		baseEnv()
		cfg, err := LoadGlobalFromEnv()
		require.NoError(t, err)
		require.NotNil(t, cfg)
		assert.Equal(t, false, cfg.Experimental.CursorPaginationEnabled)
	}

	// maps GOTRUE_EXPERIMENTAL_CURSOR_PAGINATION_ENABLED=true into the field
	{
		baseEnv()
		os.Setenv("GOTRUE_EXPERIMENTAL_CURSOR_PAGINATION_ENABLED", "true")
		cfg, err := LoadGlobalFromEnv()
		require.NoError(t, err)
		require.NotNil(t, cfg)
		assert.Equal(t, true, cfg.Experimental.CursorPaginationEnabled)
	}
}

func TestExperimentalScimEndpoints(t *testing.T) {
	baseEnv := func() {
		os.Clearenv()
		os.Setenv("GOTRUE_SITE_URL", "http://localhost:8080")
		os.Setenv("GOTRUE_DB_DRIVER", "postgres")
		os.Setenv("GOTRUE_DB_DATABASE_URL", "fake")
		os.Setenv("GOTRUE_JWT_SECRET", "secret")
		os.Setenv("API_EXTERNAL_URL", "http://localhost:9999")
	}

	{
		baseEnv()
		cfg, err := LoadGlobalFromEnv()
		require.NoError(t, err)
		require.NotNil(t, cfg)
		assert.Equal(t, false, cfg.Experimental.ScimEnabled)
	}

	{
		baseEnv()
		os.Setenv("GOTRUE_EXPERIMENTAL_SCIM_ENABLED", "true")
		cfg, err := LoadGlobalFromEnv()
		require.NoError(t, err)
		require.NotNil(t, cfg)
		assert.Equal(t, true, cfg.Experimental.ScimEnabled)
	}
}

func TestMFARecoveryCodesConfig(t *testing.T) {
	baseEnv := func() {
		os.Clearenv()
		os.Setenv("GOTRUE_SITE_URL", "http://localhost:8080")
		os.Setenv("GOTRUE_DB_DRIVER", "postgres")
		os.Setenv("GOTRUE_DB_DATABASE_URL", "fake")
		os.Setenv("GOTRUE_JWT_SECRET", "secret")
		os.Setenv("API_EXTERNAL_URL", "http://localhost:9999")
	}

	// defaults land when no recovery-code vars are set
	{
		baseEnv()
		cfg, err := LoadGlobalFromEnv()
		require.NoError(t, err)
		require.NotNil(t, cfg)
		assert.Equal(t, false, cfg.MFA.RecoveryCodes.EnrollEnabled)
		assert.Equal(t, false, cfg.MFA.RecoveryCodes.VerifyEnabled)
		assert.Equal(t, 10, cfg.MFA.RecoveryCodes.Count)
		assert.Equal(t, 16, cfg.MFA.RecoveryCodes.CodeLength)
		assert.Equal(t, 5, cfg.MFA.RecoveryCodes.MaxVerifyAttempts)
		assert.Equal(t, 15*time.Minute, cfg.MFA.RecoveryCodes.LockoutDuration)
	}

	// maps GOTRUE_MFA_RECOVERY_CODES_* into the struct
	{
		baseEnv()
		os.Setenv("GOTRUE_MFA_RECOVERY_CODES_ENROLL_ENABLED", "true")
		os.Setenv("GOTRUE_MFA_RECOVERY_CODES_VERIFY_ENABLED", "true")
		os.Setenv("GOTRUE_MFA_RECOVERY_CODES_COUNT", "12")
		os.Setenv("GOTRUE_MFA_RECOVERY_CODES_CODE_LENGTH", "20")
		os.Setenv("GOTRUE_MFA_RECOVERY_CODES_MAX_VERIFY_ATTEMPTS", "4")
		os.Setenv("GOTRUE_MFA_RECOVERY_CODES_LOCKOUT_DURATION", "30m")
		cfg, err := LoadGlobalFromEnv()
		require.NoError(t, err)
		require.NotNil(t, cfg)
		assert.Equal(t, true, cfg.MFA.RecoveryCodes.EnrollEnabled)
		assert.Equal(t, true, cfg.MFA.RecoveryCodes.VerifyEnabled)
		assert.Equal(t, 12, cfg.MFA.RecoveryCodes.Count)
		assert.Equal(t, 20, cfg.MFA.RecoveryCodes.CodeLength)
		assert.Equal(t, 4, cfg.MFA.RecoveryCodes.MaxVerifyAttempts)
		assert.Equal(t, 30*time.Minute, cfg.MFA.RecoveryCodes.LockoutDuration)
	}

	// an explicit out-of-range value fails loading when the feature is enabled
	{
		baseEnv()
		os.Setenv("GOTRUE_MFA_RECOVERY_CODES_ENROLL_ENABLED", "true")
		os.Setenv("GOTRUE_MFA_RECOVERY_CODES_COUNT", "0")
		cfg, err := LoadGlobalFromEnv()
		require.Error(t, err)
		require.Nil(t, cfg)
		require.Contains(t, err.Error(), "GOTRUE_MFA_RECOVERY_CODES_COUNT must be between 4 and 16, got 0")
	}

	// out-of-range values are ignored while the feature is disabled
	{
		baseEnv()
		os.Setenv("GOTRUE_MFA_RECOVERY_CODES_COUNT", "0")
		cfg, err := LoadGlobalFromEnv()
		require.NoError(t, err)
		require.NotNil(t, cfg)
		assert.Equal(t, 0, cfg.MFA.RecoveryCodes.Count)
	}
}

func TestLoading(t *testing.T) {
	os.Clearenv()

	{
		os.Clearenv()
		err := LoadFile("abc")
		require.Error(t, err)
	}

	{
		os.Clearenv()
		err := LoadFile("")
		require.NoError(t, err)
	}

	{
		os.Clearenv()
		err := loadEnvironment("abc")
		require.Error(t, err)
	}

	{
		os.Clearenv()
		err := loadEnvironment("")
		require.NoError(t, err)
	}

	{
		os.Clearenv()
		err := LoadDirectory("")
		require.NoError(t, err)
	}

	{
		os.Clearenv()
		err := LoadDirectory("__invalid__")
		require.Error(t, err)
		require.Contains(t, err.Error(),
			`open __invalid__: no such file or directory`)
	}

	{
		os.Clearenv()
		err := LoadDirectory("../../reloader/testdata")
		require.NoError(t, err)
	}

	{
		os.Clearenv()
		err := loadDirectoryPaths("__invalid__")
		require.Error(t, err)
	}

	{
		os.Clearenv()
		os.Setenv("GOTRUE_SITE_URL", "http://localhost:8080")
		os.Setenv("GOTRUE_DB_DRIVER", "postgres")
		os.Setenv("GOTRUE_DB_DATABASE_URL", "fake")
		os.Setenv("GOTRUE_OPERATOR_TOKEN", "token")
		os.Setenv("GOTRUE_JWT_SECRET", "secret")
		os.Setenv("API_EXTERNAL_URL", "http://localhost:9999")

		cfg, err := LoadGlobalFromEnv()
		require.NoError(t, err)
		require.NotNil(t, cfg)
	}
}
