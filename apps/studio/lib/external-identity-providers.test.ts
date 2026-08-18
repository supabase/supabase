import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  buildProviderAuthRedirect,
  getIdentityProviderConfig,
  getProviderDisplay,
  normalizeIconPath,
} from './external-identity-providers'

describe('external identity providers', () => {
  test('normalizes relative icon paths against the dashboard base path', () => {
    expect(normalizeIconPath('/img/icons/github-icon.svg')).toBe('/img/icons/github-icon.svg')
    expect(normalizeIconPath('img/icons/github-icon.svg')).toBe('/img/icons/github-icon.svg')
    expect(normalizeIconPath('https://example.com/icon.svg')).toBe('https://example.com/icon.svg')
  })

  test('resolves static provider config by provider id or auth provider', () => {
    expect(getIdentityProviderConfig('github')?.displayName).toBe('GitHub')
    expect(getIdentityProviderConfig('unknown')).toBeUndefined()
  })

  test('returns display metadata for static, built-in, and fallback providers', () => {
    expect(getProviderDisplay('github').displayName).toBe('GitHub')
    expect(getProviderDisplay('email').displayName).toBe('Email')
    expect(getProviderDisplay('sso:test').displayName).toBe('SSO')
    expect(getProviderDisplay('my_provider').displayName).toBe('my provider')
  })

  test('derives a title-cased name for unregistered custom providers', () => {
    expect(getProviderDisplay('custom:acme').displayName).toBe('Acme')
    expect(getProviderDisplay('Custom:Acme').displayName).toBe('Acme')
    expect(getProviderDisplay('custom:my_provider').displayName).toBe('My Provider')
    expect(getProviderDisplay('custom:MY_PROVIDER').displayName).toBe('My Provider')
    // registered custom providers keep their configured display name
    expect(getProviderDisplay('custom:openai').displayName).toBe('ChatGPT')
  })

  test('marks static provider icons as monochrome but not built-in or fallback icons', () => {
    expect(getProviderDisplay('github').hasMonochromeIcon).toBe(true)
    expect(getProviderDisplay('email').hasMonochromeIcon).toBeUndefined()
    expect(getProviderDisplay('sso:test').hasMonochromeIcon).toBeUndefined()
  })

  describe('buildProviderAuthRedirect', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
    })

    test('builds the MFA-check URL against the configured site URL', () => {
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://supabase.com/dashboard')

      expect(buildProviderAuthRedirect('github')).toBe(
        'https://supabase.com/dashboard/sign-in-mfa?method=github'
      )
    })

    test('URL-encodes custom provider ids in the method param', () => {
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://supabase.com/dashboard')

      expect(buildProviderAuthRedirect('custom:example')).toBe(
        'https://supabase.com/dashboard/sign-in-mfa?method=custom%3Aexample'
      )
    })

    test('appends an encoded returnTo destination when provided', () => {
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://supabase.com/dashboard')

      expect(buildProviderAuthRedirect('custom:example', '/account/me')).toBe(
        'https://supabase.com/dashboard/sign-in-mfa?method=custom%3Aexample&returnTo=%2Faccount%2Fme'
      )
    })

    test('uses the current origin on Vercel preview deployments', () => {
      vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview')
      vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://supabase.com/dashboard')

      expect(buildProviderAuthRedirect('github')).toBe(
        `${location.origin}/sign-in-mfa?method=github`
      )
    })
  })
})
