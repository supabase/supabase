import { describe, expect, it } from 'vitest'

import {
  getSiteUrlError,
  getUrlCharacterError,
  normalizeRedirectUrl,
  parseRedirectUrls,
  urlRegex,
} from '@/components/interfaces/Auth/Auth.constants'

describe('Auth.constants: urlRegex', () => {
  it('should match valid URLs', () => {
    const validUrls = [
      'http://domain.com',
      'https://supabase.io',
      'https://new-domain-vercel.com',
      'www.test-domain.com',
      'exp://exp.host/some-app',
      'exp://exp.host/some-app?release-channel=default',
      'https://supabase.com/dashboard',
      'http://localhost:3000',
      'https://supabase.com?name=test',
      'https://supabase.com?name=test&description=hello&page=2',
      'https://supabase*.com',
      'https://supabase.com/*',
      'https://new-*-domain.com/*',
      'https://new-*-domain.com/*/*/*',
      'https://sub-*-domain.new-*-domain.com/*/*/*',
    ]

    validUrls.forEach((url) => {
      expect(urlRegex().test(url)).toBe(true)
    })
  })

  it('should not match invalid URLs', () => {
    const invalidUrls = [
      'supabase',
      'mailto:test@gmail.com',
      'hello world.com',
      'email@domain.com',
      'https://my app.example.com',
      'https://example.com/auth callback',
      'https://a.example.com https://b.example.com',
      'http://localhost:3000\\',
      'https://example.com\\callback',
      'myapp://callback\\',
      'not a url chrome-extension://abcdefghijklmnop',
    ]

    invalidUrls.forEach((url) => {
      expect(urlRegex().test(url)).toBe(false)
    })
  })

  it('only matches simple domain URLs when excludeSimpleDomains is false', () => {
    const simpleDomainUrl = 'smtp-pulse.com'
    expect(urlRegex({ excludeSimpleDomains: true }).test(simpleDomainUrl)).toBe(false)
    expect(urlRegex({ excludeSimpleDomains: false }).test(simpleDomainUrl)).toBe(true)
  })

  it('rejects whitespace and backslashes in simple domains too', () => {
    expect(urlRegex({ excludeSimpleDomains: false }).test('smtp.example.com\\')).toBe(false)
    expect(urlRegex({ excludeSimpleDomains: false }).test('smtp.example .com')).toBe(false)
  })

  it('normalizes redirect URLs before saving', () => {
    expect(normalizeRedirectUrl('  https://example.com/path ,   ')).toBe('https://example.com/path')
  })

  it('parses stored redirect URLs into trimmed unique values', () => {
    expect(
      parseRedirectUrls(
        'https://example.com/callback, https://example.com/callback  ,  https://example.com/next'
      )
    ).toEqual(['https://example.com/callback', 'https://example.com/next'])
  })
})

describe('Auth.constants: getUrlCharacterError', () => {
  it.each([
    ['https://example.com/*', undefined],
    ['https://my app.example.com', "URL can't contain spaces"],
    ['https://example.com/\tcallback', "URL can't contain spaces"],
    ['https://example.com\\', "URL can't contain backslashes"],
  ])('%s', (url, expected) => {
    expect(getUrlCharacterError(url)).toBe(expected)
  })
})

describe('Auth.constants: getSiteUrlError', () => {
  it.each([
    'https://example.com',
    'https://example.com/auth/callback?next=1',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'com.example.app://callback',
    'myapp://callback',
    'myapp://',
    'exp://192.168.1.5:19000',
  ])('accepts %s', (url) => {
    expect(getSiteUrlError(url)).toBeUndefined()
  })

  it.each([
    ['https://my app.example.com', "Site URL can't contain spaces"],
    ['http://localhost:3000\\', "Site URL can't contain backslashes"],
    ['https://*.example.com', "Site URL can't contain wildcards"],
    ['https://example.com/**', "Site URL can't contain wildcards"],
    ['example.com', 'Please provide a valid URL, such as https://example.com'],
    ['/auth/callback', 'Please provide a valid URL, such as https://example.com'],
    ['localhost:3000', 'Please provide a valid URL, such as https://example.com'],
    ['example.com:8080/auth', 'Please provide a valid URL, such as https://example.com'],
    ['https:example.com', 'Please provide a valid URL, such as https://example.com'],
    ['javascript:alert(1)', "Site URL can't use the javascript: protocol"],
    ['JavaScript://example.com/%0Aalert(1)', "Site URL can't use the javascript: protocol"],
    ['data:text/html,hello', "Site URL can't use the data: protocol"],
    ['file:///tmp', "Site URL can't use the file: protocol"],
    ['vbscript:msgbox(1)', "Site URL can't use the vbscript: protocol"],
  ])('rejects %s', (url, expected) => {
    expect(getSiteUrlError(url)).toBe(expected)
  })
})
