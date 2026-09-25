import { describe, expect, it } from 'vitest'

import { doPermissionsCheckV2 } from './useCheckPermissionsV2'
import type { PermissionV2 } from '@/types'

function permissions(overrides?: Partial<PermissionV2['organizations'][number]>): PermissionV2 {
  return {
    organizations: [
      {
        slug: 'org-slug',
        role: 'developer',
        permissions: ['storage_read', 'storage_write'],
        projects: [],
        ...overrides,
      },
    ],
  }
}

describe('doPermissionsCheckV2', () => {
  it('returns false when data is missing', () => {
    expect(doPermissionsCheckV2(undefined, 'storage_read', 'org-slug')).toBe(false)
  })

  it('returns false for an unknown organization', () => {
    expect(doPermissionsCheckV2(permissions(), 'storage_read', 'other-org')).toBe(false)
  })

  it('grants from org level permissions', () => {
    expect(doPermissionsCheckV2(permissions(), 'storage_read', 'org-slug')).toBe(true)
    expect(doPermissionsCheckV2(permissions(), 'custom_domain_write', 'org-slug')).toBe(false)
  })

  it('org level permissions apply when a projectRef is given but has no explicit entry', () => {
    expect(doPermissionsCheckV2(permissions(), 'storage_read', 'org-slug', 'some-project')).toBe(
      true
    )
  })

  it('grants from a project scoped role entry', () => {
    const data = permissions({
      role: 'member',
      permissions: ['storage_read'],
      projects: [{ ref: 'project-ref', role: 'developer', permissions: ['storage_write'] }],
    })
    expect(doPermissionsCheckV2(data, 'storage_write', 'org-slug', 'project-ref')).toBe(true)
    // project-scoped role does not leak to other projects in the org
    expect(doPermissionsCheckV2(data, 'storage_write', 'org-slug', 'other-project')).toBe(false)
    // ...or to org-level checks
    expect(doPermissionsCheckV2(data, 'storage_write', 'org-slug')).toBe(false)
  })

  it('returns false when organizationSlug is undefined', () => {
    expect(doPermissionsCheckV2(permissions(), 'storage_read', undefined)).toBe(false)
  })
})
