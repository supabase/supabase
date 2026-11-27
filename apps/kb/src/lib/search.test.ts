import { describe, expect, it } from 'vitest'

import { reshapeKbResult } from './search'

const row = {
  title: 'Migrate from Neon to Supabase',
  href: 'https://supabase.com/kb/guides/migrate-from-neon',
  heading: 'Export your data',
  headingPath: ['Migrate from Neon to Supabase', 'Export your data'],
  excerpt: 'Dump your Neon database',
  score: 0.8,
}

describe('reshapeKbResult', () => {
  it('maps an api/search row to a search result with a site-relative path', () => {
    expect(reshapeKbResult(row)).toEqual({
      path: '/kb/guides/migrate-from-neon',
      title: row.title,
      heading: row.heading,
      excerpt: row.excerpt,
      headingPath: row.headingPath,
      score: 0.8,
    })
  })

  it('keeps the case of the href, so mixed-case articles stay reachable', () => {
    const result = reshapeKbResult({
      ...row,
      href: 'https://supabase.com/kb/troubleshooting/42501--permission-denied-KnozmQ',
    })
    expect(result?.path).toBe('/kb/troubleshooting/42501--permission-denied-KnozmQ')
  })

  it('falls back to the page title when there is no heading path', () => {
    expect(reshapeKbResult({ ...row, headingPath: [] })?.headingPath).toEqual([row.title])
    expect(reshapeKbResult({ ...row, headingPath: undefined })?.headingPath).toEqual([row.title])
  })

  it('drops rows that are not search results', () => {
    expect(reshapeKbResult(null)).toBeNull()
    expect(reshapeKbResult('nope')).toBeNull()
    expect(reshapeKbResult({ title: 'No href' })).toBeNull()
  })
})
