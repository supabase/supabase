import { describe, expect, test } from 'vitest'

import {
  ASSISTANT_OAUTH_COMPLETE_TYPE,
  buildOAuthCallbackHtml,
  buildOAuthMismatchHtml,
  oauthCallbackTargetOrigin,
} from './oauth-callback-page'

describe('buildOAuthMismatchHtml', () => {
  test('names both organizations and the platform, without completing the flow', () => {
    const html = buildOAuthMismatchHtml({
      expectedSlug: 'local-org',
      connectedSlugs: ['cloud-org'],
      managementApiUrl: 'https://api.supabase.com',
      returnTo: 'http://localhost:8082/project/abc',
    })

    expect(html).toContain('local-org')
    expect(html).toContain('cloud-org')
    expect(html).toContain('api.supabase.com')
    expect(html).toContain('Back to Studio')
    expect(html).not.toContain(ASSISTANT_OAUTH_COMPLETE_TYPE)
    expect(html).not.toContain('window.close()')
  })
})

describe('oauthCallbackTargetOrigin', () => {
  test('returns the origin of an absolute URL', () => {
    expect(oauthCallbackTargetOrigin('http://localhost:8082/project/abc')).toBe(
      'http://localhost:8082'
    )
  })

  test('returns null for a path or empty value', () => {
    expect(oauthCallbackTargetOrigin('/project/abc')).toBeNull()
    expect(oauthCallbackTargetOrigin(null)).toBeNull()
  })
})

describe('buildOAuthCallbackHtml', () => {
  test('embeds a postMessage payload and Studio origin', () => {
    const html = buildOAuthCallbackHtml({
      orgSlug: 'acme',
      returnTo: 'http://localhost:8082/project/abc',
    })

    expect(html).toContain(ASSISTANT_OAUTH_COMPLETE_TYPE)
    expect(html).toContain('"org_slug":"acme"')
    expect(html).toContain('http://localhost:8082')
    expect(html).toContain('Back to Studio')
    expect(html).toContain('window.opener.postMessage')
    expect(html).toContain('window.close()')
  })

  test('escapes the return URL in the fallback link', () => {
    const html = buildOAuthCallbackHtml({
      orgSlug: 'acme',
      returnTo: 'http://localhost:8082/?q="><script>alert(1)</script>',
    })

    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&quot;')
  })
})
