import { describe, expect, it } from 'vitest'

import { doPermissionsCheckV2 } from './useCheckPermissionsV2'
import { PermissionsV2Data } from '@/data/permissions/permissions-query-v2'

function permissions(
  overrides?: Partial<PermissionsV2Data['organizations'][number]>
): PermissionsV2Data {
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

  describe('requirement groups', () => {
    it('keeps flat arrays as a single AND group', () => {
      expect(
        doPermissionsCheckV2(permissions(), ['storage_read', 'storage_write'], 'org-slug')
      ).toBe(true)
      expect(
        doPermissionsCheckV2(permissions(), ['storage_read', 'custom_domain_write'], 'org-slug')
      ).toBe(false)
    })

    it('passes when any group is fully satisfied', () => {
      const groups = [['custom_domain_write'], ['storage_read', 'storage_write']] as const
      expect(doPermissionsCheckV2(permissions(), groups, 'org-slug')).toBe(true)
    })

    it('fails when every group misses a permission', () => {
      const groups = [
        ['storage_read', 'custom_domain_write'],
        ['custom_domain_write', 'storage_write'],
      ] as const
      expect(doPermissionsCheckV2(permissions(), groups, 'org-slug')).toBe(false)
    })

    it('resolves each permission in a group from the project or the org', () => {
      const data = permissions({
        role: 'member',
        permissions: ['storage_read'],
        projects: [{ ref: 'project-ref', role: 'developer', permissions: ['storage_write'] }],
      })
      const groups = [['storage_read', 'storage_write']] as const
      expect(doPermissionsCheckV2(data, groups, 'org-slug', 'project-ref')).toBe(true)
      expect(doPermissionsCheckV2(data, groups, 'org-slug', 'other-project')).toBe(false)
    })

    it('fails closed on an empty group, even next to a satisfied one', () => {
      expect(doPermissionsCheckV2(permissions(), [[]], 'org-slug')).toBe(false)
      expect(doPermissionsCheckV2(permissions(), [[], ['storage_read']], 'org-slug')).toBe(true)
      expect(doPermissionsCheckV2(permissions(), [[], ['custom_domain_write']], 'org-slug')).toBe(
        false
      )
    })

    it('fails closed on an empty list', () => {
      expect(doPermissionsCheckV2(permissions(), [], 'org-slug')).toBe(false)
    })
  })
})
