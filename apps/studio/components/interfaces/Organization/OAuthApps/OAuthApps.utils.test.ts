import { getMcpClientIconSrc } from 'ui-patterns/McpUrlBuilder'
import { describe, expect, test } from 'vitest'

import {
  findTrustedPartnerByRedirectUri,
  getOAuthImpersonationWarning,
  getRedirectHostname,
  getRequesterLogo,
  hostMatchesAllowlist,
  isLocalRedirectHost,
} from './OAuthApps.utils'

describe('hostMatchesAllowlist', () => {
  test('allows exact and subdomain hosts', () => {
    expect(hostMatchesAllowlist('claude.ai', ['claude.ai'])).toBe(true)
    expect(hostMatchesAllowlist('api.claude.ai', ['claude.ai'])).toBe(true)
  })

  test('rejects lookalike hosts', () => {
    expect(hostMatchesAllowlist('claude.ai.evil.com', ['claude.ai'])).toBe(false)
    expect(hostMatchesAllowlist('notclaude.ai', ['claude.ai'])).toBe(false)
    expect(hostMatchesAllowlist('evilclaude.ai', ['claude.ai'])).toBe(false)
  })
})

describe('isLocalRedirectHost', () => {
  test.each(['localhost', '127.0.0.1', '[::1]', '::1', 'app.localhost'])(
    'treats %s as local',
    (host) => {
      expect(isLocalRedirectHost(host)).toBe(true)
    }
  )

  test('treats public hosts as remote', () => {
    expect(isLocalRedirectHost('claude.ai')).toBe(false)
    expect(isLocalRedirectHost('evil.com')).toBe(false)
  })
})

describe('getRedirectHostname', () => {
  test('parses https redirect URIs', () => {
    expect(getRedirectHostname('https://claude.ai/api/mcp/auth_callback')).toBe('claude.ai')
  })

  test('returns null for invalid URIs', () => {
    expect(getRedirectHostname('not-a-url')).toBe(null)
    expect(getRedirectHostname(null)).toBe(null)
  })
})

describe('findTrustedPartnerByRedirectUri', () => {
  test('resolves Claude from redirect host', () => {
    expect(
      findTrustedPartnerByRedirectUri('https://claude.ai/api/mcp/auth_callback')?.displayName
    ).toBe('Claude')
  })

  test('ignores localhost redirects', () => {
    expect(findTrustedPartnerByRedirectUri('http://127.0.0.1:42813/callback')).toBe(null)
  })
})

describe('getRequesterLogo', () => {
  test('uses curated assets when redirect host is allowlisted', () => {
    const trusted = getRequesterLogo({
      icon: null,
      name: 'Claude',
      redirectUri: 'https://claude.ai/api/mcp/auth_callback',
      useDarkVariant: false,
    })
    expect(trusted).toEqual({
      src: getMcpClientIconSrc({ icon: 'claude', useDarkVariant: false }),
      isKnownClient: true,
    })
  })

  test('uses curated assets for localhost when the name matches a trusted partner', () => {
    expect(
      getRequesterLogo({
        icon: null,
        name: 'Claude',
        redirectUri: 'http://127.0.0.1:42813/callback',
        useDarkVariant: false,
      })
    ).toEqual({
      src: getMcpClientIconSrc({ icon: 'claude', useDarkVariant: false }),
      isKnownClient: true,
    })
  })

  test('does not use curated assets from name alone on a remote host', () => {
    expect(
      getRequesterLogo({
        icon: null,
        name: 'Claude',
        redirectUri: 'https://evil.com/callback',
        useDarkVariant: false,
      })
    ).toEqual({ src: '', isKnownClient: false })
  })

  test('falls back to the supplied icon URL when redirect is not trusted', () => {
    expect(
      getRequesterLogo({
        icon: 'https://example.com/icon.png',
        name: 'Acme',
        redirectUri: 'https://evil.com/callback',
        useDarkVariant: false,
      })
    ).toEqual({ src: 'https://example.com/icon.png', isKnownClient: false })
  })
})

describe('getOAuthImpersonationWarning', () => {
  test('warns when a trusted name redirects to a remote non-allowlisted host', () => {
    expect(
      getOAuthImpersonationWarning({
        name: 'Claude Desktop',
        redirectUri: 'https://evil.com/callback',
      })
    ).toEqual({
      brandDisplayName: 'Claude',
      redirectHost: 'evil.com',
    })
  })

  test('skips localhost MCP redirects', () => {
    expect(
      getOAuthImpersonationWarning({
        name: 'Claude',
        redirectUri: 'http://127.0.0.1:42813/callback',
      })
    ).toBe(null)
  })

  test('skips when redirect host matches the named partner', () => {
    expect(
      getOAuthImpersonationWarning({
        name: 'Claude',
        redirectUri: 'https://claude.ai/api/mcp/auth_callback',
      })
    ).toBe(null)
  })

  test('skips when the name does not match a trusted partner', () => {
    expect(
      getOAuthImpersonationWarning({
        name: 'Acme Tools',
        redirectUri: 'https://evil.com/callback',
      })
    ).toBe(null)
  })

  test('skips missing or unparsable redirect URIs', () => {
    expect(
      getOAuthImpersonationWarning({
        name: 'Claude',
        redirectUri: null,
      })
    ).toBe(null)
    expect(
      getOAuthImpersonationWarning({
        name: 'Claude',
        redirectUri: 'not-a-url',
      })
    ).toBe(null)
  })
})
