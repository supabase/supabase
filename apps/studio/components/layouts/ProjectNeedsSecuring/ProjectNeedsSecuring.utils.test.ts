import { describe, expect, it } from 'vitest'

import type { ProjectSecurityTable } from './ProjectNeedsSecuring.types'
import {
  buildSecurityPromptMarkdown,
  formatRlsDescription,
  getTableKey,
  getTablePoliciesHref,
  sortTables,
} from './ProjectNeedsSecuring.utils'

const table = (overrides: Partial<ProjectSecurityTable>): ProjectSecurityTable => ({
  id: 1,
  name: 't',
  schema: 'public',
  rlsEnabled: false,
  hasRlsIssue: false,
  dataApiAccessible: false,
  ...overrides,
})

describe('ProjectNeedsSecuring.utils: getTableKey', () => {
  it('joins schema and name with a dot', () => {
    expect(getTableKey({ schema: 'public', name: 'users' })).toBe('public.users')
  })
})

describe('ProjectNeedsSecuring.utils: formatRlsDescription', () => {
  it('returns the singular form when count is 1', () => {
    expect(formatRlsDescription(1)).toContain('1 table has RLS disabled')
    expect(formatRlsDescription(1)).toContain('its data')
  })

  it('returns the plural form for any other count', () => {
    expect(formatRlsDescription(3)).toContain('3 tables have RLS disabled')
    expect(formatRlsDescription(3)).toContain('their data')
  })
})

describe('ProjectNeedsSecuring.utils: sortTables', () => {
  it('puts tables with active RLS issues first', () => {
    const tables = [
      table({ id: 1, name: 'a', hasRlsIssue: false, rlsEnabled: true }),
      table({ id: 2, name: 'b', hasRlsIssue: true, rlsEnabled: false }),
      table({ id: 3, name: 'c', hasRlsIssue: false, rlsEnabled: false }),
    ]
    const sorted = sortTables(tables)
    expect(sorted.map((t) => t.name)).toEqual(['b', 'c', 'a'])
  })
})

describe('ProjectNeedsSecuring.utils: buildSecurityPromptMarkdown', () => {
  it('builds a markdown report with a header row and one row per table', () => {
    const markdown = buildSecurityPromptMarkdown(1, [
      table({ name: 'invoices', schema: 'public', dataApiAccessible: true, rlsEnabled: false }),
    ])
    expect(markdown).toContain('## Project security review')
    expect(markdown).toContain('1 table has RLS disabled')
    expect(markdown).toContain('| invoices | public | Yes | Disabled |')
  })
})

describe('ProjectNeedsSecuring.utils: getTablePoliciesHref', () => {
  it('builds the policies href with plain values', () => {
    expect(getTablePoliciesHref('abc', 'public', 'invoices')).toBe(
      '/project/abc/auth/policies?schema=public&search=invoices'
    )
  })

  it('preserves special characters in the table name', () => {
    const href = getTablePoliciesHref('abc', 'public', 'user_data&secret=1')
    const parsed = new URL(href, 'http://example.com')
    expect(parsed.searchParams.get('search')).toBe('user_data&secret=1')
    expect(parsed.searchParams.get('schema')).toBe('public')
  })

  it('preserves special characters in the schema', () => {
    const href = getTablePoliciesHref('abc', 'my schema+x', 'users')
    const parsed = new URL(href, 'http://example.com')
    expect(parsed.searchParams.get('schema')).toBe('my schema+x')
    expect(parsed.searchParams.get('search')).toBe('users')
  })

  it('encodes both values together', () => {
    const href = getTablePoliciesHref('abc', 'a&b=c', 'd e+f')
    const parsed = new URL(href, 'http://example.com')
    expect(parsed.searchParams.get('schema')).toBe('a&b=c')
    expect(parsed.searchParams.get('search')).toBe('d e+f')
  })

  it('falls back to empty strings for undefined inputs', () => {
    expect(getTablePoliciesHref(undefined, undefined, undefined)).toBe(
      '/project//auth/policies?schema=&search='
    )
  })
})
