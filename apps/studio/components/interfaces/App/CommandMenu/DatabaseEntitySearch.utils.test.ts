import { describe, expect, it } from 'vitest'

import {
  formatFunctionSearchDetails,
  formatTableSearchDetails,
  formatTriggerSearchDetails,
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

describe('formatTableSearchDetails', () => {
  const base = { id: 1, schema: 'public', name: 'blog_posts' }

  it.each([
    [{ ...base, type: 'r', rls_enabled: true, policy_count: 4 }, '4 policies • RLS enabled'],
    [{ ...base, type: 'r', rls_enabled: false, policy_count: 1 }, '1 policy • RLS disabled'],
    [{ ...base, type: 'p', rls_enabled: true, policy_count: 0 }, '0 policies • RLS enabled'],
    [{ ...base, type: 'v', security_invoker: true }, 'Security invoker'],
    [{ ...base, type: 'v', security_invoker: false }, 'Security definer'],
    // Neither RLS nor security_invoker applies, and the icon already carries the kind
    [{ ...base, type: 'm' }, ''],
    [{ ...base, type: 'f' }, ''],
  ] as const)('formats %j', (table, expected) => {
    expect(formatTableSearchDetails(table)).toBe(expected)
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
