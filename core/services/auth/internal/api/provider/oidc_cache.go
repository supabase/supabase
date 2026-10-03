package provider

import (
	"context"
	"sync"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/supabase/auth/internal/utilities"
	"golang.org/x/sync/singleflight"
)

// oidcSupportedAlgorithms mirrors the set that go-oidc's discovery path filters
// against internally. We duplicate it here because the manual ProviderConfig
// path doesn't go through that filter — without it, a misconfigured upstream
// could push a verifier into accepting algorithms go-oidc doesn't actually
// support. Keep in sync with go-oidc's supportedAlgorithms.
var oidcSupportedAlgorithms = map[string]bool{
	"RS256": true, "RS384": true, "RS512": true,
	"ES256": true, "ES384": true, "ES512": true,
	"PS256": true, "PS384": true, "PS512": true,
	"EdDSA": true,
}

type oidcCacheEntry struct {
	provider  *oidc.Provider
	fetchedAt time.Time
}

// OIDCProviderCache caches *oidc.Provider objects keyed by issuer URL.
// This avoids re-fetching the OIDC discovery document on every request.
// JWKS fetching/caching is handled separately by the oidc library itself,
// it lazy-loads the key set on the first call to Verify and manages its own cache.
// It uses singleflight to deduplicate concurrent fetches for the same issuer.
type OIDCProviderCache struct {
	mu    sync.RWMutex
	cache map[string]*oidcCacheEntry
	sf    singleflight.Group
	ttl   time.Duration
	now   func() time.Time // injectable for tests
}

// NewOIDCProviderCache creates a new cache with the given TTL.
func NewOIDCProviderCache(ttl time.Duration) *OIDCProviderCache {
	return &OIDCProviderCache{
		cache: make(map[string]*oidcCacheEntry),
		ttl:   ttl,
		now:   time.Now,
	}
}

// getEntry returns the cached entry for issuer, if any. It holds the read lock
// only for the map access and releases it via defer, so a panic in a future
// caller can't leave the mutex held and deadlock the auth server.
func (c *OIDCProviderCache) getEntry(issuer string) (*oidcCacheEntry, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, ok := c.cache[issuer]
	return entry, ok
}

// putEntry stores provider for issuer, stamped with the current time. The write
// lock is released via defer for the same panic-safety reason as getEntry.
func (c *OIDCProviderCache) putEntry(issuer string, provider *oidc.Provider) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.cache[issuer] = &oidcCacheEntry{
		provider:  provider,
		fetchedAt: c.now(),
	}
}

// GetProvider returns a cached *oidc.Provider for the given issuer, fetching
// it via oidc.NewProvider if not cached or expired. Concurrent requests for
// the same issuer are deduplicated via singleflight.
func (c *OIDCProviderCache) GetProvider(ctx context.Context, issuer string) (*oidc.Provider, error) {
	now := c.now()

	// Fast path: read-lock check
	if entry, ok := c.getEntry(issuer); ok && now.Sub(entry.fetchedAt) < c.ttl {
		return entry.provider, nil
	}

	// Slow path: singleflight fetch
	val, err, _ := c.sf.Do(issuer, func() (interface{}, error) {
		p, err := oidc.NewProvider(ctx, issuer)
		if err != nil {
			return nil, err
		}

		c.putEntry(issuer, p)
		return p, nil
	})
	if err != nil {
		// Serve stale entry if available — keeps auth working during
		// transient network failures or issuer outages.
		if entry, ok := c.getEntry(issuer); ok {
			return entry.provider, nil
		}
		return nil, err
	}

	return val.(*oidc.Provider), nil
}

// GetProviderFromURL returns an *oidc.Provider built from an explicit discovery URL,
// rather than the standard {issuer}/.well-known/openid-configuration path.
// The result is cached and deduplicated (singleflight) under the issuer key,
// so Invalidate(issuer) continues to work unchanged.
func (c *OIDCProviderCache) GetProviderFromURL(ctx context.Context, issuer, discoveryURL string) (*oidc.Provider, error) {
	now := c.now()

	// Fast path: read-lock check
	if entry, ok := c.getEntry(issuer); ok && now.Sub(entry.fetchedAt) < c.ttl {
		return entry.provider, nil
	}

	// Slow path: singleflight fetch
	val, err, _ := c.sf.Do(issuer, func() (interface{}, error) {
		doc, err := utilities.FetchAndValidateOIDCDiscovery(ctx, discoveryURL, issuer)
		if err != nil {
			return nil, err
		}

		var algs []string
		for _, a := range doc.IDTokenSigningAlgValuesSupported {
			if oidcSupportedAlgorithms[a] {
				algs = append(algs, a)
			}
		}

		p := (&oidc.ProviderConfig{
			IssuerURL:   doc.Issuer,
			AuthURL:     doc.AuthorizationEndpoint,
			TokenURL:    doc.TokenEndpoint,
			UserInfoURL: doc.UserinfoEndpoint,
			JWKSURL:     doc.JwksURI,
			Algorithms:  algs,
		}).NewProvider(ctx)

		c.putEntry(issuer, p)
		return p, nil
	})
	if err != nil {
		// Serve stale entry if available — keeps auth working during
		// transient network failures or issuer outages.
		if entry, ok := c.getEntry(issuer); ok {
			return entry.provider, nil
		}
		return nil, err
	}

	return val.(*oidc.Provider), nil
}

// Invalidate removes a cached provider for the given issuer.
func (c *OIDCProviderCache) Invalidate(issuer string) {
	c.mu.Lock()
	delete(c.cache, issuer)
	c.mu.Unlock()
}

// Clear removes all cached providers.
func (c *OIDCProviderCache) Clear() {
	c.mu.Lock()
	c.cache = make(map[string]*oidcCacheEntry)
	c.mu.Unlock()
}
