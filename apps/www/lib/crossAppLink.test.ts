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

  it('identifies absolute URLs targeting cross-app routes on supabase.com', () => {
    expect(isCrossAppLink('https://supabase.com/docs/guides/api')).toBe(true)
    expect(isCrossAppLink('https://supabase.com/dashboard')).toBe(true)
    expect(isCrossAppLink('https://supabase.com/dashboard/sign-up')).toBe(true)
    expect(isCrossAppLink('http://localhost:3000/docs')).toBe(true)
  })

  it('does not match same-app routes or partial prefixes', () => {
    expect(isCrossAppLink('/')).toBe(false)
    expect(isCrossAppLink('/pricing')).toBe(false)
    expect(isCrossAppLink('/blog')).toBe(false)
    expect(isCrossAppLink('/docs-faq')).toBe(false)
    expect(isCrossAppLink('/documentation')).toBe(false)
    expect(isCrossAppLink('/dashboard-settings')).toBe(false)
    expect(isCrossAppLink('https://github.com/supabase/supabase')).toBe(false)
  })

  it('handles empty or undefined inputs safely', () => {
    expect(isCrossAppLink('')).toBe(false)
    expect(isCrossAppLink(undefined)).toBe(false)
  })
})
