import { describe, expect, it } from 'vitest'

import {
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
    const invalidUrls = ['supabase', 'mailto:test@gmail.com', 'hello world.com', 'email@domain.com']

    invalidUrls.forEach((url) => {
      expect(urlRegex().test(url)).toBe(false)
    })
  })

  it('only matches simple domain URLs when excludeSimpleDomains is false', () => {
    const simpleDomainUrl = 'smtp-pulse.com'
    expect(urlRegex({ excludeSimpleDomains: true }).test(simpleDomainUrl)).toBe(false)
    expect(urlRegex({ excludeSimpleDomains: false }).test(simpleDomainUrl)).toBe(true)
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
