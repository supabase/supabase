package sbff

import (
	"errors"
	"net"
	"net/http"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/ctxkey"
)

// HeaderName is the Sb-Forwarded-For header name. It is all lowercase here as HTTP header names
// are not case-sensitive.
const HeaderName = "sb-forwarded-for"

var (
	ctxKeySBFF = ctxkey.New[string]("sbff_ip_address")

	ErrHeaderNotFound = errors.New("Sb-Forwarded-For header not found")
	ErrHeaderInvalid  = errors.New("invalid Sb-Forwarded-For header value")
)

func parseSBFFHeader(headerVal string) (string, error) {
	values := strings.SplitN(headerVal, ",", 2)
	key := strings.TrimSpace(values[0])
	if ipAddr := net.ParseIP(key); ipAddr != nil {
		return ipAddr.String(), nil
	}

	return "", ErrHeaderInvalid
}

// GetIPAddress returns the value of the IP address in Sb-Forwarded-For as defined by
// SBForwardedForMiddleware. If no value is present in the request context, this function will
// return ("", false).
func GetIPAddress(r *http.Request) (addr string, found bool) {
	if ipAddr := ctxKeySBFF.Value(r.Context()); ipAddr != "" {
		return ipAddr, true
	}

	return "", false
}

// withIPAddress parses the Sb-Forwarded-For header and adds the leftmost value to the
// request context if it is a valid IP address, then returns a new request with modified context.
// If the leftmost value is not a valid IP address or the header is not set, this function returns
// an error.
func withIPAddress(r *http.Request) (*http.Request, error) {
	headerVal := r.Header.Get(HeaderName)
	if headerVal == "" {
		return nil, ErrHeaderNotFound
	}

	parsedIPAddr, err := parseSBFFHeader(headerVal)
	if err != nil {
		return nil, err
	}

	newCtx := ctxKeySBFF.WithValue(r.Context(), parsedIPAddr)
	out := r.WithContext(newCtx)

	return out, nil
}

// Middleware returns a middleware function that parses the Sb-Forwarded-For header
// and adds the leftmost header value to the request context if GOTRUE_SECURITY_SB_FORWARDED_FOR_ENABLED
// is true and the value is a valid IP address.
func Middleware(cfg *conf.SecurityConfiguration, errCallback func(*http.Request, error)) func(http.Handler) http.Handler {
	out := func(next http.Handler) http.Handler {
		handlerFunc := func(rw http.ResponseWriter, r *http.Request) {
			if !cfg.SbForwardedForEnabled {
				next.ServeHTTP(rw, r)
				return
			}

			reqWithSBFF, err := withIPAddress(r)
			switch {
			case err == nil:
				next.ServeHTTP(rw, reqWithSBFF)
			case errors.Is(err, ErrHeaderNotFound):
				next.ServeHTTP(rw, r)
			default:
				errCallback(r, err)
				next.ServeHTTP(rw, r)
			}
		}

		return http.HandlerFunc(handlerFunc)
	}

	return out
}
