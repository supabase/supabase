import { describe, expect, it } from 'vitest'

import { getPolicyEditorRoute, matchesPolicySearch } from './DatabaseEntitySearch.utils'

describe('matchesPolicySearch', () => {
  const policy = { name: 'Authors can edit', schema: 'public', table: 'blog_posts' }

  it.each([
    ['the policy name', 'AUTHORS'],
    ['the table name', 'blog_p'],
    ['a schema-qualified table', 'pub.blog_posts'],
  ])('matches on %s', (_, query) => {
    expect(matchesPolicySearch(policy, query)).toBe(true)
  })

  it('does not match unrelated searches', () => {
    expect(matchesPolicySearch(policy, 'colors')).toBe(false)
  })
})

describe('getPolicyEditorRoute', () => {
  it('sets the schema so the policy is listed on the policies page', () => {
    expect(getPolicyEditorRoute('abc', { id: 7, schema: 'public' })).toBe(
      '/project/abc/database/policies?schema=public&edit=7'
    )
  })

  it('encodes schema names', () => {
    expect(getPolicyEditorRoute('abc', { id: 7, schema: 'my schema&x' })).toBe(
      '/project/abc/database/policies?schema=my%20schema%26x&edit=7'
    )
  })
})
