package apilimiter

import (
	"maps"
	"slices"
	"time"

	"github.com/didip/tollbooth/v5"
	"github.com/didip/tollbooth/v5/limiter"
	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/ratelimit"
)

const (
	// GOTRUE_RATE_LIMIT_EMAIL_SENT
	//   -> RateLimitEmailSent
	envRateLimitEmailSent = "GOTRUE_RATE_LIMIT_EMAIL_SENT"
	fieldEmail            = "Email"

	// GOTRUE_RATE_LIMIT_SMS_SENT
	//   -> RateLimitSmsSent
	envRateLimitSmsSent = "GOTRUE_RATE_LIMIT_SMS_SENT"
	fieldPhone          = "Phone"

	// GOTRUE_RATE_LIMIT_ANONYMOUS_USERS
	//  -> RateLimitAnonymousUsers
	envRateLimitAnonymousUsers = "GOTRUE_RATE_LIMIT_ANONYMOUS_USERS"
	fieldAnonymousSignIns      = "AnonymousSignIns"

	// GOTRUE_MFA_RATE_LIMIT_CHALLENGE_AND_VERIFY
	//   -> MFA.RateLimitChallengeAndVerify
	envMFARateLimitChallengeAndVerify = "GOTRUE_MFA_RATE_LIMIT_CHALLENGE_AND_VERIFY"
	fieldFactorChallenge              = "FactorChallenge"
	fieldFactorVerify                 = "FactorVerify"

	// GOTRUE_RATE_LIMIT_OTP
	//   -> RateLimitOtp
	envRateLimitOtp = "GOTRUE_RATE_LIMIT_OTP"
	fieldMagicLink  = "MagicLink"
	fieldOtp        = "Otp"
	fieldRecover    = "Recover"
	fieldResend     = "Resend"
	fieldSignups    = "Signups"
	fieldUser       = "User"

	// GOTRUE_RATE_LIMIT_OAUTH_DYNAMIC_CLIENT_REGISTER
	//   -> RateLimitOAuthDynamicClientRegister
	envRateLimitOAuthDynamicClientRegister = "GOTRUE_RATE_LIMIT_OAUTH_DYNAMIC_CLIENT_REGISTER"
	fieldOAuthClientRegister               = "OAuthClientRegister"

	// GOTRUE_RATE_LIMIT_PASSKEY
	//   -> RateLimitPasskey
	envRateLimitPasskey        = "GOTRUE_RATE_LIMIT_PASSKEY" // #nosec G101
	fieldPasskeyAuthentication = "PasskeyAuthentication"

	// GOTRUE_SAML_RATE_LIMIT_ASSERTION
	//   -> SAML.RateLimitAssertion
	envSAMLRateLimitAssertion = "GOTRUE_SAML_RATE_LIMIT_ASSERTION"
	fieldSAMLAssertion        = "SAMLAssertion"

	// GOTRUE_RATE_LIMIT_SSO
	//   -> RateLimitSso
	envRateLimitSso = "GOTRUE_RATE_LIMIT_SSO"
	fieldSSO        = "SSO"

	// GOTRUE_RATE_LIMIT_TOKEN_REFRESH
	//   -> RateLimitTokenRefresh
	envRateLimitTokenRefresh = "GOTRUE_RATE_LIMIT_TOKEN_REFRESH" // #nosec G101
	fieldToken               = "Token"

	// GOTRUE_RATE_LIMIT_VERIFY
	//   -> RateLimitVerify
	envRateLimitVerify = "GOTRUE_RATE_LIMIT_VERIFY"
	fieldVerify        = "Verify"

	// GOTRUE_RATE_LIMIT_WEB3
	//   -> RateLimitWeb3
	envRateLimitWeb3 = "GOTRUE_RATE_LIMIT_WEB3"
	fieldWeb3        = "Web3"
)

var ratelimitFieldsToEnv = map[string]string{
	fieldEmail: envRateLimitEmailSent,
	fieldPhone: envRateLimitSmsSent,
}

var tollboothFieldsToEnv = map[string]string{
	fieldAnonymousSignIns:      envRateLimitAnonymousUsers,
	fieldFactorChallenge:       envMFARateLimitChallengeAndVerify,
	fieldFactorVerify:          envMFARateLimitChallengeAndVerify,
	fieldMagicLink:             envRateLimitOtp,
	fieldOtp:                   envRateLimitOtp,
	fieldRecover:               envRateLimitOtp,
	fieldResend:                envRateLimitOtp,
	fieldSignups:               envRateLimitOtp,
	fieldUser:                  envRateLimitOtp,
	fieldOAuthClientRegister:   envRateLimitOAuthDynamicClientRegister,
	fieldPasskeyAuthentication: envRateLimitPasskey,
	fieldSAMLAssertion:         envSAMLRateLimitAssertion,
	fieldSSO:                   envRateLimitSso,
	fieldToken:                 envRateLimitTokenRefresh,
	fieldVerify:                envRateLimitVerify,
	fieldWeb3:                  envRateLimitWeb3,
}

var fieldsToEnv = func() map[string]string {
	n := len(ratelimitFieldsToEnv) + len(tollboothFieldsToEnv)
	out := make(map[string]string, n)
	maps.Insert(out, maps.All(ratelimitFieldsToEnv))
	maps.Insert(out, maps.All(tollboothFieldsToEnv))
	return out
}()

var envsToFields = func() map[string][]string {
	out := make(map[string][]string)
	for field, env := range fieldsToEnv {
		out[env] = append(out[env], field)
	}
	for _, fields := range out {
		slices.Sort(fields)
	}
	return out
}()

type Limiter struct {
	cfg *conf.GlobalConfiguration

	// GOTRUE_RATE_LIMIT_EMAIL_SENT
	//   -> RateLimitEmailSent
	Email ratelimit.Limiter

	// GOTRUE_RATE_LIMIT_SMS_SENT
	//   -> RateLimitSmsSent
	Phone ratelimit.Limiter

	// GOTRUE_RATE_LIMIT_ANONYMOUS_USERS
	//  -> RateLimitAnonymousUsers
	AnonymousSignIns *limiter.Limiter

	// GOTRUE_MFA_RATE_LIMIT_CHALLENGE_AND_VERIFY
	//   -> MFA.RateLimitChallengeAndVerify
	FactorChallenge *limiter.Limiter
	FactorVerify    *limiter.Limiter

	// GOTRUE_RATE_LIMIT_OTP
	//   -> RateLimitOtp
	MagicLink *limiter.Limiter
	Otp       *limiter.Limiter
	Recover   *limiter.Limiter
	Resend    *limiter.Limiter
	Signups   *limiter.Limiter
	User      *limiter.Limiter

	// GOTRUE_RATE_LIMIT_OAUTH_DYNAMIC_CLIENT_REGISTER
	//   -> RateLimitOAuthDynamicClientRegister
	OAuthClientRegister *limiter.Limiter

	// GOTRUE_RATE_LIMIT_PASSKEY
	//   -> RateLimitPasskey
	PasskeyAuthentication *limiter.Limiter

	// GOTRUE_SAML_RATE_LIMIT_ASSERTION
	//   -> SAML.RateLimitAssertion
	SAMLAssertion *limiter.Limiter

	// GOTRUE_RATE_LIMIT_SSO
	//   -> RateLimitSso
	SSO *limiter.Limiter

	// GOTRUE_RATE_LIMIT_TOKEN_REFRESH
	//   -> RateLimitTokenRefresh
	Token *limiter.Limiter

	// GOTRUE_RATE_LIMIT_VERIFY
	//   -> RateLimitVerify
	Verify *limiter.Limiter

	// GOTRUE_RATE_LIMIT_WEB3
	//   -> RateLimitWeb3
	Web3 *limiter.Limiter
}

func New(gc *conf.GlobalConfiguration) *Limiter {
	o := &Limiter{
		cfg: gc,
	}

	o.Email = ratelimit.New(gc.RateLimitEmailSent)
	o.Phone = ratelimit.New(gc.RateLimitSmsSent)

	o.AnonymousSignIns = tollbooth.NewLimiter(gc.RateLimitAnonymousUsers/(60*60),
		&limiter.ExpirableOptions{
			DefaultExpirationTTL: time.Hour,
		}).SetBurst(int(gc.RateLimitAnonymousUsers)).SetMethods([]string{"POST"})

	o.Token = tollbooth.NewLimiter(gc.RateLimitTokenRefresh/(60*5),
		&limiter.ExpirableOptions{
			DefaultExpirationTTL: time.Hour,
		}).SetBurst(30)

	o.Verify = tollbooth.NewLimiter(gc.RateLimitVerify/(60*5),
		&limiter.ExpirableOptions{
			DefaultExpirationTTL: time.Hour,
		}).SetBurst(30)

	o.FactorVerify = tollbooth.NewLimiter(gc.MFA.RateLimitChallengeAndVerify/60,
		&limiter.ExpirableOptions{
			DefaultExpirationTTL: time.Minute,
		}).SetBurst(30)

	o.FactorChallenge = tollbooth.NewLimiter(gc.MFA.RateLimitChallengeAndVerify/60,
		&limiter.ExpirableOptions{
			DefaultExpirationTTL: time.Minute,
		}).SetBurst(30)

	o.SSO = tollbooth.NewLimiter(gc.RateLimitSso/(60*5),
		&limiter.ExpirableOptions{
			DefaultExpirationTTL: time.Hour,
		}).SetBurst(30)

	o.SAMLAssertion = tollbooth.NewLimiter(gc.SAML.RateLimitAssertion/(60*5),
		&limiter.ExpirableOptions{
			DefaultExpirationTTL: time.Hour,
		}).SetBurst(30)

	o.Web3 = tollbooth.NewLimiter(gc.RateLimitWeb3/(60*5),
		&limiter.ExpirableOptions{
			DefaultExpirationTTL: time.Hour,
		}).SetBurst(30)

	// These all use the OTP limit per 5 min with 1hour ttl and burst of 30.
	o.Recover = newLimiterPer5mOver1h(gc.RateLimitOtp)
	o.Resend = newLimiterPer5mOver1h(gc.RateLimitOtp)
	o.MagicLink = newLimiterPer5mOver1h(gc.RateLimitOtp)
	o.Otp = newLimiterPer5mOver1h(gc.RateLimitOtp)
	o.User = newLimiterPer5mOver1h(gc.RateLimitOtp)
	o.Signups = newLimiterPer5mOver1h(gc.RateLimitOtp)
	o.OAuthClientRegister = newLimiterPer5mOver1h(gc.RateLimitOAuthDynamicClientRegister)
	o.PasskeyAuthentication = newLimiterPer5mOver1h(gc.RateLimitPasskey)
	return o
}

func (o *Limiter) Copy() *Limiter {
	return &Limiter{
		cfg: o.cfg,

		Email: o.Email,
		Phone: o.Phone,

		AnonymousSignIns:      o.AnonymousSignIns,
		FactorChallenge:       o.FactorChallenge,
		FactorVerify:          o.FactorVerify,
		MagicLink:             o.MagicLink,
		OAuthClientRegister:   o.OAuthClientRegister,
		Otp:                   o.Otp,
		PasskeyAuthentication: o.PasskeyAuthentication,
		Recover:               o.Recover,
		Resend:                o.Resend,
		SAMLAssertion:         o.SAMLAssertion,
		Signups:               o.Signups,
		SSO:                   o.SSO,
		Token:                 o.Token,
		User:                  o.User,
		Verify:                o.Verify,
		Web3:                  o.Web3,
	}
}

func (o *Limiter) Update(
	le *logrus.Entry,
	nextCfg *conf.GlobalConfiguration,
) *Limiter {
	prevCfg := o.cfg

	v := o.Copy()
	v.cfg = nextCfg

	if !ratelimit.Equal(v.Email, nextCfg.RateLimitEmailSent) {
		v.Email = ratelimit.New(nextCfg.RateLimitEmailSent)
		logEnvUpdates(le, envRateLimitEmailSent,
			o.Email.Config().GetRateValue(),
			v.Email.Config().GetRateValue())
	}

	if !ratelimit.Equal(v.Phone, nextCfg.RateLimitSmsSent) {
		v.Phone = ratelimit.New(nextCfg.RateLimitSmsSent)
		logEnvUpdates(le, envRateLimitSmsSent,
			o.Phone.Config().GetRateValue(),
			v.Phone.Config().GetRateValue())
	}

	if a, b := prevCfg.RateLimitAnonymousUsers, nextCfg.RateLimitAnonymousUsers; a != b {
		v.AnonymousSignIns = newTollbooth(
			b/(60*60), int(b), time.Hour).SetMethods([]string{"POST"})
		logEnvUpdates(le, envRateLimitAnonymousUsers, a, b)
	}

	if a, b := prevCfg.MFA.RateLimitChallengeAndVerify, nextCfg.MFA.RateLimitChallengeAndVerify; a != b {
		v.FactorChallenge = newTollbooth(b/60, 30, time.Minute)
		v.FactorVerify = newTollbooth(b/60, 30, time.Minute)
		logEnvUpdates(le, envMFARateLimitChallengeAndVerify, a, b)
	}

	if a, b := prevCfg.RateLimitOtp, nextCfg.RateLimitOtp; a != b {
		v.MagicLink = newLimiterPer5mOver1h(b)
		v.Otp = newLimiterPer5mOver1h(b)
		v.Recover = newLimiterPer5mOver1h(b)
		v.Resend = newLimiterPer5mOver1h(b)
		v.Signups = newLimiterPer5mOver1h(b)
		v.User = newLimiterPer5mOver1h(b)
		logEnvUpdates(le, envRateLimitOtp, a, b)
	}

	if a, b := prevCfg.RateLimitOAuthDynamicClientRegister, nextCfg.RateLimitOAuthDynamicClientRegister; a != b {
		v.OAuthClientRegister = newLimiterPer5mOver1h(b)
		logEnvUpdates(le, envRateLimitOAuthDynamicClientRegister, a, b)
	}

	if a, b := prevCfg.RateLimitPasskey, nextCfg.RateLimitPasskey; a != b {
		v.PasskeyAuthentication = newLimiterPer5mOver1h(b)
		logEnvUpdates(le, envRateLimitPasskey, a, b)
	}

	if a, b := prevCfg.SAML.RateLimitAssertion, nextCfg.SAML.RateLimitAssertion; a != b {
		v.SAMLAssertion = newLimiterPer5mOver1h(b)
		logEnvUpdates(le, envSAMLRateLimitAssertion, a, b)
	}

	if a, b := prevCfg.RateLimitSso, nextCfg.RateLimitSso; a != b {
		v.SSO = newLimiterPer5mOver1h(b)
		logEnvUpdates(le, envRateLimitSso, a, b)
	}

	if a, b := prevCfg.RateLimitTokenRefresh, nextCfg.RateLimitTokenRefresh; a != b {
		v.Token = newLimiterPer5mOver1h(b)
		logEnvUpdates(le, envRateLimitTokenRefresh, a, b)
	}

	if a, b := prevCfg.RateLimitVerify, nextCfg.RateLimitVerify; a != b {
		v.Verify = newLimiterPer5mOver1h(b)
		logEnvUpdates(le, envRateLimitVerify, a, b)
	}

	if a, b := prevCfg.RateLimitWeb3, nextCfg.RateLimitWeb3; a != b {
		v.Web3 = newLimiterPer5mOver1h(b)
		logEnvUpdates(le, envRateLimitWeb3, a, b)
	}
	return v
}

func newTollbooth(freq float64, burst int, ttl time.Duration) *limiter.Limiter {
	return tollbooth.NewLimiter(freq, &limiter.ExpirableOptions{
		DefaultExpirationTTL: ttl,
	}).SetBurst(burst)
}

func newLimiterPer5mOver1h(rate float64) *limiter.Limiter {
	freq := rate / (60 * 5)
	lim := tollbooth.NewLimiter(freq, &limiter.ExpirableOptions{
		DefaultExpirationTTL: time.Hour,
	}).SetBurst(30)
	return lim
}

func logEnvUpdates(
	le *logrus.Entry,
	env string,
	prevVal, nextVal any,
) {
	for _, field := range envsToFields[env] {
		logUpdate(le, field, prevVal, nextVal)
	}
}

func logUpdate(
	le *logrus.Entry,
	field string,
	prevVal, nextVal any,
) {
	envName := fieldsToEnv[field]
	lf := logrus.Fields{
		"rate_limit_field": field,
		"rate_limit_env":   envName,
		"rate_limit_old":   prevVal,
		"rate_limit_new":   nextVal,
	}
	le.WithFields(lf).Infof(
		"env %v changed, updating %v limiter from %v to %v",
		envName, field, prevVal, nextVal)
}
