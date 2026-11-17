import { describe, expect, it } from 'vitest'

import { describeSearchQuery } from './search-query-telemetry'

describe('describeSearchQuery', () => {
  it.each([
    ['auth', 1],
    ['row level security', 3],
    ['service_role key', 2],
    ['  edge-functions  ', 1],
    ['how do i login', 4],
  ])('sends the text of the keyword-shaped term %j', (rawQuery, queryWordCount) => {
    const query = rawQuery.trim()

    expect(describeSearchQuery(rawQuery)).toEqual({
      query,
      queryLength: query.length,
      queryWordCount,
      queryType: 'keyword',
    })
  })

  it.each([
    ['a signed token', `eyJ${'a'.repeat(30)}.eyJ${'b'.repeat(30)}.${'c'.repeat(30)}`],
    ['a secret key', `sb_secret_${'a'.repeat(22)}_${'b'.repeat(8)}`],
    ['a connection string', 'postgresql://postgres:hunter2@db.example.com:5432/postgres'],
    ['an email address', 'person@example.com'],
    ['a user id', '3f2504e0-4f89-41d3-9a0c-0305e82c3301'],
    ['a phone number', '+15555550100'],
    ['a term with digits', 'error 42501'],
    ['a letters-only term over the length limit', 'a'.repeat(41)],
  ])('leaves out the text of %s', (_label, rawQuery) => {
    const description = describeSearchQuery(rawQuery)

    expect(description).not.toHaveProperty('query')
    expect(description.queryLength).toBe(rawQuery.length)
    expect(description.queryType).toBe('other')
  })

  it('labels a longer question as conversational and leaves out its text', () => {
    expect(describeSearchQuery('how do I set up the supabase mcp server')).toEqual({
      queryLength: 39,
      queryWordCount: 9,
      queryType: 'conversational',
    })
  })

  it('labels pasted multi-word text with a credential as conversational, without the text', () => {
    const description = describeSearchQuery('connect fails with password=hunter2 on port 5432')

    expect(description).not.toHaveProperty('query')
    expect(description.queryType).toBe('conversational')
  })

  it('describes an empty term without text', () => {
    expect(describeSearchQuery('   ')).toEqual({
      queryLength: 0,
      queryWordCount: 0,
      queryType: 'other',
    })
  })
})
