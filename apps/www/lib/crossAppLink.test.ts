import { describe, expect, it } from 'vitest'
import { isCrossAppLink } from './crossAppLink'

describe('isCrossAppLink', () => {
  it('identifies exact cross-app roots', () => {
    expect(isCrossAppLink('/docs')).toBe(true)
    expect(isCrossAppLink('/docs/')).toBe(true)
    expect(isCrossAppLink('/dashboard')).toBe(true)
    expect(isCrossAppLink('/dashboard/')).toBe(true)
  })

  it('identifies nested cross-app subpaths', () => {
    expect(isCrossAppLink('/docs/guides/auth')).toBe(true)
    expect(isCrossAppLink('/docs/reference/javascript')).toBe(true)
    expect(isCrossAppLink('/dashboard/projects')).toBe(true)
    expect(isCrossAppLink('/dashboard/sign-up')).toBe(true)
  })

  it('identifies relative cross-app routes with query strings or hash fragments', () => {
    expect(isCrossAppLink('/docs?tab=api')).toBe(true)
    expect(isCrossAppLink('/docs#overview')).toBe(true)
    expect(isCrossAppLink('/docs/?tab=api')).toBe(true)
    expect(isCrossAppLink('/docs/#overview')).toBe(true)
    expect(isCrossAppLink('/dashboard?project=ref')).toBe(true)
    expect(isCrossAppLink('/dashboard#projects')).toBe(true)
    expect(isCrossAppLink('/dashboard/?project=ref')).toBe(true)
    expect(isCrossAppLink('/dashboard/#projects')).toBe(true)
    expect(isCrossAppLink('/docs/guides/auth?tab=api#setup')).toBe(true)
    expect(isCrossAppLink('/dashboard/projects?sort=name#list')).toBe(true)
  })

  it('returns false for absolute URLs (callers should use <a> tags directly)', () => {
    expect(isCrossAppLink('https://supabase.com/docs/guides/api')).toBe(false)
    expect(isCrossAppLink('https://supabase.com/dashboard')).toBe(false)
    expect(isCrossAppLink('http://localhost:3000/docs')).toBe(false)
    expect(isCrossAppLink('https://github.com/supabase/supabase')).toBe(false)
  })

  it('does not match same-app routes or partial prefixes', () => {
    expect(isCrossAppLink('/')).toBe(false)
    expect(isCrossAppLink('/pricing')).toBe(false)
    expect(isCrossAppLink('/pricing?redirect=/docs')).toBe(false)
    expect(isCrossAppLink('/pricing#docs')).toBe(false)
    expect(isCrossAppLink('/blog')).toBe(false)
    expect(isCrossAppLink('/docs-faq')).toBe(false)
    expect(isCrossAppLink('/docs-faq?tab=api')).toBe(false)
    expect(isCrossAppLink('/documentation')).toBe(false)
    expect(isCrossAppLink('/dashboard-settings')).toBe(false)
    expect(isCrossAppLink('/dashboard-settings#section')).toBe(false)
  })

  it('handles empty or undefined inputs safely', () => {
    expect(isCrossAppLink('')).toBe(false)
    expect(isCrossAppLink(undefined)).toBe(false)
  })
})
