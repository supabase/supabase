import { describe, expect, it } from 'vitest'

import { describeSearchQuery } from './search-query-telemetry'

describe('describeSearchQuery', () => {
  it.each([
    ['auth', 1],
    ['row level security', 3],
    ['service_role key', 2],
    ['  edge-functions  ', 1],
    ['how do i login', 4],
    [`${'a'.repeat(16)} ${'b'.repeat(16)} ${'c'.repeat(6)}`, 3],
  ])('sends the text of the keyword-shaped term %j', (rawQuery, queryWordCount) => {
    const query = rawQuery.trim()

    expect(describeSearchQuery(rawQuery)).toEqual({
      query,
      queryLength: query.length,
      queryWordCount,
    })
  })

  it.each([
    ['a signed token', `eyJ${'a'.repeat(30)}.eyJ${'b'.repeat(30)}.${'c'.repeat(30)}`],
    ['a secret key', `sb_secret_${'a'.repeat(22)}_${'b'.repeat(8)}`],
    ['a letters-only secret under the length limit', `sb_secret_${'a'.repeat(20)}`],
    ['a project ref', 'abcdefghijklmnopqrst'],
    ['a connection string', 'postgresql://postgres:hunter2@db.example.com:5432/postgres'],
    ['an email address', 'person@example.com'],
    ['a user id', '3f2504e0-4f89-41d3-9a0c-0305e82c3301'],
    ['a phone number', '+15555550100'],
    ['a term with digits', 'error 42501'],
    ['letters-only parts that add up to over the length limit', 'abcdefghijklmn '.repeat(3).trim()],
  ])('leaves out the text of %s', (_label, rawQuery) => {
    const description = describeSearchQuery(rawQuery)

    expect(description).not.toHaveProperty('query')
    expect(description.queryLength).toBe(rawQuery.length)
  })

  it('leaves out the text of a longer question', () => {
    expect(describeSearchQuery('how do I set up the supabase mcp server')).toEqual({
      queryLength: 39,
      queryWordCount: 9,
    })
  })

  it('leaves out pasted multi-word text with a credential', () => {
    expect(describeSearchQuery('connect fails with password=hunter2 on port 5432')).toEqual({
      queryLength: 48,
      queryWordCount: 7,
    })
  })

  it('collapses repeated whitespace so a stray double space keeps a keyword a keyword', () => {
    expect(describeSearchQuery('auth  \t policies')).toEqual({
      query: 'auth policies',
      queryLength: 13,
      queryWordCount: 2,
    })
  })

  it('describes an empty term without text', () => {
    expect(describeSearchQuery('   ')).toEqual({
      queryLength: 0,
      queryWordCount: 0,
    })
  })
})
