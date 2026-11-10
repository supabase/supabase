import { describe, expect, it } from 'vitest'

import {
  formatFunctionSearchDetails,
  formatTriggerSearchDetails,
  getFunctionEditorRoute,
  getPolicyEditorRoute,
  getTriggerEditorRoute,
  matchesTableRelatedSearch,
  matchesTriggerSearch,
} from './DatabaseEntitySearch.utils'

describe('matchesTableRelatedSearch', () => {
  const policy = { name: 'Authors can edit', schema: 'public', table: 'blog_posts' }

  it.each([
    ['the policy name', 'AUTHORS'],
    ['the table name', 'blog_p'],
    ['a schema-qualified table', 'pub.blog_posts'],
  ])('matches on %s', (_, query) => {
    expect(matchesTableRelatedSearch(policy, query)).toBe(true)
  })

  it('does not match unrelated searches', () => {
    expect(matchesTableRelatedSearch(policy, 'colors')).toBe(false)
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

describe('getFunctionEditorRoute', () => {
  it('sets the schema so the function is listed on the functions page', () => {
    expect(getFunctionEditorRoute('abc', { id: 9, schema: 'my schema' })).toBe(
      '/project/abc/database/functions?schema=my%20schema&edit=9'
    )
  })
})

describe('formatFunctionSearchDetails', () => {
  it.each([
    [{ type: 'function', args: 'a integer, b text' }, '(a integer, b text)'],
    [{ type: 'function', args: '' }, ''],
    [{ type: 'procedure', args: 'id bigint' }, 'procedure (id bigint)'],
    [{ type: 'procedure', args: '' }, 'procedure'],
  ] as const)('formats %j', (fn, expected) => {
    expect(formatFunctionSearchDetails(fn)).toBe(expected)
  })
})

describe('getTriggerEditorRoute', () => {
  it('links to the list page directly, since the index route drops the query string', () => {
    expect(getTriggerEditorRoute('abc', { id: 5, schema: 'my schema' })).toBe(
      '/project/abc/database/triggers/data?schema=my%20schema&edit=5'
    )
  })
})

describe('formatTriggerSearchDetails', () => {
  const cases: Array<[Parameters<typeof formatTriggerSearchDetails>[0], string]> = [
    [
      {
        activation: 'BEFORE',
        events: ['INSERT'],
        schema: 'public',
        table: 'posts',
        matched_function: null,
      },
      'BEFORE INSERT on public.posts',
    ],
    [
      {
        activation: 'AFTER',
        events: ['UPDATE', 'DELETE'],
        schema: 'blog',
        table: 'posts',
        matched_function: null,
      },
      'AFTER UPDATE OR DELETE on blog.posts',
    ],
    [
      {
        activation: 'INSTEAD OF',
        events: ['INSERT'],
        schema: 'public',
        table: 'posts_view',
        matched_function: null,
      },
      'INSTEAD OF INSERT on public.posts_view',
    ],
    [
      {
        activation: 'AFTER',
        events: ['INSERT'],
        schema: 'public',
        table: 'posts',
        matched_function: 'handle_new_user',
      },
      'Runs handle_new_user',
    ],
  ]

  it.each(cases)('formats %j', (trigger, expected) => {
    expect(formatTriggerSearchDetails(trigger)).toBe(expected)
  })
})

describe('matchesTriggerSearch', () => {
  const trigger = {
    name: 'on_author_created',
    schema: 'public',
    table: 'authors',
    matched_function: 'handle_new_user',
  }

  it.each([
    ['its own name', 'author_created'],
    ['its table', 'authors'],
    ['the function it runs', 'HANDLE_NEW'],
  ])('matches on %s', (_, query) => {
    expect(matchesTriggerSearch(trigger, query)).toBe(true)
  })

  it('does not match unrelated searches, or the function when it was not what matched', () => {
    expect(matchesTriggerSearch(trigger, 'colors')).toBe(false)
    expect(matchesTriggerSearch({ ...trigger, matched_function: null }, 'handle_new')).toBe(false)
  })
})
