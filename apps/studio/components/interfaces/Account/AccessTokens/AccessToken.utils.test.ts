import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import dayjs from 'dayjs'
import type { BaseToken } from './AccessToken.types'

// Mock PERMISSION_LIST so tests are deterministic and don't break when shared-types updates
vi.mock('./AccessToken.constants', () => ({
  PERMISSION_LIST: [
    {
      scope: 'organization',
      resource: 'billing',
      action: 'read',
      id: 'org-billing-read',
      title: 'Read Billing',
    },
    {
      scope: 'organization',
      resource: 'billing',
      action: 'write',
      id: 'org-billing-write',
      title: 'Manage Billing',
    },
    {
      scope: 'organization',
      resource: 'members',
      action: 'read',
      id: 'org-members-read',
      title: 'Read Members',
    },
    {
      scope: 'organization',
      resource: 'members',
      action: 'write',
      id: 'org-members-write',
      title: 'Manage Members',
    },
    {
      scope: 'organization',
      resource: 'members',
      action: 'create',
      id: 'org-members-create',
      title: 'Create Members',
    },
    {
      scope: 'organization',
      resource: 'members',
      action: 'delete',
      id: 'org-members-delete',
      title: 'Delete Members',
    },
    {
      scope: 'project',
      resource: 'database',
      action: 'read',
      id: 'proj-db-read',
      title: 'Read Database',
    },
  ],
}))

import {
  handleSortChange,
  filterAndSortTokens,
  mapPermissionToFGA,
  getResourcePermissions,
  getRealAccess,
  formatAccessText,
  getExpirationDate,
} from './AccessToken.utils'

// --- handleSortChange ---

describe('handleSortChange', () => {
  it('should toggle from asc to desc for the same column', () => {
    const setSort = vi.fn()
    handleSortChange('created_at:asc', 'created_at', setSort)
    expect(setSort).toHaveBeenCalledWith('created_at:desc')
  })

  it('should reset to created_at:desc when toggling off desc on a non-default column', () => {
    const setSort = vi.fn()
    handleSortChange('last_used_at:desc', 'last_used_at', setSort)
    expect(setSort).toHaveBeenCalledWith('created_at:desc')
  })

  it('should set new column to asc when switching columns', () => {
    const setSort = vi.fn()
    handleSortChange('created_at:desc', 'expires_at', setSort)
    expect(setSort).toHaveBeenCalledWith('expires_at:asc')
  })

  it('should reset to created_at:desc when toggling off desc on created_at itself', () => {
    const setSort = vi.fn()
    handleSortChange('created_at:desc', 'created_at', setSort)
    expect(setSort).toHaveBeenCalledWith('created_at:desc')
  })

  it('should set last_used_at to asc when switching from expires_at', () => {
    const setSort = vi.fn()
    handleSortChange('expires_at:asc', 'last_used_at', setSort)
    expect(setSort).toHaveBeenCalledWith('last_used_at:asc')
  })
})

// --- filterAndSortTokens ---

const makeToken = (overrides: Partial<BaseToken> = {}): BaseToken => ({
  id: '1',
  name: 'Token',
  token_alias: 'alias',
  created_at: '2024-01-01T00:00:00Z',
  last_used_at: null,
  expires_at: null,
  ...overrides,
})

describe('filterAndSortTokens', () => {
  const tokens: BaseToken[] = [
    makeToken({ id: '1', name: 'Alpha', created_at: '2024-01-03T00:00:00Z' }),
    makeToken({ id: '2', name: 'Beta', created_at: '2024-01-01T00:00:00Z' }),
    makeToken({ id: '3', name: 'Gamma', created_at: '2024-01-02T00:00:00Z' }),
  ]

  it('should return undefined when tokens is undefined', () => {
    expect(filterAndSortTokens(undefined, '', 'created_at:desc')).toBeUndefined()
  })

  it('should return all tokens when search string is empty', () => {
    const result = filterAndSortTokens(tokens, '', 'created_at:asc')
    expect(result).toHaveLength(3)
  })

  it('should filter tokens by name case-insensitively', () => {
    const result = filterAndSortTokens(tokens, 'alpha', 'created_at:asc')
    expect(result).toHaveLength(1)
    expect(result![0].name).toBe('Alpha')
  })

  it('should return empty array when no tokens match', () => {
    const result = filterAndSortTokens(tokens, 'nonexistent', 'created_at:asc')
    expect(result).toHaveLength(0)
  })

  it('should sort by created_at ascending', () => {
    const result = filterAndSortTokens(tokens, '', 'created_at:asc')!
    expect(result.map((t) => t.id)).toEqual(['2', '3', '1'])
  })

  it('should sort by created_at descending', () => {
    const result = filterAndSortTokens(tokens, '', 'created_at:desc')!
    expect(result.map((t) => t.id)).toEqual(['1', '3', '2'])
  })

  it('should sort by last_used_at ascending with nulls last', () => {
    const tokensWithUsage: BaseToken[] = [
      makeToken({ id: '1', last_used_at: '2024-03-01T00:00:00Z' }),
      makeToken({ id: '2', last_used_at: null }),
      makeToken({ id: '3', last_used_at: '2024-01-01T00:00:00Z' }),
    ]
    const result = filterAndSortTokens(tokensWithUsage, '', 'last_used_at:asc')!
    expect(result.map((t) => t.id)).toEqual(['3', '1', '2'])
  })

  it('should sort by last_used_at descending with nulls last', () => {
    const tokensWithUsage: BaseToken[] = [
      makeToken({ id: '1', last_used_at: '2024-01-01T00:00:00Z' }),
      makeToken({ id: '2', last_used_at: null }),
      makeToken({ id: '3', last_used_at: '2024-03-01T00:00:00Z' }),
    ]
    const result = filterAndSortTokens(tokensWithUsage, '', 'last_used_at:desc')!
    expect(result.map((t) => t.id)).toEqual(['3', '1', '2'])
  })

  it('should keep order stable when both last_used_at values are null', () => {
    const tokensAllNull: BaseToken[] = [
      makeToken({ id: '1', last_used_at: null }),
      makeToken({ id: '2', last_used_at: null }),
    ]
    const result = filterAndSortTokens(tokensAllNull, '', 'last_used_at:asc')!
    expect(result).toHaveLength(2)
  })

  it('should sort by expires_at ascending with nulls last', () => {
    const tokensWithExpiry: BaseToken[] = [
      makeToken({ id: '1', expires_at: '2025-06-01T00:00:00Z' }),
      makeToken({ id: '2', expires_at: null }),
      makeToken({ id: '3', expires_at: '2025-01-01T00:00:00Z' }),
    ]
    const result = filterAndSortTokens(tokensWithExpiry, '', 'expires_at:asc')!
    expect(result.map((t) => t.id)).toEqual(['3', '1', '2'])
  })

  it('should sort by expires_at descending with nulls last', () => {
    const tokensWithExpiry: BaseToken[] = [
      makeToken({ id: '1', expires_at: '2025-01-01T00:00:00Z' }),
      makeToken({ id: '2', expires_at: null }),
      makeToken({ id: '3', expires_at: '2025-06-01T00:00:00Z' }),
    ]
    const result = filterAndSortTokens(tokensWithExpiry, '', 'expires_at:desc')!
    expect(result.map((t) => t.id)).toEqual(['3', '1', '2'])
  })

  it('should keep order stable when both expires_at values are null', () => {
    const tokensAllNull: BaseToken[] = [
      makeToken({ id: '1', expires_at: null }),
      makeToken({ id: '2', expires_at: null }),
    ]
    const result = filterAndSortTokens(tokensAllNull, '', 'expires_at:asc')!
    expect(result).toHaveLength(2)
  })

  it('should not mutate the original tokens array', () => {
    const original = [...tokens]
    filterAndSortTokens(tokens, '', 'created_at:asc')
    expect(tokens).toEqual(original)
  })
})

// --- mapPermissionToFGA ---

describe('mapPermissionToFGA', () => {
  it('should return the permission id for a matching scope:resource + action', () => {
    const result = mapPermissionToFGA('organization:billing', 'read')
    expect(result).toEqual(['org-billing-read'])
  })

  it('should return empty array when no permission matches', () => {
    const result = mapPermissionToFGA('nonexistent:resource', 'read')
    expect(result).toEqual([])
  })

  it('should return empty array when action does not match', () => {
    const result = mapPermissionToFGA('organization:billing', 'delete')
    expect(result).toEqual([])
  })
})

// --- getResourcePermissions ---

describe('getResourcePermissions', () => {
  it('should always include "no access" with an empty array', () => {
    const result = getResourcePermissions('organization:billing')
    expect(result['no access']).toEqual([])
  })

  it('should include individual actions from PERMISSION_LIST', () => {
    const result = getResourcePermissions('organization:billing')
    expect(result['read']).toEqual(['org-billing-read'])
    expect(result['write']).toEqual(['org-billing-write'])
  })

  it('should include combined "read-write" when both read and write exist', () => {
    const result = getResourcePermissions('organization:billing')
    expect(result['read-write']).toEqual(['org-billing-read', 'org-billing-write'])
  })

  it('should return only "no access" for an unknown resource', () => {
    const result = getResourcePermissions('fake:resource')
    expect(Object.keys(result)).toEqual(['no access'])
  })

  it('should include all actions for a resource with many permissions', () => {
    const result = getResourcePermissions('organization:members')
    expect(result['read']).toEqual(['org-members-read'])
    expect(result['write']).toEqual(['org-members-write'])
    expect(result['create']).toEqual(['org-members-create'])
    expect(result['delete']).toEqual(['org-members-delete'])
    expect(result['read-write']).toEqual(['org-members-read', 'org-members-write'])
  })
})

// --- getRealAccess ---

describe('getRealAccess', () => {
  it('should return "no access" when token has no matching permissions', () => {
    expect(getRealAccess('organization:billing', [])).toBe('no access')
  })

  it('should return "no access" when permissions do not match the resource', () => {
    expect(getRealAccess('organization:billing', ['unrelated-id'])).toBe('no access')
  })

  it('should return the single action when only one matches', () => {
    expect(getRealAccess('organization:billing', ['org-billing-read'])).toBe('read')
  })

  it('should return "read-write" when both read and write permissions match', () => {
    expect(getRealAccess('organization:billing', ['org-billing-read', 'org-billing-write'])).toBe(
      'read-write'
    )
  })

  it('should join multiple granted actions with hyphens when not exactly read+write', () => {
    expect(
      getRealAccess('organization:members', [
        'org-members-read',
        'org-members-write',
        'org-members-create',
      ])
    ).toBe('read-write-create')
  })

  it('should return single action for write-only access', () => {
    expect(getRealAccess('organization:billing', ['org-billing-write'])).toBe('write')
  })
})

// --- formatAccessText ---

describe('formatAccessText', () => {
  it('should return "No access" for "no access"', () => {
    expect(formatAccessText('no access')).toBe('No access')
  })

  it('should capitalize a single word', () => {
    expect(formatAccessText('read')).toBe('Read')
  })

  it('should capitalize each hyphen-separated word', () => {
    expect(formatAccessText('read-write')).toBe('Read-Write')
  })

  it('should handle multi-segment actions', () => {
    expect(formatAccessText('read-write-delete')).toBe('Read-Write-Delete')
  })
})

// --- getExpirationDate ---

describe('getExpirationDate', () => {
  const FIXED_DATE = new Date('2025-06-15T12:00:00.000Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_DATE)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return a date exactly 1 hour from now for "hour"', () => {
    const result = getExpirationDate('hour')!
    expect(result).toBe(dayjs(FIXED_DATE).add(1, 'hours').toISOString())
  })

  it('should return a date exactly 1 day from now for "day"', () => {
    const result = getExpirationDate('day')!
    expect(result).toBe(dayjs(FIXED_DATE).add(1, 'day').toISOString())
  })

  it('should return a date exactly 7 days from now for "week"', () => {
    const result = getExpirationDate('week')!
    expect(result).toBe(dayjs(FIXED_DATE).add(7, 'days').toISOString())
  })

  it('should return a date exactly 30 days from now for "month"', () => {
    const result = getExpirationDate('month')!
    expect(result).toBe(dayjs(FIXED_DATE).add(30, 'days').toISOString())
  })

  it('should return undefined for "never"', () => {
    expect(getExpirationDate('never')).toBeUndefined()
  })

  it('should return undefined for an unknown key', () => {
    expect(getExpirationDate('unknown')).toBeUndefined()
  })

  it('should return a valid ISO string', () => {
    const result = getExpirationDate('hour')!
    expect(dayjs(result).isValid()).toBe(true)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
