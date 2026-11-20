import { describe, expect, test } from 'vitest'

import {
  getValidVercelReturnUrl,
  isVercelUrl,
} from '@/components/interfaces/Integrations/Vercel/VercelIntegration.utils'

describe('isVercelUrl', () => {
  test('accepts https vercel.com urls', () => {
    expect(isVercelUrl('https://vercel.com/callback')).toBe(true)
  })

  test('rejects non-vercel and invalid urls', () => {
    expect(isVercelUrl('https://example.com')).toBe(false)
    expect(isVercelUrl('http://vercel.com')).toBe(false)
    expect(isVercelUrl('not-a-url')).toBe(false)
  })
})

describe('getValidVercelReturnUrl', () => {
  test('returns the url when it is a valid vercel return url', () => {
    expect(getValidVercelReturnUrl('https://vercel.com/callback')).toBe(
      'https://vercel.com/callback'
    )
  })

  test('returns undefined for missing or invalid next values', () => {
    expect(getValidVercelReturnUrl(undefined)).toBeUndefined()
    expect(getValidVercelReturnUrl('https://example.com')).toBeUndefined()
    expect(getValidVercelReturnUrl('not-a-url')).toBeUndefined()
  })
})
