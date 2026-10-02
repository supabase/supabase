package conf

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/url"
	"regexp"
	"strings"
	"text/template"
	"time"

	"github.com/gobwas/glob"
	"github.com/golang-jwt/jwt/v5"
	"github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/sirupsen/logrus"
	"gopkg.in/gomail.v2"
)

const defaultMinPasswordLength int = 6
const defaultChallengeExpiryDuration float64 = 300
const defaultFactorExpiryDuration time.Duration = 300 * time.Second
const defaultFlowStateExpiryDuration time.Duration = 300 * time.Second

// maxOtpExp is the largest OTP validity window, in seconds, that survives
// conversion to a time.Duration, which counts nanoseconds in an int64. That is
// roughly 292 years. ApplyDefaults clamps OtpExp to it so the conversion cannot
// overflow into a negative duration, which would expire tokens at creation.
const maxOtpExp uint = math.MaxInt64 / uint(time.Second)

// See: https://www.postgresql.org/docs/7.0/syntax525.htm
var postgresNamesRegexp = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]{0,62}$`)

// See: https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md
// We use 4 * Math.ceil(n/3) to obtain unpadded length in base 64
// So this 4 * Math.ceil(24/3) = 32 and 4 * Math.ceil(64/3) = 88 for symmetric secrets
// Since Ed25519 key is 32 bytes so we have 4 * Math.ceil(32/3) = 44
var symmetricSecretFormat = regexp.MustCompile(`^v1,whsec_[A-Za-z0-9+/=]{32,88}`)
var asymmetricSecretFormat = regexp.MustCompile(`^v1a,whpk_[A-Za-z0-9+/=]{44,}:whsk_[A-Za-z0-9+/=]{44,}$`)

// Time is used to represent timestamps in the configuration, as envconfig has
// trouble parsing empty strings, due to time.Time.UnmarshalText().
type Time struct {
	time.Time
}

func (t *Time) UnmarshalText(text []byte) error {
	trimed := bytes.TrimSpace(text)

	if len(trimed) < 1 {
		t.Time = time.Time{}
	} else {
		if err := t.Time.UnmarshalText(trimed); err != nil {
			return err
		}
	}

	return nil
}

// OAuthProviderConfiguration holds all config related to external account providers.
type OAuthProviderConfiguration struct {
	ClientID      []string `json:"client_id" split_words:"true"`
	Secret        string   `json:"secret"`
	RedirectURI   string   `json:"redirect_uri" split_words:"true"`
	URL           string   `json:"url"`
	ApiURL        string   `json:"api_url" split_words:"true"`
	Enabled       bool     `json:"enabled"`
	EmailOptional bool     `json:"email_optional" split_words:"true"`
	// SkipNonceCheck bypasses nonce verification during OIDC token validation.
	// Note: Nonce verification helps prevent replay attacks; only disable when necessary.
	SkipNonceCheck bool `json:"skip_nonce_check" split_words:"true"`
}

// OAuthServerConfiguration holds OAuth server configuration
type OAuthServerConfiguration struct {
	Enabled                  bool          `json:"enabled" default:"false"`
	AllowDynamicRegistration bool          `json:"allow_dynamic_registration" split_words:"true"`
	AuthorizationPath        string        `json:"authorization_path" split_words:"true"`
	AuthorizationTTL         time.Duration `json:"authorization_ttl" split_words:"true" default:"10m"`
	// Placeholder for now, for (near) future extensibility
	DefaultScope string `json:"default_scope" split_words:"true" default:"email"`
}

type AnonymousProviderConfiguration struct {
	Enabled bool `json:"enabled" default:"false"`
}

// CustomOAuthConfiguration holds configuration for custom OAuth and OIDC providers
type CustomOAuthConfiguration struct {
	Enabled      bool   `json:"enabled" split_words:"true" default:"true"`
	MaxProviders int    `json:"max_providers" split_words:"true" default:"0"`
	ExternalURL  string `json:"external_url,omitempty" split_words:"true"`
}

func (c *CustomOAuthConfiguration) Validate() error {
	if c.ExternalURL != "" {
		if _, err := url.ParseRequestURI(c.ExternalURL); err != nil {
			return err
		}
	}

	return nil
}

type EmailProviderConfiguration struct {
	Enabled bool `json:"enabled" default:"true"`

	AuthorizedAddresses []string `json:"authorized_addresses" split_words:"true"`

	MagicLinkEnabled bool `json:"magic_link_enabled" default:"true" split_words:"true"`
}

type DBAdvisorConfiguration struct {
	Enabled             bool          `json:"enabled" default:"true"`
	SamplingInterval    time.Duration `json:"sampling_interval" split_words:"true" default:"200ms"`
	ObservationInterval time.Duration `json:"observation_interval" split_words:"true" default:"20s"`
}

// DBConfiguration holds all the database related configuration.
type DBConfiguration struct {
	Driver    string `json:"driver" required:"true"`
	URL       string `json:"url" envconfig:"DATABASE_URL" required:"true"`
	Namespace string `json:"namespace" envconfig:"DB_NAMESPACE" default:"auth"`

	// Percentage of DB conns the auth server may use in
	// integer form i.e.: [1, 100] -> [1%, 100%]
	ConnPercentage int `json:"conn_percentage" split_words:"true"`

	// MaxPoolSize defaults to 0 (unlimited).
	MaxPoolSize       int           `json:"max_pool_size" split_words:"true"`
	MaxIdlePoolSize   int           `json:"max_idle_pool_size" split_words:"true"`
	ConnMaxLifetime   time.Duration `json:"conn_max_lifetime,omitempty" split_words:"true"`
	ConnMaxIdleTime   time.Duration `json:"conn_max_idle_time,omitempty" split_words:"true"`
	HealthCheckPeriod time.Duration `json:"health_check_period" split_words:"true"`
	MigrationsPath    string        `json:"migrations_path" split_words:"true" default:"./migrations"`
	CleanupEnabled    bool          `json:"cleanup_enabled" split_words:"true" default:"false"`

	Advisor DBAdvisorConfiguration `json:"advisor"`
}

func (c *DBConfiguration) Validate() error {
	c.ConnPercentage = min(max(c.ConnPercentage, 0), 100)
	return nil
}

// JWTConfiguration holds all the JWT related configuration.
type JWTConfiguration struct {
	Secret           string         `json:"secret" required:"true"`
	Exp              int            `json:"exp"`
	Aud              string         `json:"aud"`
	AdminGroupName   string         `json:"admin_group_name" split_words:"true"`
	AdminRoles       []string       `json:"admin_roles" split_words:"true"`
	DefaultGroupName string         `json:"default_group_name" split_words:"true"`
	Issuer           string         `json:"issuer"`
	KeyID            string         `json:"key_id" split_words:"true"`
	Keys             JwtKeysDecoder `json:"keys"`
	ValidMethods     []string       `json:"-" split_words:"true"`

	SigningKey func(context.Context) (any, error) `json:"-"`
}

type MFAFactorTypeConfiguration struct {
	EnrollEnabled bool `json:"enroll_enabled" split_words:"true" default:"false"`
	VerifyEnabled bool `json:"verify_enabled" split_words:"true" default:"false"`
}

type TOTPFactorTypeConfiguration struct {
	EnrollEnabled bool `json:"enroll_enabled" split_words:"true" default:"true"`
	VerifyEnabled bool `json:"verify_enabled" split_words:"true" default:"true"`
}

type PhoneFactorTypeConfiguration struct {
	// Default to false in order to ensure Phone MFA is opt-in
	MFAFactorTypeConfiguration
	OtpLength    int                `json:"otp_length" split_words:"true"`
	SMSTemplate  *template.Template `json:"-"`
	MaxFrequency time.Duration      `json:"max_frequency" split_words:"true"`
	Template     string             `json:"template"`
}

type RecoveryCodesFactorTypeConfiguration struct {
	EnrollEnabled     bool          `json:"enroll_enabled" split_words:"true" default:"false"`
	VerifyEnabled     bool          `json:"verify_enabled" split_words:"true" default:"false"`
	Count             int           `json:"count" default:"10"`
	CodeLength        int           `json:"code_length" split_words:"true" default:"16"`
	MaxVerifyAttempts int           `json:"max_verify_attempts" split_words:"true" default:"5"`
	LockoutDuration   time.Duration `json:"lockout_duration" split_words:"true" default:"15m"`
}

func (c *RecoveryCodesFactorTypeConfiguration) Validate() error {
	if !c.EnrollEnabled && !c.VerifyEnabled {
		return nil
	}

	var errs []error
	if c.Count < 4 || c.Count > 16 {
		errs = append(errs, fmt.Errorf("conf: GOTRUE_MFA_RECOVERY_CODES_COUNT must be between 4 and 16, got %d", c.Count))
	}
	if c.CodeLength < 13 || c.CodeLength > 32 {
		errs = append(errs, fmt.Errorf("conf: GOTRUE_MFA_RECOVERY_CODES_CODE_LENGTH must be between 13 and 32, got %d", c.CodeLength))
	}
	if c.MaxVerifyAttempts < 3 || c.MaxVerifyAttempts > 15 {
		errs = append(errs, fmt.Errorf("conf: GOTRUE_MFA_RECOVERY_CODES_MAX_VERIFY_ATTEMPTS must be between 3 and 15, got %d", c.MaxVerifyAttempts))
	}
	if c.LockoutDuration < time.Minute || c.LockoutDuration > 24*time.Hour {
		errs = append(errs, fmt.Errorf("conf: GOTRUE_MFA_RECOVERY_CODES_LOCKOUT_DURATION must be between 1m and 24h, got %v", c.LockoutDuration))
	}
	return errors.Join(errs...)
}

// MFAConfiguration holds all the MFA related Configuration
type MFAConfiguration struct {
	ChallengeExpiryDuration     float64                              `json:"challenge_expiry_duration" default:"300" split_words:"true"`
	FactorExpiryDuration        time.Duration                        `json:"factor_expiry_duration" default:"300s" split_words:"true"`
	RateLimitChallengeAndVerify float64                              `split_words:"true" default:"15"`
	MaxEnrolledFactors          float64                              `split_words:"true" default:"10"`
	MaxVerifiedFactors          int                                  `split_words:"true" default:"10"`
	Phone                       PhoneFactorTypeConfiguration         `split_words:"true"`
	TOTP                        TOTPFactorTypeConfiguration          `split_words:"true"`
	WebAuthn                    MFAFactorTypeConfiguration           `split_words:"true"`
	RecoveryCodes               RecoveryCodesFactorTypeConfiguration `split_words:"true"`
}

type WebAuthnConfiguration struct {
	RPID                    string        `json:"rp_id" envconfig:"RP_ID"`
	RPDisplayName           string        `json:"rp_display_name" split_words:"true"`
	RPOrigins               []string      `json:"rp_origins" split_words:"true"`
	ChallengeExpiryDuration time.Duration `json:"challenge_expiry_duration" split_words:"true" default:"5m"`
}

func (w *WebAuthnConfiguration) Validate() error {
	if w.RPID == "" {
		return errors.New("conf: GOTRUE_WEBAUTHN_RP_ID is required when WebAuthn is enabled")
	}

	if w.RPDisplayName == "" {
		return errors.New("conf: GOTRUE_WEBAUTHN_RP_DISPLAY_NAME is required when WebAuthn is enabled")
	}

	if len(w.RPOrigins) == 0 {
		return errors.New("conf: GOTRUE_WEBAUTHN_RP_ORIGINS is required when WebAuthn is enabled")
	}

	return nil
}

type PasskeyConfiguration struct {
	Enabled            bool `json:"enabled" default:"false"`
	MaxPasskeysPerUser int  `json:"max_passkeys_per_user" split_words:"true" default:"10"`
}

type APIConfiguration struct {
	Host               string
	Port               string `envconfig:"PORT" default:"8081"`
	Endpoint           string
	RequestIDHeader    string        `envconfig:"REQUEST_ID_HEADER"`
	ExternalURL        string        `json:"external_url" envconfig:"API_EXTERNAL_URL" required:"true"`
	MaxRequestDuration time.Duration `json:"max_request_duration" split_words:"true" default:"10s"`
}

func (a *APIConfiguration) Validate() error {
	_, err := url.ParseRequestURI(a.ExternalURL)
	if err != nil {
		return err
	}

	return nil
}

type SessionsConfiguration struct {
	Timebox           *time.Duration `json:"timebox,omitempty"`
	InactivityTimeout *time.Duration `json:"inactivity_timeout,omitempty" split_words:"true"`
	AllowLowAAL       *time.Duration `json:"allow_low_aal,omitempty" split_words:"true"`

	SinglePerUser bool     `json:"single_per_user" split_words:"true"`
	Tags          []string `json:"tags,omitempty"`
}

func (c *SessionsConfiguration) Validate() error {
	if c.Timebox != nil && *c.Timebox <= time.Duration(0) {
		return fmt.Errorf("conf: session timebox duration must be positive when set, was %v", (*c.Timebox).String())
	}

	if c.InactivityTimeout != nil && *c.InactivityTimeout <= time.Duration(0) {
		return fmt.Errorf("conf: session inactivity timeout duration must be positive when set, was %v", (*c.InactivityTimeout).String())
	}

	if c.AllowLowAAL != nil && *c.AllowLowAAL <= time.Duration(0) {
		return fmt.Errorf("conf: session allow low AAL duration must be positive when set, was %v", (*c.AllowLowAAL).String())
	}

	return nil
}

type PasswordRequiredCharacters []string

func (v *PasswordRequiredCharacters) Decode(value string) error {
	parts := strings.Split(value, ":")

	for i := 0; i < len(parts)-1; i += 1 {
		part := parts[i]

		if part == "" {
			continue
		}

		// part ended in escape character, so it should be joined with the next one
		if part[len(part)-1] == '\\' {
			parts[i] = part[0:len(part)-1] + ":" + parts[i+1]
			parts[i+1] = ""
			continue
		}
	}

	for _, part := range parts {
		if part != "" {
			*v = append(*v, part)
		}
	}

	return nil
}

// HIBPBloomConfiguration configures a bloom cache for pwned passwords. Use
// this tool to gauge the Items and FalsePositives values:
// https://hur.st/bloomfilter
type HIBPBloomConfiguration struct {
	Enabled        bool    `json:"enabled"`
	Items          uint    `json:"items" default:"100000"`
	FalsePositives float64 `json:"false_positives" split_words:"true" default:"0.0000099"`
}

type HIBPConfiguration struct {
	Enabled    bool `json:"enabled"`
	FailClosed bool `json:"fail_closed" split_words:"true"`

	UserAgent string `json:"user_agent" split_words:"true" default:"https://github.com/supabase/gotrue"`

	Bloom HIBPBloomConfiguration `json:"bloom"`
}

type PasswordConfiguration struct {
	MinLength int `json:"min_length" split_words:"true"`

	RequiredCharacters PasswordRequiredCharacters `json:"required_characters" split_words:"true"`

	HIBP HIBPConfiguration `json:"hibp"`
}

type AuditLogConfiguration struct {
	DisablePostgres bool `split_words:"true" default:"false"`
}

// ProviderLinkingDomains maps a provider name to the account-linking domain it
// belongs to. Providers mapped to the same domain link to one another (a
// matching email lands on the same account) but stay isolated from the
// "default" (email-linked) pool and from SSO.
//
// Provider names can themselves contain a colon (custom OAuth providers are
// named "custom:<identifier>", e.g. "custom:github"), so the env format uses
// "=" — not ":" — to separate the provider from its domain. Pairs are
// comma-separated:
//
//	GOTRUE_EXPERIMENTAL_PROVIDER_LINKING_DOMAINS="custom:github=social,custom:google=social"
type ProviderLinkingDomains map[string]string

func (d *ProviderLinkingDomains) Decode(value string) error {
	result := ProviderLinkingDomains{}
	if value = strings.TrimSpace(value); value != "" {
		for _, pair := range strings.Split(value, ",") {
			kv := strings.SplitN(pair, "=", 2)
			if len(kv) != 2 {
				return fmt.Errorf("conf: invalid provider linking domain %q, expected format \"provider=domain\"", pair)
			}
			provider, domain := strings.TrimSpace(kv[0]), strings.TrimSpace(kv[1])
			if provider == "" || domain == "" {
				return fmt.Errorf("conf: invalid provider linking domain %q, provider and domain must be non-empty", pair)
			}
			result[provider] = domain
		}
	}
	*d = result
	return nil
}

type ExperimentalConfiguration struct {
	// DEPRECATED: use ProviderLinkingDomains instead. Kept for backward
	// compatibility; auto-migrated in ApplyDefaults into ProviderLinkingDomains as
	// {provider: provider}.
	//
	// Names of providers (e.g. "google") which have their own identity
	// linking domain, meaning that the ones listed here _will not
	// participate_ in email similarity linking with other accounts.
	ProvidersWithOwnLinkingDomain []string `split_words:"true"`

	// ProviderLinkingDomains maps a provider name to the account-linking domain
	// it belongs to. See the ProviderLinkingDomains type for the env format.
	// Env: GOTRUE_EXPERIMENTAL_PROVIDER_LINKING_DOMAINS="custom:github=social,custom:google=social"
	ProviderLinkingDomains ProviderLinkingDomains `split_words:"true"`

	// CursorPaginationEnabled turns on cursor-based (keyset) pagination for the
	// admin user list endpoint. When enabled and no `page` query param is
	// provided, GET /admin/users serves fast, count-free cursor pages.
	// Env: GOTRUE_EXPERIMENTAL_CURSOR_PAGINATION_ENABLED=true
	CursorPaginationEnabled bool `split_words:"true" default:"false"`

	// ScimEnabled gates the /scim/v2 router. Ships dark: no per-provider
	// enablement yet, just a kill switch for internal verification.
	// Env: GOTRUE_EXPERIMENTAL_SCIM_ENABLED=true
	ScimEnabled bool `split_words:"true" default:"false"`

	// CreateEmailIdentityOnPasswordSetEnabled creates the missing email provider
	// identity for a user when a password is added to an account that didn't have
	// one (e.g. a user who signed up with an external provider and later sets a password).
	// Env: GOTRUE_EXPERIMENTAL_CREATE_EMAIL_IDENTITY_ON_PASSWORD_SET_ENABLED=true
	CreateEmailIdentityOnPasswordSetEnabled bool `split_words:"true" default:"false"`

	// EnableOTTAsSourceOfTruth makes the typed-OTP verification path read the
	// challenge from the one_time_tokens table instead of the users.*_token
	// columns. A lookup miss is rejected as an expired or invalid token; there is
	// no fallback to the users columns.
	// Env: GOTRUE_EXPERIMENTAL_ENABLE_OTT_AS_SOURCE_OF_TRUTH=true
	EnableOTTAsSourceOfTruth bool `split_words:"true" default:"false"`

	// OneTimeTokenExpiresAtWriteEnabled sets one_time_tokens.expires_at when a
	// one-time token is created. Ships dark: nothing reads the column yet.
	// Env: GOTRUE_EXPERIMENTAL_ONE_TIME_TOKEN_EXPIRES_AT_WRITE_ENABLED=true
	OneTimeTokenExpiresAtWriteEnabled bool `split_words:"true" default:"false"`
}

// ReloadingConfiguration holds the configuration values for runtime
// configuration reloads. These are startup configuration values meaning
// they do not react to live config reloads.
//
// IMPORTANT:
// * You must provide the --config-dir flag for these settings to take effect.
// * These config values are for startup, they remain static through reloads.
type ReloadingConfiguration struct {

	// If notify reloading is enabled the auth server will attempt to use the
	// filesystems notification support to watch for config updates.
	NotifyEnabled bool `json:"notify_enabled" split_words:"true" default:"true"`

	// When notify reloading fails, fallback to filesystem polling if this
	// setting is enabled.
	PollerEnabled bool `json:"poller_enabled" split_words:"false" default:"false"`

	// This determines how often to poll the filesystem when notify is disabled.
	PollerInterval time.Duration `json:"poller_interval" split_words:"true" default:"10s"`

	// If signal reloading is enabled the auth server will listen for the
	// given SignalNumber and reload the config when received. This may be
	// used to configure `systemd reload` support, by default the SIGUSR1 linux
	// signal number of 10 is used.
	SignalEnabled bool `json:"signal_enabled" split_words:"true" default:"false"`
	SignalNumber  int  `json:"signal_number" split_words:"true" default:"10"`

	// When at least one reloader is enabled this flag determines how much idle
	// time must pass before triggering a reload. This ensures a single
	// auth server config reload operation during a burst of config updates.
	GracePeriodInterval time.Duration `json:"grace_period_interval" split_words:"true" default:"5s"`
}

// GlobalConfiguration holds all the configuration that applies to all instances.
type GlobalConfiguration struct {
	API           APIConfiguration
	DB            DBConfiguration
	External      ProviderConfiguration
	CustomOAuth   CustomOAuthConfiguration `envconfig:"CUSTOM_OAUTH"`
	OAuthServer   OAuthServerConfiguration `envconfig:"OAUTH_SERVER"`
	Logging       LoggingConfig            `envconfig:"LOG"`
	Profiler      ProfilerConfig           `envconfig:"PROFILER"`
	OperatorToken string                   `split_words:"true" required:"false"`
	Tracing       TracingConfig
	Metrics       MetricsConfig
	SMTP          SMTPConfiguration
	AuditLog      AuditLogConfiguration `split_words:"true"`

	RateLimitHeader                     string  `split_words:"true"`
	RateLimitEmailSent                  Rate    `split_words:"true" default:"30"`
	RateLimitSmsSent                    Rate    `split_words:"true" default:"30"`
	RateLimitVerify                     float64 `split_words:"true" default:"30"`
	RateLimitTokenRefresh               float64 `split_words:"true" default:"150"`
	RateLimitSso                        float64 `split_words:"true" default:"30"`
	RateLimitAnonymousUsers             float64 `split_words:"true" default:"30"`
	RateLimitOtp                        float64 `split_words:"true" default:"30"`
	RateLimitWeb3                       float64 `split_words:"true" default:"30"`
	RateLimitPasskey                    float64 `split_words:"true" default:"30"`
	RateLimitOAuthDynamicClientRegister float64 `split_words:"true" default:"10"`

	SiteURL         string   `json:"site_url" split_words:"true" required:"true"`
	URIAllowList    []string `json:"uri_allow_list" split_words:"true"`
	URIAllowListMap map[string]glob.Glob
	Password        PasswordConfiguration    `json:"password"`
	JWT             JWTConfiguration         `json:"jwt"`
	Mailer          MailerConfiguration      `json:"mailer"`
	Sms             SmsProviderConfiguration `json:"sms"`
	DisableSignup   bool                     `json:"disable_signup" split_words:"true"`
	Hook            HookConfiguration        `json:"hook" split_words:"true"`
	Security        SecurityConfiguration    `json:"security"`
	Sessions        SessionsConfiguration    `json:"sessions"`
	MFA             MFAConfiguration         `json:"MFA"`
	SAML            SAMLConfiguration        `json:"saml"`
	WebAuthn        WebAuthnConfiguration    `json:"webauthn"`
	Passkey         PasskeyConfiguration     `json:"passkey"`
	CORS            CORSConfiguration        `json:"cors"`
	IndexWorker     IndexWorkerConfiguration `json:"index_worker" split_words:"true"`

	Experimental ExperimentalConfiguration `json:"experimental"`
	Reloading    ReloadingConfiguration    `json:"reloading"`
}

type CORSConfiguration struct {
	AllowedHeaders []string `json:"allowed_headers" split_words:"true"`
}

func (c *CORSConfiguration) AllAllowedHeaders(defaults []string) []string {
	set := make(map[string]bool)
	for _, header := range defaults {
		set[header] = true
	}

	var result []string
	result = append(result, defaults...)

	for _, header := range c.AllowedHeaders {
		if !set[header] {
			result = append(result, header)
		}

		set[header] = true
	}

	return result
}

// EmailContentConfiguration holds the configuration for emails, both subjects and template URLs.
type EmailContentConfiguration struct {
	Invite           string `json:"invite"`
	Confirmation     string `json:"confirmation"`
	Recovery         string `json:"recovery"`
	EmailChange      string `json:"email_change" split_words:"true"`
	MagicLink        string `json:"magic_link" split_words:"true"`
	Reauthentication string `json:"reauthentication"`

	// Account Changes Notifications
	PasswordChangedNotification     string `json:"password_changed_notification" split_words:"true"`
	EmailChangedNotification        string `json:"email_changed_notification" split_words:"true"`
	PhoneChangedNotification        string `json:"phone_changed_notification" split_words:"true"`
	IdentityLinkedNotification      string `json:"identity_linked_notification" split_words:"true"`
	IdentityUnlinkedNotification    string `json:"identity_unlinked_notification" split_words:"true"`
	MFAFactorEnrolledNotification   string `json:"mfa_factor_enrolled_notification" split_words:"true"`
	MFAFactorUnenrolledNotification string `json:"mfa_factor_unenrolled_notification" split_words:"true"`
}

// NotificationsConfiguration holds the configuration for notification email states to indicate whether they are enabled or disabled.
type NotificationsConfiguration struct {
	PasswordChangedEnabled     bool `json:"password_changed_enabled" split_words:"true" default:"false"`
	EmailChangedEnabled        bool `json:"email_changed_enabled" split_words:"true" default:"false"`
	PhoneChangedEnabled        bool `json:"phone_changed_enabled" split_words:"true" default:"false"`
	IdentityLinkedEnabled      bool `json:"identity_linked_enabled" split_words:"true" default:"false"`
	IdentityUnlinkedEnabled    bool `json:"identity_unlinked_enabled" split_words:"true" default:"false"`
	MFAFactorEnrolledEnabled   bool `json:"mfa_factor_enrolled_enabled" split_words:"true" default:"false"`
	MFAFactorUnenrolledEnabled bool `json:"mfa_factor_unenrolled_enabled" split_words:"true" default:"false"`
}

type ProviderConfiguration struct {
	AnonymousUsers          AnonymousProviderConfiguration `json:"anonymous_users" split_words:"true"`
	Apple                   OAuthProviderConfiguration     `json:"apple"`
	Azure                   OAuthProviderConfiguration     `json:"azure"`
	Bitbucket               OAuthProviderConfiguration     `json:"bitbucket"`
	Discord                 OAuthProviderConfiguration     `json:"discord"`
	Facebook                OAuthProviderConfiguration     `json:"facebook"`
	Snapchat                OAuthProviderConfiguration     `json:"snapchat"`
	Figma                   OAuthProviderConfiguration     `json:"figma"`
	Fly                     OAuthProviderConfiguration     `json:"fly"`
	Github                  OAuthProviderConfiguration     `json:"github"`
	Gitlab                  OAuthProviderConfiguration     `json:"gitlab"`
	Google                  OAuthProviderConfiguration     `json:"google"`
	Kakao                   OAuthProviderConfiguration     `json:"kakao"`
	Notion                  OAuthProviderConfiguration     `json:"notion"`
	Keycloak                OAuthProviderConfiguration     `json:"keycloak"`
	Linkedin                OAuthProviderConfiguration     `json:"linkedin"`
	LinkedinOIDC            OAuthProviderConfiguration     `json:"linkedin_oidc" envconfig:"LINKEDIN_OIDC"`
	Spotify                 OAuthProviderConfiguration     `json:"spotify"`
	Slack                   OAuthProviderConfiguration     `json:"slack"`
	SlackOIDC               OAuthProviderConfiguration     `json:"slack_oidc" envconfig:"SLACK_OIDC"`
	Twitter                 OAuthProviderConfiguration     `json:"twitter"`
	Twitch                  OAuthProviderConfiguration     `json:"twitch"`
	VercelMarketplace       OAuthProviderConfiguration     `json:"vercel_marketplace" split_words:"true"`
	WorkOS                  OAuthProviderConfiguration     `json:"workos"`
	Email                   EmailProviderConfiguration     `json:"email"`
	Phone                   PhoneProviderConfiguration     `json:"phone"`
	X                       OAuthProviderConfiguration     `json:"x" envconfig:"X"`
	Zoom                    OAuthProviderConfiguration     `json:"zoom"`
	IosBundleId             string                         `json:"ios_bundle_id" split_words:"true"`
	RedirectURL             string                         `json:"redirect_url"`
	AllowedIdTokenIssuers   []string                       `json:"allowed_id_token_issuers" split_words:"true"`
	FlowStateExpiryDuration time.Duration                  `json:"flow_state_expiry_duration" split_words:"true"`

	// OIDCProviderCacheTTL controls how long OIDC discovery documents are cached.
	OIDCProviderCacheTTL time.Duration `json:"oidc_provider_cache_ttl" split_words:"true" default:"1h"`

	Web3Solana   SolanaConfiguration   `json:"web3_solana" split_words:"true"`
	Web3Ethereum EthereumConfiguration `json:"web3_ethereum" split_words:"true"`
}

type SolanaConfiguration struct {
	Enabled                 bool          `json:"enabled,omitempty" split_words:"true"`
	MaximumValidityDuration time.Duration `json:"maximum_validity_duration,omitempty" default:"10m" split_words:"true"`
}

type EthereumConfiguration struct {
	Enabled                 bool          `json:"enabled,omitempty" split_words:"true"`
	MaximumValidityDuration time.Duration `json:"maximum_validity_duration,omitempty" default:"10m" split_words:"true"`
}

type SMTPConfiguration struct {
	MaxFrequency   time.Duration `json:"max_frequency" split_words:"true"`
	Host           string        `json:"host"`
	Port           int           `json:"port,omitempty" default:"587"`
	User           string        `json:"user"`
	Pass           string        `json:"pass,omitempty"`
	AdminEmail     string        `json:"admin_email" split_words:"true"`
	SenderName     string        `json:"sender_name" split_words:"true"`
	Headers        string        `json:"headers"`
	LoggingEnabled bool          `json:"logging_enabled" split_words:"true" default:"false"`

	fromAddress          string                           `json:"-"`
	normalizedHeadersVal cachedValue[map[string][]string] `json:"-"`
}

func (c *SMTPConfiguration) Validate() error {
	mail := gomail.NewMessage()
	c.fromAddress = mail.FormatAddress(c.AdminEmail, c.SenderName)
	c.normalizedHeadersVal = c.buildNormalizedHeaders()
	return nil
}

func (c *SMTPConfiguration) buildNormalizedHeaders() cachedValue[map[string][]string] {
	var zero map[string][]string
	if c.Headers == "" {
		return makeCachedValue(zero, nil)
	}

	val := make(map[string][]string)
	err := json.Unmarshal([]byte(c.Headers), &val)
	if err != nil {
		const msg = "conf: SMTP headers configuration is invalid, ignoring"
		logrus.WithError(err).Warn(msg)
		return makeCachedValue(zero, err)
	}
	if len(val) == 0 {
		return makeCachedValue(zero, nil)
	}
	return makeCachedValue(val, nil)
}

func (c *SMTPConfiguration) FromAddress() string {
	return c.fromAddress
}

func (c *SMTPConfiguration) NormalizedHeaders() map[string][]string {
	return c.normalizedHeadersVal.val
}

type MailerConfiguration struct {
	Autoconfirm                 bool `json:"autoconfirm"`
	AllowUnverifiedEmailSignIns bool `json:"allow_unverified_email_sign_ins" split_words:"true" default:"false"`

	Subjects      EmailContentConfiguration  `json:"subjects"`
	Templates     EmailContentConfiguration  `json:"templates"`
	URLPaths      EmailContentConfiguration  `json:"url_paths"`
	Notifications NotificationsConfiguration `json:"notifications" split_words:"true"`

	SecureEmailChangeEnabled bool `json:"secure_email_change_enabled" split_words:"true" default:"true"`

	OtpExp    uint `json:"otp_exp" split_words:"true"`
	OtpLength int  `json:"otp_length" split_words:"true"`

	ExternalHosts []string `json:"external_hosts" split_words:"true"`

	// EXPERIMENTAL: All config below here may be removed in a future release.
	EmailBackgroundSending        bool   `json:"email_background_sending" split_words:"true" default:"false"`
	EmailValidationExtended       bool   `json:"email_validation_extended" split_words:"true" default:"false"`
	EmailValidationServiceURL     string `json:"email_validation_service_url" split_words:"true"`
	EmailValidationServiceHeaders string `json:"email_validation_service_headers" split_words:"true"`
	EmailValidationBlockedMX      string `json:"email_validation_blocked_mx" split_words:"true"`

	// Max size in bytes we will read from a template endpoint
	TemplateMaxSize int `json:"template_max_size" split_words:"true" default:"1000000"`

	// The maximum age of a template before we consider it stale.
	TemplateMaxAge time.Duration `json:"template_max_age" split_words:"true" default:"10m"`

	// The time between retrying a failed template reload.
	TemplateRetryInterval time.Duration `json:"template_retry_interval" split_words:"true" default:"10s"`

	// If true enable background reloading of templates to avoid blocking
	// IO in requests.
	TemplateReloadingEnabled bool `json:"template_reloading_enabled" split_words:"true" default:"false"`

	// The maximum time a server may be idle before template reloading stops.
	// Note that even when the server is idle, a config reload will trigger a
	// template reload.
	TemplateReloadingMaxIdle time.Duration `json:"template_reloading_max_idle" split_words:"true" default:"20m"`

	serviceHeadersVal   cachedValue[map[string][]string] `json:"-"`
	blockedMXRecordsVal cachedValue[map[string]bool]     `json:"-"`
}

func (c *MailerConfiguration) OtpExpAsDuration() time.Duration {
	return time.Duration(c.OtpExp) * time.Second // #nosec G115 -- OtpExp comes from trusted config, not user input
}

func (c *MailerConfiguration) Validate() error {
	c.serviceHeadersVal = c.buildServiceHeaders()
	c.blockedMXRecordsVal = c.buildBlockedMXRecords()
	return nil
}

func (c *MailerConfiguration) GetEmailValidationServiceHeaders() map[string][]string {
	return c.serviceHeadersVal.val
}

func (c *MailerConfiguration) GetEmailValidationBlockedMXRecords() map[string]bool {
	return c.blockedMXRecordsVal.val
}

func (c *MailerConfiguration) buildServiceHeaders() cachedValue[map[string][]string] {
	var zero map[string][]string
	if c.EmailValidationServiceHeaders == "" {
		return makeCachedValue(zero, nil)
	}

	val := make(map[string][]string)
	err := json.Unmarshal([]byte(c.EmailValidationServiceHeaders), &val)
	if err != nil {
		const msg = "conf: mailer validation headers configuration is invalid, ignoring"
		logrus.WithError(err).Warn(msg)
		return makeCachedValue(zero, err)
	}
	if len(val) == 0 {
		return makeCachedValue(zero, nil)
	}
	return makeCachedValue(val, nil)
}

func (c *MailerConfiguration) buildBlockedMXRecords() cachedValue[map[string]bool] {
	var zero map[string]bool
	if c.EmailValidationBlockedMX == "" {
		return makeCachedValue(zero, nil)
	}

	var blockedMXArray []string
	err := json.Unmarshal([]byte(c.EmailValidationBlockedMX), &blockedMXArray)
	if err != nil {
		const msg = "conf: blocked mx records configuration is invalid, ignoring"
		logrus.WithError(err).Warn(msg)
		return makeCachedValue(zero, err)
	}

	val := make(map[string]bool, len(blockedMXArray)*2)
	for _, record := range blockedMXArray {
		val[record] = true
		val[record+"."] = true
	}
	return makeCachedValue(val, nil)
}

type cachedValue[T any] struct {
	val T
	err error
}

func makeCachedValue[T any](val T, err error) cachedValue[T] {
	return cachedValue[T]{
		val: val,
		err: err,
	}
}

type PhoneProviderConfiguration struct {
	Enabled bool `json:"enabled" default:"false"`
}

type SmsProviderConfiguration struct {
	Autoconfirm       bool               `json:"autoconfirm"`
	MaxFrequency      time.Duration      `json:"max_frequency" split_words:"true"`
	OtpExp            uint               `json:"otp_exp" split_words:"true"`
	OtpLength         int                `json:"otp_length" split_words:"true"`
	Provider          string             `json:"provider"`
	Template          string             `json:"template"`
	TestOTP           map[string]string  `json:"test_otp" split_words:"true"`
	TestOTPValidUntil Time               `json:"test_otp_valid_until" split_words:"true"`
	SMSTemplate       *template.Template `json:"-"`

	Twilio       TwilioProviderConfiguration       `json:"twilio"`
	TwilioVerify TwilioVerifyProviderConfiguration `json:"twilio_verify" split_words:"true"`
	Messagebird  MessagebirdProviderConfiguration  `json:"messagebird"`
	Textlocal    TextlocalProviderConfiguration    `json:"textlocal"`
	Vonage       VonageProviderConfiguration       `json:"vonage"`
}

func (c *SmsProviderConfiguration) OtpExpAsDuration() time.Duration {
	return time.Duration(c.OtpExp) * time.Second // #nosec G115 -- OtpExp comes from trusted config, not user input
}

func (c *SmsProviderConfiguration) GetTestOTP(phone string, now time.Time) (string, bool) {
	if c.TestOTP != nil && (c.TestOTPValidUntil.IsZero() || now.Before(c.TestOTPValidUntil.Time)) {
		testOTP, ok := c.TestOTP[phone]
		return testOTP, ok
	}

	return "", false
}

type TwilioProviderConfiguration struct {
	AccountSid        string `json:"account_sid" split_words:"true"`
	AuthToken         string `json:"auth_token" split_words:"true"`
	MessageServiceSid string `json:"message_service_sid" split_words:"true"`
	ContentSid        string `json:"content_sid" split_words:"true"`
}

type TwilioVerifyProviderConfiguration struct {
	AccountSid        string `json:"account_sid" split_words:"true"`
	AuthToken         string `json:"auth_token" split_words:"true"`
	MessageServiceSid string `json:"message_service_sid" split_words:"true"`
}

type MessagebirdProviderConfiguration struct {
	AccessKey  string `json:"access_key" split_words:"true"`
	Originator string `json:"originator" split_words:"true"`
}

type TextlocalProviderConfiguration struct {
	ApiKey string `json:"api_key" split_words:"true"`
	Sender string `json:"sender" split_words:"true"`
}

type VonageProviderConfiguration struct {
	ApiKey    string `json:"api_key" split_words:"true"`
	ApiSecret string `json:"api_secret" split_words:"true"`
	From      string `json:"from" split_words:"true"`
}

type CaptchaConfiguration struct {
	Enabled  bool          `json:"enabled" default:"false"`
	Provider string        `json:"provider" default:"hcaptcha"`
	Secret   string        `json:"provider_secret"`
	Timeout  time.Duration `json:"timeout" split_words:"true" default:"10s"`
}

func (c *CaptchaConfiguration) Validate() error {
	if !c.Enabled {
		return nil
	}

	if c.Provider != "hcaptcha" && c.Provider != "turnstile" {
		return fmt.Errorf("unsupported captcha provider: %s", c.Provider)
	}

	c.Secret = strings.TrimSpace(c.Secret)

	if c.Secret == "" {
		return errors.New("captcha provider secret is empty")
	}

	return nil
}

// DatabaseEncryptionConfiguration configures Auth to encrypt certain columns.
// Once Encrypt is set to true, data will start getting encrypted with the
// provided encryption key. Setting it to false just stops encryption from
// going on further, but DecryptionKeys would have to contain the same key so
// the encrypted data remains accessible.
type DatabaseEncryptionConfiguration struct {
	Encrypt bool `json:"encrypt"`

	EncryptionKeyID string `json:"encryption_key_id" split_words:"true"`
	EncryptionKey   string `json:"-" split_words:"true"`

	DecryptionKeys map[string]string `json:"-" split_words:"true"`
}

func (c *DatabaseEncryptionConfiguration) Validate() error {
	if c.Encrypt {
		if c.EncryptionKeyID == "" {
			return errors.New("conf: encryption key ID must be specified")
		}

		decodedKey, err := base64.RawURLEncoding.DecodeString(c.EncryptionKey)
		if err != nil {
			return err
		}

		if len(decodedKey) != 256/8 {
			return errors.New("conf: encryption key is not 256 bits")
		}

		if c.DecryptionKeys == nil || c.DecryptionKeys[c.EncryptionKeyID] == "" {
			return errors.New("conf: encryption key must also be present in decryption keys")
		}
	}

	for id, key := range c.DecryptionKeys {
		decodedKey, err := base64.RawURLEncoding.DecodeString(key)
		if err != nil {
			return err
		}

		if len(decodedKey) != 256/8 {
			return fmt.Errorf("conf: decryption key with ID %q must be 256 bits", id)
		}
	}

	return nil
}

type SecurityConfiguration struct {
	Captcha                               CaptchaConfiguration `json:"captcha"`
	RefreshTokenUpgradePercentage         int                  `json:"refresh_token_upgrade_percentage" split_words:"true"`
	RefreshTokenAlgorithmVersion          int                  `json:"refresh_token_algorithm_version" split_words:"true"`
	RefreshTokenRotationEnabled           bool                 `json:"refresh_token_rotation_enabled" split_words:"true" default:"true"`
	RefreshTokenReuseInterval             int                  `json:"refresh_token_reuse_interval" split_words:"true"`
	RefreshTokenAllowReuse                bool                 `json:"refresh_token_allow_reuse" split_words:"true"`
	UpdatePasswordRequireReauthentication bool                 `json:"update_password_require_reauthentication" split_words:"true"`
	UpdatePasswordRequireCurrentPassword  bool                 `json:"update_password_require_current_password" split_words:"true"`
	ManualLinkingEnabled                  bool                 `json:"manual_linking_enabled" split_words:"true" default:"false"`
	SbForwardedForEnabled                 bool                 `json:"sb_forwarded_for_enabled" split_words:"true" default:"false"`

	DBEncryption DatabaseEncryptionConfiguration `json:"database_encryption" split_words:"true"`
}

func (c *SecurityConfiguration) Validate() error {
	if err := c.Captcha.Validate(); err != nil {
		return err
	}

	if err := c.DBEncryption.Validate(); err != nil {
		return err
	}

	if c.RefreshTokenAlgorithmVersion < 0 || c.RefreshTokenAlgorithmVersion > 2 {
		return fmt.Errorf("refresh token algorithm version must be 0, 1 or 2 but was %v", c.RefreshTokenAlgorithmVersion)
	}

	if c.RefreshTokenUpgradePercentage < 0 || c.RefreshTokenUpgradePercentage > 100 {
		return fmt.Errorf("refresh token upgrade percentage must be between 0 and 100, but was %v", c.RefreshTokenUpgradePercentage)
	}

	return nil
}

// Moving away from the existing HookConfig so we can get a fresh start.
type HookConfiguration struct {
	MFAVerificationAttempt      ExtensibilityPointConfiguration `json:"mfa_verification_attempt" split_words:"true"`
	PasswordVerificationAttempt ExtensibilityPointConfiguration `json:"password_verification_attempt" split_words:"true"`
	CustomAccessToken           ExtensibilityPointConfiguration `json:"custom_access_token" split_words:"true"`
	SendEmail                   ExtensibilityPointConfiguration `json:"send_email" split_words:"true"`
	SendSMS                     ExtensibilityPointConfiguration `json:"send_sms" split_words:"true"`

	BeforeUserCreated ExtensibilityPointConfiguration `json:"before_user_created" split_words:"true"`
	AfterUserCreated  ExtensibilityPointConfiguration `json:"after_user_created" split_words:"true"`
}

type HTTPHookSecrets []string

func (h *HTTPHookSecrets) Decode(value string) error {
	parts := strings.Split(value, "|")
	for _, part := range parts {
		if part != "" {
			*h = append(*h, part)
		}
	}

	return nil
}

type ExtensibilityPointConfiguration struct {
	URI     string `json:"uri"`
	Enabled bool   `json:"enabled"`
	// For internal use together with Postgres Hook. Not publicly exposed.
	HookName string `json:"-"`
	// We use | as a separator for keys and : as a separator for keys within a keypair. For instance: v1,whsec_test|v1a,whpk_myother:v1a,whsk_testkey|v1,whsec_secret3
	HTTPHookSecrets HTTPHookSecrets `json:"secrets" envconfig:"secrets"`
}

func (h *HookConfiguration) Validate() error {
	points := []ExtensibilityPointConfiguration{
		h.MFAVerificationAttempt,
		h.PasswordVerificationAttempt,
		h.CustomAccessToken,
		h.SendSMS,
		h.SendEmail,
		h.BeforeUserCreated,
		h.AfterUserCreated,
	}
	for _, point := range points {
		if err := point.ValidateExtensibilityPoint(); err != nil {
			return err
		}
	}
	return nil
}

func (e *ExtensibilityPointConfiguration) ValidateExtensibilityPoint() error {
	if e.URI == "" {
		return nil
	}
	u, err := url.Parse(e.URI)
	if err != nil {
		return err
	}
	switch strings.ToLower(u.Scheme) {
	case "pg-functions":
		return validatePostgresPath(u)
	case "http":
		hostname := u.Hostname()
		if hostname == "localhost" || hostname == "127.0.0.1" || hostname == "::1" || hostname == "host.docker.internal" {
			return validateHTTPHookSecrets(e.HTTPHookSecrets)
		}
		return fmt.Errorf("only localhost, 127.0.0.1, and ::1 are supported with http")
	case "https":
		return validateHTTPHookSecrets(e.HTTPHookSecrets)
	default:
		return fmt.Errorf("only postgres hooks and HTTPS functions are supported at the moment")
	}
}

func validatePostgresPath(u *url.URL) error {
	pathParts := strings.Split(u.Path, "/")
	if len(pathParts) < 3 {
		return fmt.Errorf("URI path does not contain enough parts")
	}

	schema := pathParts[1]
	table := pathParts[2]
	// Validate schema and table names
	if !postgresNamesRegexp.MatchString(schema) {
		return fmt.Errorf("invalid schema name: %s", schema)
	}
	if !postgresNamesRegexp.MatchString(table) {
		return fmt.Errorf("invalid table name: %s", table)
	}
	return nil
}

func isValidSecretFormat(secret string) bool {
	return symmetricSecretFormat.MatchString(secret) || asymmetricSecretFormat.MatchString(secret)
}

func validateHTTPHookSecrets(secrets []string) error {
	for _, secret := range secrets {
		if !isValidSecretFormat(secret) {
			return fmt.Errorf("invalid secret format")
		}
	}
	return nil
}

func (e *ExtensibilityPointConfiguration) PopulateExtensibilityPoint() error {
	u, err := url.Parse(e.URI)
	if err != nil {
		return err
	}
	if u.Scheme == "pg-functions" {
		pathParts := strings.Split(u.Path, "/")
		e.HookName = fmt.Sprintf("%q.%q", pathParts[1], pathParts[2])
	}
	return nil
}

func (config *GlobalConfiguration) PopulateGlobal() error {
	if config.Hook.PasswordVerificationAttempt.Enabled {
		if err := config.Hook.PasswordVerificationAttempt.PopulateExtensibilityPoint(); err != nil {
			return err
		}
	}

	if config.Hook.SendSMS.Enabled {
		if err := config.Hook.SendSMS.PopulateExtensibilityPoint(); err != nil {
			return err
		}
	}
	if config.Hook.SendEmail.Enabled {
		if err := config.Hook.SendEmail.PopulateExtensibilityPoint(); err != nil {
			return err
		}
	}

	if config.Hook.MFAVerificationAttempt.Enabled {
		if err := config.Hook.MFAVerificationAttempt.PopulateExtensibilityPoint(); err != nil {
			return err
		}
	}

	if config.Hook.CustomAccessToken.Enabled {
		if err := config.Hook.CustomAccessToken.PopulateExtensibilityPoint(); err != nil {
			return err
		}
	}

	if config.Hook.BeforeUserCreated.Enabled {
		if err := config.Hook.BeforeUserCreated.PopulateExtensibilityPoint(); err != nil {
			return err
		}
	}

	if config.Hook.AfterUserCreated.Enabled {
		if err := config.Hook.AfterUserCreated.PopulateExtensibilityPoint(); err != nil {
			return err
		}
	}

	if config.SAML.Enabled {
		if err := config.SAML.PopulateFields(config.API.ExternalURL); err != nil {
			return err
		}
		config.SAML.PrivateKeyNext = ""
	} else {
		config.SAML.PrivateKey = ""
	}

	if config.Sms.Provider != "" {
		SMSTemplate := config.Sms.Template
		if SMSTemplate == "" {
			SMSTemplate = "Your code is {{ .Code }}"
		}
		template, err := template.New("").Parse(SMSTemplate)
		if err != nil {
			return err
		}
		config.Sms.SMSTemplate = template
	}

	if config.MFA.Phone.EnrollEnabled || config.MFA.Phone.VerifyEnabled {
		smsTemplate := config.MFA.Phone.Template
		if smsTemplate == "" {
			smsTemplate = "Your code is {{ .Code }}"
		}
		template, err := template.New("").Parse(smsTemplate)
		if err != nil {
			return err
		}
		config.MFA.Phone.SMSTemplate = template
	}

	return nil
}

// ApplyDefaults sets defaults for a GlobalConfiguration
func (config *GlobalConfiguration) ApplyDefaults() error {
	if config.JWT.AdminGroupName == "" {
		config.JWT.AdminGroupName = "admin"
	}

	if len(config.JWT.AdminRoles) == 0 {
		config.JWT.AdminRoles = []string{"service_role", "supabase_admin"}
	}

	if config.JWT.Exp == 0 {
		config.JWT.Exp = 3600
	}

	if len(config.JWT.Keys) == 0 {
		// transform the secret into a JWK for consistency
		if err := config.applyDefaultsJWT([]byte(config.JWT.Secret)); err != nil {
			return err
		}
	} else {
		jwk, err := GetSigningJwk(&config.JWT)
		if err != nil {
			return err
		}
		sk, err := getSigningKey(jwk)
		if err != nil {
			return err
		}
		config.JWT.SigningKey = sk
	}

	if config.JWT.ValidMethods == nil {
		config.JWT.ValidMethods = []string{}
		for _, key := range config.JWT.Keys {
			config.JWT.ValidMethods = append(config.JWT.ValidMethods, key.PublicKey.Algorithm().String())
		}

	}

	// Backfill the deprecated ProvidersWithOwnLinkingDomain list into the
	// ProviderLinkingDomains map. A provider that owned its linking domain maps
	// to a domain named after itself (own domain == own name). Explicit
	// ProviderLinkingDomains entries win over the legacy backfill.
	if config.Experimental.ProviderLinkingDomains == nil {
		config.Experimental.ProviderLinkingDomains = map[string]string{}
	}
	for _, p := range config.Experimental.ProvidersWithOwnLinkingDomain {
		if _, ok := config.Experimental.ProviderLinkingDomains[p]; !ok {
			config.Experimental.ProviderLinkingDomains[p] = p
		}
	}

	if config.Mailer.Autoconfirm && config.Mailer.AllowUnverifiedEmailSignIns {
		return errors.New("cannot enable both GOTRUE_MAILER_AUTOCONFIRM and GOTRUE_MAILER_ALLOW_UNVERIFIED_EMAIL_SIGN_INS")
	}

	if config.Mailer.URLPaths.Invite == "" {
		config.Mailer.URLPaths.Invite = "/verify"
	}

	if config.Mailer.URLPaths.Confirmation == "" {
		config.Mailer.URLPaths.Confirmation = "/verify"
	}

	if config.Mailer.URLPaths.Recovery == "" {
		config.Mailer.URLPaths.Recovery = "/verify"
	}

	if config.Mailer.URLPaths.EmailChange == "" {
		config.Mailer.URLPaths.EmailChange = "/verify"
	}

	if config.Mailer.OtpExp == 0 {
		config.Mailer.OtpExp = 86400 // 1 day
	}

	if config.Mailer.OtpExp > maxOtpExp {
		config.Mailer.OtpExp = maxOtpExp
	}

	if config.Mailer.OtpLength == 0 || config.Mailer.OtpLength < 6 || config.Mailer.OtpLength > 10 {
		// 6-digit otp by default
		config.Mailer.OtpLength = 6
	}

	if config.SMTP.MaxFrequency == 0 {
		config.SMTP.MaxFrequency = 1 * time.Minute
	}

	if config.Sms.MaxFrequency == 0 {
		config.Sms.MaxFrequency = 1 * time.Minute
	}

	if config.Sms.OtpExp == 0 {
		config.Sms.OtpExp = 60
	}

	if config.Sms.OtpExp > maxOtpExp {
		config.Sms.OtpExp = maxOtpExp
	}

	if config.Sms.OtpLength == 0 || config.Sms.OtpLength < 6 || config.Sms.OtpLength > 10 {
		// 6-digit otp by default
		config.Sms.OtpLength = 6
	}

	if config.Sms.TestOTP != nil {
		formatTestOtps := make(map[string]string)
		for phone, otp := range config.Sms.TestOTP {
			phone = strings.ReplaceAll(strings.TrimPrefix(phone, "+"), " ", "")
			formatTestOtps[phone] = otp
		}
		config.Sms.TestOTP = formatTestOtps
	}

	if len(config.Sms.Template) == 0 {
		config.Sms.Template = ""
	}

	if config.URIAllowList == nil {
		config.URIAllowList = []string{}
	}

	if config.URIAllowList != nil {
		config.URIAllowListMap = make(map[string]glob.Glob)
		for _, uri := range config.URIAllowList {
			g := glob.MustCompile(uri, '.', '/')
			config.URIAllowListMap[uri] = g
		}
	}

	if config.Password.MinLength < defaultMinPasswordLength {
		config.Password.MinLength = defaultMinPasswordLength
	}

	if config.MFA.ChallengeExpiryDuration < defaultChallengeExpiryDuration {
		config.MFA.ChallengeExpiryDuration = defaultChallengeExpiryDuration
	}

	if config.MFA.FactorExpiryDuration < defaultFactorExpiryDuration {
		config.MFA.FactorExpiryDuration = defaultFactorExpiryDuration
	}

	if config.MFA.Phone.MaxFrequency == 0 {
		config.MFA.Phone.MaxFrequency = 1 * time.Minute
	}

	if config.MFA.Phone.OtpLength < 6 || config.MFA.Phone.OtpLength > 10 {
		// 6-digit otp by default
		config.MFA.Phone.OtpLength = 6
	}

	if config.External.FlowStateExpiryDuration < defaultFlowStateExpiryDuration {
		config.External.FlowStateExpiryDuration = defaultFlowStateExpiryDuration
	}

	if len(config.External.AllowedIdTokenIssuers) == 0 {
		config.External.AllowedIdTokenIssuers = append(config.External.AllowedIdTokenIssuers, "https://appleid.apple.com", "https://accounts.google.com")
	}

	return nil
}
func (config *GlobalConfiguration) applyDefaultsJWT(secret []byte) error {
	// transform the secret into a JWK for consistency
	privKey, err := jwk.FromRaw(secret)
	if err != nil {
		return err
	}
	return config.applyDefaultsJWTPrivateKey(privKey)
}

func (config *GlobalConfiguration) applyDefaultsJWTPrivateKey(privKey jwk.Key) error {
	if config.JWT.KeyID != "" {
		if err := privKey.Set(jwk.KeyIDKey, config.JWT.KeyID); err != nil {
			return err
		}
	}
	if privKey.Algorithm().String() == "" {
		if err := privKey.Set(jwk.AlgorithmKey, jwt.SigningMethodHS256.Name); err != nil {
			return err
		}
	}
	if err := privKey.Set(jwk.KeyUsageKey, "sig"); err != nil {
		return err
	}
	if len(privKey.KeyOps()) == 0 {
		if err := privKey.Set(jwk.KeyOpsKey, jwk.KeyOperationList{jwk.KeyOpSign, jwk.KeyOpVerify}); err != nil {
			return err
		}
	}
	pubKey, err := privKey.PublicKey()
	if err != nil {
		return err
	}
	config.JWT.Keys = make(JwtKeysDecoder)
	config.JWT.Keys[config.JWT.KeyID] = JwkInfo{
		PublicKey:  pubKey,
		PrivateKey: privKey,
	}

	var key any
	if err := privKey.Raw(&key); err != nil {
		return err
	}

	config.JWT.SigningKey = func(ctx context.Context) (any, error) {
		return key, nil
	}

	return nil
}

// Validate validates all of configuration.
func (c *GlobalConfiguration) Validate() error {
	validatables := []interface {
		Validate() error
	}{
		&c.API,
		&c.DB,
		&c.Tracing,
		&c.Metrics,
		&c.SMTP,
		&c.Mailer,
		&c.SAML,
		&c.Security,
		&c.Sessions,
		&c.Hook,
		&c.JWT.Keys,
		&c.CustomOAuth,
		&c.MFA.RecoveryCodes,
	}

	for _, validatable := range validatables {
		if err := validatable.Validate(); err != nil {
			return err
		}
	}

	if c.Passkey.Enabled || c.MFA.WebAuthn.EnrollEnabled || c.MFA.WebAuthn.VerifyEnabled {
		if err := c.WebAuthn.Validate(); err != nil {
			logrus.WithError(err).Warn("WebAuthn configuration is invalid")
		}
	}

	return nil
}

func (o *OAuthProviderConfiguration) ValidateOAuth() error {
	if !o.Enabled {
		return errors.New("provider is not enabled")
	}
	if len(o.ClientID) == 0 {
		return errors.New("missing OAuth client ID")
	}
	if o.Secret == "" {
		return errors.New("missing OAuth secret")
	}
	if o.RedirectURI == "" {
		return errors.New("missing redirect URI")
	}
	return nil
}

func (t *TwilioProviderConfiguration) Validate() error {
	if t.AccountSid == "" {
		return errors.New("missing Twilio account SID")
	}
	if t.AuthToken == "" {
		return errors.New("missing Twilio auth token")
	}
	if t.MessageServiceSid == "" {
		return errors.New("missing Twilio message service SID or Twilio phone number")
	}
	return nil
}

func (t *TwilioVerifyProviderConfiguration) Validate() error {
	if t.AccountSid == "" {
		return errors.New("missing Twilio account SID")
	}
	if t.AuthToken == "" {
		return errors.New("missing Twilio auth token")
	}
	if t.MessageServiceSid == "" {
		return errors.New("missing Twilio message service SID or Twilio phone number")
	}
	return nil
}

func (t *MessagebirdProviderConfiguration) Validate() error {
	if t.AccessKey == "" {
		return errors.New("missing Messagebird access key")
	}
	if t.Originator == "" {
		return errors.New("missing Messagebird originator")
	}
	return nil
}

func (t *TextlocalProviderConfiguration) Validate() error {
	if t.ApiKey == "" {
		return errors.New("missing Textlocal API key")
	}
	if t.Sender == "" {
		return errors.New("missing Textlocal sender")
	}
	return nil
}

func (t *VonageProviderConfiguration) Validate() error {
	if t.ApiKey == "" {
		return errors.New("missing Vonage API key")
	}
	if t.ApiSecret == "" {
		return errors.New("missing Vonage API secret")
	}
	if t.From == "" {
		return errors.New("missing Vonage 'from' parameter")
	}
	return nil
}

func (t *SmsProviderConfiguration) IsTwilioVerifyProvider() bool {
	return t.Provider == "twilio_verify"
}

// IndexWorkerConfiguration holds the configuration for creating database indexes on the users table.
type IndexWorkerConfiguration struct {
	// user opt-in — when true, always create indexes (threshold is ignored).
	EnsureUserSearchIndexesExist bool `json:"ensure_user_search_indexes_exist" split_words:"true" default:"false"`
	// progressive rollout — when > 0, create indexes only if user count ≤ threshold.
	// A value of 0 means disabled. Has no effect when EnsureUserSearchIndexesExist is true.
	MaxUsersThreshold int64 `json:"max_users_threshold" split_words:"true" default:"0"`
}
