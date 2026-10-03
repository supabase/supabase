package utilities

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/supabase/auth/internal/api/apierrors"
)

// ValidateOAuthURL validates that a URL is safe for OAuth/OIDC operations
// and protects against SSRF attacks by blocking private IPs and metadata endpoints
func ValidateOAuthURL(urlStr string) error {
	// Parse the URL
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"Invalid URL format",
		).WithInternalError(err)
	}

	// Enforce HTTPS
	if parsedURL.Scheme != "https" {
		return apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"URL must use HTTPS",
		)
	}

	// Extract hostname
	hostname := parsedURL.Hostname()
	if hostname == "" {
		return apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"URL must have a valid hostname",
		)
	}

	// Check for localhost and loopback
	if isLocalhost(hostname) {
		return apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"URL cannot point to localhost or loopback addresses",
		)
	}

	// Resolve hostname to IP addresses
	ips, err := net.LookupIP(hostname)
	if err != nil {
		return apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"Unable to resolve hostname",
		).WithInternalError(err)
	}

	// Check each resolved IP
	for _, ip := range ips {
		if err := validateIP(ip); err != nil {
			return err
		}
	}

	return nil
}

// isLocalhost checks if the hostname is localhost or a loopback address
func isLocalhost(hostname string) bool {
	hostname = strings.ToLower(hostname)

	localhostVariants := []string{
		"localhost",
		"127.0.0.1",
		"::1",
		"0.0.0.0",
		"::",
	}

	for _, variant := range localhostVariants {
		if hostname == variant {
			return true
		}
	}

	// Check for localhost subdomains like "foo.localhost"
	if strings.HasSuffix(hostname, ".localhost") {
		return true
	}

	return false
}

// validateIP checks if an IP address is safe for OAuth/OIDC operations
func validateIP(ip net.IP) error {
	// Block loopback addresses (127.0.0.0/8, ::1)
	if ip.IsLoopback() {
		return apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"URL cannot resolve to loopback addresses",
		)
	}

	// Block private network addresses (RFC 1918)
	// 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
	if ip.IsPrivate() {
		return apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"URL cannot resolve to private network addresses",
		)
	}

	// Block link-local addresses (169.254.0.0/16, fe80::/10)
	if ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() {
		return apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"URL cannot resolve to link-local addresses",
		)
	}

	// Block cloud metadata endpoints (169.254.169.254)
	if ip.String() == "169.254.169.254" {
		return apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"URL cannot resolve to cloud metadata endpoints",
		)
	}

	// Block multicast addresses
	if ip.IsMulticast() {
		return apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"URL cannot resolve to multicast addresses",
		)
	}

	// Block unspecified addresses (0.0.0.0, ::)
	if ip.IsUnspecified() {
		return apierrors.NewBadRequestError(
			apierrors.ErrorCodeValidationFailed,
			"URL cannot resolve to unspecified addresses",
		)
	}

	return nil
}

// FetchURLWithTimeout fetches a URL with timeout and SSRF protection
// This is used for fetching OIDC discovery documents and JWKS
func FetchURLWithTimeout(ctx context.Context, urlStr string, timeout time.Duration) (*http.Response, error) {
	// Validate URL first
	if err := ValidateOAuthURL(urlStr); err != nil {
		return nil, err
	}

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: timeout,
		// Use a custom transport that re-validates the IP after DNS resolution
		Transport: &ssrfProtectedTransport{
			base: http.DefaultTransport,
		},
	}

	// Create request with context
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		return nil, apierrors.NewInternalServerError(
			"Failed to create HTTP request",
		).WithInternalError(err)
	}

	// Set user agent
	req.Header.Set("User-Agent", "Supabase-Auth/1.0")
	req.Header.Set("Accept", "application/json")

	// Execute request
	resp, err := client.Do(req)
	if err != nil {
		return nil, apierrors.NewInternalServerError(
			"Failed to fetch URL",
		).WithInternalError(err)
	}

	return resp, nil
}

// ssrfProtectedTransport wraps http.RoundTripper with additional SSRF checks
// TODO(cemal) :: should we keep it?
type ssrfProtectedTransport struct {
	base http.RoundTripper
}

func (t *ssrfProtectedTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	// Re-validate URL before making the request
	// This protects against DNS rebinding attacks
	if err := ValidateOAuthURL(req.URL.String()); err != nil {
		return nil, fmt.Errorf("SSRF protection: %w", err)
	}

	return t.base.RoundTrip(req)
}
