import { describe, expect, it } from 'vitest'

import { doPermissionsCheck } from './useCheckPermissions'
import type { Permission } from '@/types'

function permission(overrides: Partial<Permission>): Permission {
  return {
    actions: ['read'] as any,
    condition: null as unknown as Permission['condition'],
    organization_slug: 'org-slug',
    resources: ['tables'],
    restrictive: false,
    project_refs: null,
    ...overrides,
  }
}

describe('doPermissionsCheck', () => {
  it('returns false when permissions are missing', () => {
    expect(doPermissionsCheck(undefined, 'read', 'tables', undefined, 'org-slug')).toBe(false)
  })

  it('matches a literal action and resource', () => {
    const permissions = [permission({ actions: ['read'] as any, resources: ['tables'] })]
    expect(doPermissionsCheck(permissions, 'read', 'tables', undefined, 'org-slug')).toBe(true)
    expect(doPermissionsCheck(permissions, 'read', 'columns', undefined, 'org-slug')).toBe(false)
  })

  it('treats every "." in a resource as literal, not "any character"', () => {
    // Regression for the incomplete-escaping bug: only the first "." used to get escaped,
    // so a resource with two dots would let any single character stand in for the second one.
    const permissions = [permission({ resources: ['queue_job.projects.update_jwt'] })]
    expect(
      doPermissionsCheck(
        permissions,
        'read',
        'queue_job.projects.update_jwt',
        undefined,
        'org-slug'
      )
    ).toBe(true)
    expect(
      doPermissionsCheck(
        permissions,
        'read',
        'queue_jobXprojectsXupdate_jwt',
        undefined,
        'org-slug'
      )
    ).toBe(false)
  })

  it('expands every "%" wildcard in a resource, not just the first one', () => {
    const permissions = [permission({ resources: ['queue_job.%.%'] })]
    expect(
      doPermissionsCheck(permissions, 'read', 'queue_job.restore.prepare', undefined, 'org-slug')
    ).toBe(true)
    expect(
      doPermissionsCheck(
        permissions,
        'read',
        'queue_job.walg.prepare_restore',
        undefined,
        'org-slug'
      )
    ).toBe(true)
  })

  it('treats a literal backslash in a resource as a literal character, not a regex escape', () => {
    const permissions = [permission({ resources: ['a\\d'] })]
    // If the backslash weren't escaped, "\d" would be interpreted as the regex digit class
    // and incorrectly match "a1".
    expect(doPermissionsCheck(permissions, 'read', 'a1', undefined, 'org-slug')).toBe(false)
    expect(doPermissionsCheck(permissions, 'read', 'a\\d', undefined, 'org-slug')).toBe(true)
  })

  it('denies when a restrictive permission matches, even if a non-restrictive one also matches', () => {
    const permissions = [
      permission({ restrictive: false, resources: ['tables'] }),
      permission({ restrictive: true, resources: ['tables'] }),
    ]
    expect(doPermissionsCheck(permissions, 'read', 'tables', undefined, 'org-slug')).toBe(false)
  })

  it('only matches permissions for the given organization', () => {
    const permissions = [permission({ organization_slug: 'other-org' })]
    expect(doPermissionsCheck(permissions, 'read', 'tables', undefined, 'org-slug')).toBe(false)
  })

  it('prefers a project-scoped permission over an org-level one when a projectRef is given', () => {
    const permissions = [
      permission({ resources: ['tables'], project_refs: [] }),
      permission({ resources: ['tables'], project_refs: ['project-ref'], restrictive: true }),
    ]
    expect(
      doPermissionsCheck(permissions, 'read', 'tables', undefined, 'org-slug', 'project-ref')
    ).toBe(false)
  })
})
