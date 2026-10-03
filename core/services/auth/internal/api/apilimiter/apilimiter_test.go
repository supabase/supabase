package apilimiter

import (
	"maps"
	"slices"
	"testing"

	"github.com/didip/tollbooth/v5/limiter"
	"github.com/sirupsen/logrus"
	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/e2e"
	"github.com/supabase/auth/internal/ratelimit"
)

func TestLimiter(t *testing.T) {

	// Expect equal configs to produce equal limiter
	{
		gc1 := e2e.Must(e2e.Config())
		l1 := New(gc1)

		gc2 := e2e.Must(e2e.Config())
		l2 := New(gc2)

		fs := getUpdatedFields(l1, l2)
		for _, field := range fs {
			t.Errorf("field %v was updated unexpectedly", field)
		}
		if exp, got := 0, len(fs); exp != got {
			t.Fatalf("expected %v field updates, got %v", exp, got)
		}
	}

	// Expect equal configs to produce equal updates
	{
		gc1 := e2e.Must(e2e.Config())
		l1 := New(gc1)

		gc2 := e2e.Must(e2e.Config())
		l2 := l1.Update(logrus.NewEntry(logrus.New()), gc2)

		fs := getUpdatedFields(l1, l2)
		for _, field := range fs {
			t.Errorf("field %v was updated unexpectedly", field)
		}
		if exp, got := 0, len(fs); exp != got {
			t.Fatalf("expected %v field updates, got %v", exp, got)
		}
	}

	// Exhaustively check all ratelimiter fields
	for _, field := range slices.Sorted(maps.Keys(ratelimitFieldsToEnv)) {
		env, ok := ratelimitFieldsToEnv[field]
		if !ok {
			panic("missing field from mappings")
		}
		t.Logf("test updates for field %v (ENV: %v)", field, env)

		gc1 := e2e.Must(e2e.Config())
		l1 := New(gc1)

		gc2 := e2e.Must(e2e.Config())
		fieldCfg := ratelimitCfgByField(gc2, field)
		*fieldCfg = helpStrToRate(t, "123456/231h")

		l2 := l1.Update(logrus.NewEntry(logrus.New()), gc2)
		fs := getUpdatedFields(l1, l2)

		// determine the number of fields that config value will change
		fields := envsToFields[env]
		if exp, got := len(fields), len(fs); exp != got {
			t.Fatalf("expected %v field updates, got %v (%q)", exp, got, fs)
		}

		for _, exp := range fields {
			if !slices.Contains(fs, field) {
				t.Fatalf("expected field %v to appear in (%q)", exp, fs)
			}
		}
	}

	// Exhaustively check all tollbooth fields
	for _, field := range slices.Sorted(maps.Keys(tollboothFieldsToEnv)) {
		env, ok := tollboothFieldsToEnv[field]
		if !ok {
			panic("missing field from mappings")
		}
		t.Logf("test updates for field %v (ENV: %v)", field, env)

		gc1 := e2e.Must(e2e.Config())
		l1 := New(gc1)

		gc2 := e2e.Must(e2e.Config())
		fieldCfg := tollboothCfgByField(gc2, field)
		*fieldCfg = *fieldCfg * 2

		l2 := l1.Update(logrus.NewEntry(logrus.New()), gc2)
		fs := getUpdatedFields(l1, l2)

		// determine the number of fields that config value will change
		fields := envsToFields[env]
		if exp, got := len(fields), len(fs); exp != got {
			t.Fatalf("expected %v field updates, got %v (%q)", exp, got, fs)
		}

		for _, exp := range fields {
			if !slices.Contains(fs, field) {
				t.Fatalf("expected field %v to appear in (%q)", exp, fs)
			}
		}
	}
}

func getUpdatedFields(l1, l2 *Limiter) []string {
	var s []string
	for field := range ratelimitFieldsToEnv {
		v1 := ratelimitByField(l1, field)
		v2 := ratelimitByField(l2, field)
		if !ratelimit.Equal(v1, v2) {
			s = append(s, field)
		}
	}

	for field := range tollboothFieldsToEnv {
		v1 := tollboothByField(l1, field)
		v2 := tollboothByField(l2, field)
		if !tollboothEqual(v1, v2) {
			s = append(s, field)
		}
	}
	return s
}

func ratelimitByField(o *Limiter, field string) ratelimit.Limiter {
	switch field {
	case fieldEmail:
		return o.Email
	case fieldPhone:
		return o.Phone
	default:
		panic("unknown field")
	}
}

func ratelimitCfgByField(gc *conf.GlobalConfiguration, field string) *conf.Rate {
	switch field {
	case fieldEmail:
		return &gc.RateLimitEmailSent
	case fieldPhone:
		return &gc.RateLimitSmsSent
	default:
		panic("unknown field")
	}
}

func tollboothByField(o *Limiter, field string) *limiter.Limiter {
	switch field {
	case fieldAnonymousSignIns:
		return o.AnonymousSignIns
	case fieldFactorChallenge:
		return o.FactorChallenge
	case fieldFactorVerify:
		return o.FactorVerify
	case fieldMagicLink:
		return o.MagicLink
	case fieldOtp:
		return o.Otp
	case fieldRecover:
		return o.Recover
	case fieldResend:
		return o.Resend
	case fieldSignups:
		return o.Signups
	case fieldUser:
		return o.User
	case fieldOAuthClientRegister:
		return o.OAuthClientRegister
	case fieldPasskeyAuthentication:
		return o.PasskeyAuthentication
	case fieldSAMLAssertion:
		return o.SAMLAssertion
	case fieldSSO:
		return o.SSO
	case fieldToken:
		return o.Token
	case fieldVerify:
		return o.Verify
	case fieldWeb3:
		return o.Web3
	default:
		panic("unknown field")
	}
}

func tollboothCfgByField(gc *conf.GlobalConfiguration, field string) *float64 {
	switch field {
	case fieldAnonymousSignIns:
		return &gc.RateLimitAnonymousUsers
	case fieldFactorChallenge:
		return &gc.MFA.RateLimitChallengeAndVerify
	case fieldFactorVerify:
		return &gc.MFA.RateLimitChallengeAndVerify
	case fieldMagicLink:
		return &gc.RateLimitOtp
	case fieldOtp:
		return &gc.RateLimitOtp
	case fieldRecover:
		return &gc.RateLimitOtp
	case fieldResend:
		return &gc.RateLimitOtp
	case fieldSignups:
		return &gc.RateLimitOtp
	case fieldUser:
		return &gc.RateLimitOtp
	case fieldOAuthClientRegister:
		return &gc.RateLimitOAuthDynamicClientRegister
	case fieldPasskeyAuthentication:
		return &gc.RateLimitPasskey
	case fieldSAMLAssertion:
		return &gc.SAML.RateLimitAssertion
	case fieldSSO:
		return &gc.RateLimitSso
	case fieldToken:
		return &gc.RateLimitTokenRefresh
	case fieldVerify:
		return &gc.RateLimitVerify
	case fieldWeb3:
		return &gc.RateLimitWeb3
	default:
		panic("unknown field")
	}
}

func tollboothEqual(a, b *limiter.Limiter) bool {
	// Tollbooth provides no way to get that initial expiration time passed. The
	// calls to all the Get* methods that return durations are somehow always
	// zero. So this had to be manually verified for now. In the future we
	// should just get rid of that library, looking into it we could get very
	// similar rate limit behavior through the ratelimit package. In the short
	// term we could consider at least wrapping the tollbooth limiter so it
	// matches the ratelimit.Limiter interface and can carry the cfg values.
	switch {
	case a.GetBurst() != b.GetBurst():
		return false
	case a.GetMax() != b.GetMax():
		return false
	case a.GetBasicAuthExpirationTTL() != b.GetBasicAuthExpirationTTL():
		return false
	case a.GetContextValueEntryExpirationTTL() != b.GetContextValueEntryExpirationTTL():
		return false
	case a.GetHeaderEntryExpirationTTL() != b.GetHeaderEntryExpirationTTL():
		return false
	case a.GetTokenBucketExpirationTTL() != b.GetTokenBucketExpirationTTL():
		return false
	case !slices.Equal(a.GetMethods(), b.GetMethods()):
		return false
	default:
		return true
	}
}

func helpStrToRate(t *testing.T, rateStr string) conf.Rate {
	var r conf.Rate
	err := r.Decode(rateStr)
	if err != nil {
		t.Fatalf("exp nil err; got %v", err)
	}
	return r
}
