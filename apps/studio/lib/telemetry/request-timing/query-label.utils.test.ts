import { describe, expect, it } from 'vitest'

import { getQueryLabel, UNLABELED_QUERY } from './query-label.utils'

describe('getQueryLabel', () => {
  it.each([
    // Shapes taken from the data/**/keys.ts files
    [['projects', 'abcdefghijklmnopqrst', 'edge-functions'], 'projects/edge-functions'],
    [['projects', 'abcdefghijklmnopqrst', 'table-names', 'public'], 'projects/table-names'],
    [['project', 'abcdefghijklmnopqrst', 'status'], 'project/status'],
    [['organizations', 'acme-corp', 'usage'], 'organizations/usage'],
    [['profile'], 'profile'],
    [['permissions'], 'permissions'],
    [['access-token'], 'access-token'],
  ])('labels %j as %s', (queryKey, label) => {
    expect(getQueryLabel(queryKey)).toBe(label)
  })

  it('keeps only the scope when no resource name follows the identifier', () => {
    expect(getQueryLabel(['projects'])).toBe('projects')
    expect(getQueryLabel(['projects', 'abcdefghijklmnopqrst'])).toBe('projects')
    expect(getQueryLabel(['organizations', 'acme-corp'])).toBe('organizations')
  })

  it('never takes a value that follows a non-scoped key name', () => {
    // `entitlements` is followed by an org slug, which would be a leak if read as a resource
    expect(getQueryLabel(['entitlements', 'acme-corp'])).toBe('entitlements')
    expect(getQueryLabel(['policies', ['public', 'auth']])).toBe('policies')
  })

  it.each([
    ['a project ref', ['abcdefghijklmnopqrst', 'tables']],
    ['a uuid', ['3f2504e0-4f89-11d3-9a0c-0305e82c3301']],
    ['SQL text', ['select * from users']],
    ['an object', [{ search: 'private' }]],
    ['a very long name', ['a'.repeat(41)]],
    ['no segments', []],
  ])('does not label a key that starts with %s', (_name, queryKey) => {
    expect(getQueryLabel(queryKey)).toBe(UNLABELED_QUERY)
  })

  it('drops a resource position that holds a value instead of a name', () => {
    expect(getQueryLabel(['projects', 'abcdefghijklmnopqrst', 'select * from users'])).toBe(
      'projects'
    )
    expect(getQueryLabel(['projects', 'abcdefghijklmnopqrst', 'abcdefghijklmnopqrst'])).toBe(
      'projects'
    )
    expect(getQueryLabel(['projects', 'abcdefghijklmnopqrst', { filter: 'x' }])).toBe('projects')
  })
})
