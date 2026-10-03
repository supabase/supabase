package utilities

import (
	"bytes"
	"io"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"strings"

	"github.com/supabase/auth/internal/conf"
	"github.com/supabase/auth/internal/sbff"
)

func getIPAddressWithXFF(r *http.Request) string {
	if r.Header != nil {
		xForwardedFor := r.Header.Get("X-Forwarded-For")
		if xForwardedFor != "" {
			ips := strings.Split(xForwardedFor, ",")
			for i := range ips {
				ips[i] = strings.TrimSpace(ips[i])
			}

			for _, ip := range ips {
				if ip != "" {
					parsed := net.ParseIP(ip)
					if parsed == nil {
						continue
					}

					return parsed.String()
				}
			}
		}
	}

	ipPort := r.RemoteAddr
	ip, _, err := net.SplitHostPort(ipPort)
	if err != nil {
		return ipPort
	}

	return ip
}

// GetIPAddress returns the real IP address of the HTTP request.
func GetIPAddress(r *http.Request) string {
	if sbffAddr, ok := sbff.GetIPAddress(r); ok {
		return sbffAddr
	}

	return getIPAddressWithXFF(r)
}

// GetBodyBytes reads the whole request body properly into a byte array.
func GetBodyBytes(req *http.Request) ([]byte, error) {
	if req.Body == nil || req.Body == http.NoBody {
		return nil, nil
	}

	originalBody := req.Body
	defer SafeClose(originalBody)

	buf, err := io.ReadAll(originalBody)
	if err != nil {
		return nil, err
	}

	req.Body = io.NopCloser(bytes.NewReader(buf))

	return buf, nil
}

func GetReferrer(r *http.Request, config *conf.GlobalConfiguration) string {
	// try get redirect url from query or post data first
	reqref := getRedirectTo(r)
	if IsRedirectURLValid(config, reqref) {
		return reqref
	}

	// instead try referrer header value
	reqref = r.Referer()
	if IsRedirectURLValid(config, reqref) {
		return reqref
	}

	return config.SiteURL
}

var decimalIPAddressPattern = regexp.MustCompile("^[0-9]+$")
var regularHostname = regexp.MustCompile("^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$")

func IsRedirectURLValid(config *conf.GlobalConfiguration, redirectURL string) bool {
	if redirectURL == "" {
		return false
	}

	base, berr := url.Parse(config.SiteURL)
	refurl, rerr := url.Parse(redirectURL)
	if berr != nil || rerr != nil {
		// either URL is for some reason invalid
		return false
	}

	// Allow redirects back to the site: scheme, host and port must match. The port
	// check is skipped for loopback addresses, since per RFC 8252 Section 7.3 native
	// apps must be allowed to use variable port numbers.
	if base.Hostname() == refurl.Hostname() &&
		base.Scheme == refurl.Scheme &&
		(base.Port() == refurl.Port() || isLocalhost(refurl.Hostname())) {
		return true
	}

	scheme := strings.TrimSuffix(strings.ToLower(refurl.Scheme), ":")
	isHTTP := scheme == "http" || scheme == "https"

	if decimalIPAddressPattern.MatchString(refurl.Hostname()) {
		// IP address in decimal form also not allowed in redirects!
		return false
	} else if ip := net.ParseIP(refurl.Hostname()); ip != nil {
		return ip.IsLoopback()
	} else if isHTTP && !regularHostname.MatchString(refurl.Hostname()) {
		// hostname uses characters that are not typically used
		return false
	}

	// For case when user came from mobile app or other permitted resource - redirect back
	for _, pattern := range config.URIAllowListMap {
		// only match without the fragment
		matchAgainst, _, _ := strings.Cut(redirectURL, "#")

		if pattern.Match(matchAgainst) {
			return true
		}
	}

	return false
}

// getRedirectTo tries extract redirect url from header or from query params
func getRedirectTo(r *http.Request) (reqref string) {
	reqref = r.Header.Get("redirect_to")
	if reqref != "" {
		return
	}

	if err := r.ParseForm(); err == nil {
		reqref = r.Form.Get("redirect_to")
	}

	return
}
