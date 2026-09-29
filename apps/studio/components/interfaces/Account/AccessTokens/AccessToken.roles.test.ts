import { permissions } from '@supabase/shared-types'
import { describe, expect, it } from 'vitest'

import { getCatalogEntry, type PermissionSelection } from './AccessToken.permissions'
import {
  applySelectionToRoleContext,
  computeTokenRoleContext,
  FGA_SCOPE_MINIMUM_ROLE,
  getIsProjectScopedOnly,
  getRoleLevel,
  requiredRoleForEntry,
  type TokenRoleContextArgs,
} from './AccessToken.roles'
import type { PermissionV2, RoleV2 } from '@/types'

type EvaluateTokenAccessArgs = TokenRoleContextArgs & { selection: PermissionSelection }

const evaluateTokenAccess = ({ selection, ...contextArgs }: EvaluateTokenAccessArgs) =>
  applySelectionToRoleContext(computeTokenRoleContext(contextArgs), selection)

const ORG = { slug: 'acme' }
const OTHER_ORG = { slug: 'globex' }
const PROJECT = { ref: 'abcdefghij1234567890', organization_slug: 'acme' }
const OTHER_PROJECT = { ref: 'klmnopqrst1234567890', organization_slug: 'acme' }

/** v2 fixture: an org entry with a role, optionally with project-scoped role entries. */
const orgEntry = (
  slug: string,
  role: RoleV2,
  projects: { ref: string; role: RoleV2 }[] = []
): PermissionV2['organizations'][number] => ({
  slug,
  role,
  // permissions arrays are irrelevant to role resolution; empty keeps fixtures terse
  permissions: [],
  projects: projects.map((p) => ({ ...p, permissions: [] })),
})

const v2 = (...organizations: PermissionV2['organizations']): PermissionV2 => ({ organizations })

const baseArgs: Omit<EvaluateTokenAccessArgs, 'permissions'> = {
  selection: {},
  resourceAccess: 'organization',
  organizationSlugs: [ORG.slug],
  projectRefs: [],
  organizations: [ORG, OTHER_ORG],
  projects: [PROJECT, OTHER_PROJECT],
}

describe('FGA_SCOPE_MINIMUM_ROLE', () => {
  it('covers exactly the scope ids published in @supabase/shared-types', () => {
    const publishedIds = Object.values(permissions.FgaPermissions)
      .flatMap((group) => Object.values(group))
      .map((permission) => permission.id)
      .sort()
    const mappedIds = Object.keys(FGA_SCOPE_MINIMUM_ROLE).sort()
    expect(mappedIds).toEqual(publishedIds)
  })
})

describe('getRoleLevel', () => {
  it('reads each base role from the v2 response', () => {
    expect(getRoleLevel(v2(orgEntry(ORG.slug, 'owner')), ORG.slug)).toBe('owner')
    expect(getRoleLevel(v2(orgEntry(ORG.slug, 'administrator')), ORG.slug)).toBe('administrator')
    expect(getRoleLevel(v2(orgEntry(ORG.slug, 'developer')), ORG.slug)).toBe('developer')
    expect(getRoleLevel(v2(orgEntry(ORG.slug, 'readonly')), ORG.slug)).toBe('readonly')
    expect(getRoleLevel(v2(orgEntry(ORG.slug, 'member')), ORG.slug)).toBe('member')
    expect(getRoleLevel(v2(), ORG.slug)).toBe('none')
  })

  it('scopes the role to the queried organization', () => {
    const data = v2(orgEntry(ORG.slug, 'owner'), orgEntry(OTHER_ORG.slug, 'readonly'))
    expect(getRoleLevel(data, ORG.slug)).toBe('owner')
    expect(getRoleLevel(data, OTHER_ORG.slug)).toBe('readonly')
  })

  it('resolves project-scoped roles only for their projects', () => {
    const data = v2(orgEntry(ORG.slug, 'member', [{ ref: PROJECT.ref, role: 'developer' }]))
    expect(getRoleLevel(data, ORG.slug, PROJECT.ref)).toBe('developer')
    expect(getRoleLevel(data, ORG.slug, OTHER_PROJECT.ref)).toBe('member')
    expect(getRoleLevel(data, ORG.slug)).toBe('member')
  })

  it('takes the max of org and project role (additive semantics)', () => {
    const data = v2(orgEntry(ORG.slug, 'developer', [{ ref: PROJECT.ref, role: 'readonly' }]))
    expect(getRoleLevel(data, ORG.slug, PROJECT.ref)).toBe('developer')
  })
})

describe('project-scoped membership helpers', () => {
  it('detects project-scoped-only membership', () => {
    expect(
      getIsProjectScopedOnly(
        v2(orgEntry(ORG.slug, 'member', [{ ref: PROJECT.ref, role: 'developer' }])),
        ORG.slug
      )
    ).toBe(true)
    expect(getIsProjectScopedOnly(v2(orgEntry(ORG.slug, 'developer')), ORG.slug)).toBe(false)
    expect(getIsProjectScopedOnly(v2(orgEntry(ORG.slug, 'member')), ORG.slug)).toBe(false)
    expect(getIsProjectScopedOnly(v2(), ORG.slug)).toBe(false)
  })
})

describe('requiredRoleForEntry', () => {
  // unchanged -- role table, not permission rows
  it('maps read and readwrite modes to the FGA role unions', () => {
    const database = getCatalogEntry('project:database')!
    expect(requiredRoleForEntry(database, 'read')).toBe('readonly')
    expect(requiredRoleForEntry(database, 'readwrite')).toBe('developer')

    const members = getCatalogEntry('organization:members')!
    expect(requiredRoleForEntry(members, 'read')).toBe('readonly')
    expect(requiredRoleForEntry(members, 'readwrite')).toBe('administrator')

    const orgAdmin = getCatalogEntry('organization:admin')!
    expect(requiredRoleForEntry(orgAdmin, 'readwrite')).toBe('owner')
  })

  it('takes the strictest scope when readwrite spans multiple write scopes', () => {
    const branching = getCatalogEntry('project:branching_production')!
    expect(requiredRoleForEntry(branching, 'readwrite')).toBe('administrator')
  })
})

describe('evaluateTokenAccess', () => {
  it('is unknown while permissions are loading', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      selection: { 'project:database': 'readwrite' },
      permissions: undefined,
    })
    expect(result.status).toBe('unknown')
    expect(result.exceedingEntryKeys).toEqual([])
    expect(result.entries['project:database'].status).toBe('unknown')
  })

  it('normalizes effectiveSelection on every path, not just the evaluated one', () => {
    const selection: PermissionSelection = {
      'project:database': 'readwrite',
      'project:backups': 'none',
      'not:a-real-key': 'read',
    }
    const expected = { 'project:database': 'readwrite' }

    expect(
      evaluateTokenAccess({ ...baseArgs, selection, permissions: undefined }).effectiveSelection
    ).toEqual(expected)
    expect(
      evaluateTokenAccess({
        ...baseArgs,
        selection,
        resourceAccess: 'account',
        organizationSlugs: [],
        permissions: v2(orgEntry(ORG.slug, 'owner')),
      }).effectiveSelection
    ).toEqual(expected)
    expect(
      evaluateTokenAccess({
        ...baseArgs,
        selection,
        permissions: v2(orgEntry(ORG.slug, 'owner')),
      }).effectiveSelection
    ).toEqual(expected)
  })

  it('passes everything the user’s role covers', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      selection: { 'project:database': 'readwrite', 'organization:members': 'readwrite' },
      permissions: v2(orgEntry(ORG.slug, 'administrator')),
    })
    expect(result.status).toBe('evaluated')
    expect(result.exceedingEntryKeys).toEqual([])
    expect(result.effectiveSelection).toEqual({
      'project:database': 'readwrite',
      'organization:members': 'readwrite',
    })
  })

  it('flags selections above the user’s role and downgrades the effective mode', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      selection: {
        'project:database': 'readwrite',
        'project:advisors': 'read',
      },
      permissions: v2(orgEntry(ORG.slug, 'readonly')),
    })
    expect(result.exceedingEntryKeys).toEqual(['project:database'])
    expect(result.entries['project:database']).toMatchObject({
      status: 'exceeds-role',
      effectiveMode: 'read',
      requiredRole: 'developer',
    })
    expect(result.effectiveSelection).toEqual({
      'project:database': 'read',
      'project:advisors': 'read',
    })
  })

  it('drops entries whose read mode already exceeds the role', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      selection: { 'project:api_gateway_keys': 'read' },
      permissions: v2(orgEntry(ORG.slug, 'readonly')),
    })
    expect(result.entries['project:api_gateway_keys']).toMatchObject({
      status: 'exceeds-role',
      effectiveMode: 'none',
    })
    expect(result.effectiveSelection).toEqual({})
  })

  it('uses the weakest role across multiple bound organizations and names the failing ones', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      organizationSlugs: [ORG.slug, OTHER_ORG.slug],
      selection: { 'project:database': 'readwrite' },
      permissions: v2(orgEntry(ORG.slug, 'owner'), orgEntry(OTHER_ORG.slug, 'readonly')),
    })
    expect(result.exceedingEntryKeys).toEqual(['project:database'])
    expect(result.entries['project:database'].failingResources).toEqual([
      {
        type: 'organization',
        id: OTHER_ORG.slug,
        label: OTHER_ORG.slug,
        role: 'readonly',
        projectScopedRoles: undefined,
      },
    ])
  })

  it('evaluates project mode per selected project for project-scoped members', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      resourceAccess: 'project',
      projectRefs: [PROJECT.ref],
      selection: { 'project:database': 'readwrite', 'organization:members': 'read' },
      permissions: v2(orgEntry(ORG.slug, 'member', [{ ref: PROJECT.ref, role: 'developer' }])),
    })
    expect(result.entries['project:database'].status).toBe('ok')
    expect(result.entries['organization:members'].status).toBe('unavailable-for-scope')
    expect(result.entries['organization:members'].effectiveMode).toBe('none')
    expect(result.entries['organization:members'].failingResources).toEqual([])
    expect(result.unavailableEntryKeys).toEqual(['organization:members'])
    expect(result.exceedingEntryKeys).toEqual([])
    expect(result.effectiveSelection).toEqual({ 'project:database': 'readwrite' })
  })

  it('honors project-scoped roles for project entries on organization-scoped tokens', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      selection: { 'project:database': 'readwrite' },
      permissions: v2(orgEntry(ORG.slug, 'member', [{ ref: PROJECT.ref, role: 'developer' }])),
      organizations: [ORG],
      projects: [PROJECT, OTHER_PROJECT],
    })
    expect(result.entries['project:database'].status).toBe('exceeds-role')
    expect(result.entries['project:database'].failingResources).toEqual([
      { type: 'project', id: OTHER_PROJECT.ref, label: OTHER_PROJECT.ref, role: 'member' },
    ])

    const allProjects = evaluateTokenAccess({
      ...baseArgs,
      selection: { 'project:database': 'readwrite' },
      permissions: v2(
        orgEntry(ORG.slug, 'member', [
          { ref: PROJECT.ref, role: 'developer' },
          { ref: OTHER_PROJECT.ref, role: 'developer' },
        ])
      ),
      organizations: [ORG],
      projects: [PROJECT, OTHER_PROJECT],
    })
    expect(allProjects.entries['project:database'].status).toBe('ok')
    expect(allProjects.effectiveSelection).toEqual({ 'project:database': 'readwrite' })
  })

  it('falls back to the org level for bound orgs with no accessible projects', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      selection: { 'project:database': 'readwrite' },
      permissions: v2(orgEntry(ORG.slug, 'readonly')),
      organizations: [ORG],
      projects: [],
    })
    expect(result.entries['project:database'].status).toBe('exceeds-role')
    expect(result.entries['project:database'].failingResources).toEqual([
      {
        type: 'organization',
        id: ORG.slug,
        label: ORG.slug,
        role: 'readonly',
        projectScopedRoles: undefined,
      },
    ])
  })

  it('marks org-level entries unavailable on project-scoped tokens even for org owners', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      resourceAccess: 'project',
      projectRefs: [PROJECT.ref],
      selection: { 'organization:members': 'readwrite', 'user:organizations': 'read' },
      permissions: v2(orgEntry(ORG.slug, 'owner')),
    })
    expect(result.entries['organization:members'].status).toBe('unavailable-for-scope')
    expect(result.entries['user:organizations'].status).toBe('ok')
    expect(result.effectiveSelection).toEqual({ 'user:organizations': 'read' })
  })

  it('explains org-level failures for members invited only to a project', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      resourceAccess: 'organization',
      selection: { 'organization:admin': 'readwrite' },
      permissions: v2(orgEntry(ORG.slug, 'member', [{ ref: PROJECT.ref, role: 'readonly' }])),
      organizations: [{ ...ORG, name: 'Acme Corp' }],
      projects: [{ ...PROJECT, name: 'Acme production' }],
    })
    expect(result.entries['organization:admin']).toMatchObject({
      status: 'exceeds-role',
      requiredRole: 'owner',
      failingResources: [
        {
          type: 'organization',
          id: ORG.slug,
          label: 'Acme Corp',
          role: 'member',
          projectScopedRoles: [{ label: 'Acme production', role: 'readonly' }],
        },
      ],
    })
  })

  it('does not attach project-scoped detail for organization-wide members', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      selection: { 'organization:admin': 'readwrite' },
      permissions: v2(orgEntry(ORG.slug, 'developer')),
    })
    expect(result.entries['organization:admin'].failingResources).toEqual([
      {
        type: 'organization',
        id: ORG.slug,
        label: ORG.slug,
        role: 'developer',
        projectScopedRoles: undefined,
      },
    ])
  })

  it('labels failing resources with their display names when provided', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      resourceAccess: 'project',
      projectRefs: [PROJECT.ref],
      selection: { 'project:database': 'readwrite' },
      permissions: v2(orgEntry(ORG.slug, 'readonly')),
      projects: [{ ...PROJECT, name: 'Acme production' }],
    })
    expect(result.entries['project:database'].failingResources).toEqual([
      { type: 'project', id: PROJECT.ref, label: 'Acme production', role: 'readonly' },
    ])
  })

  it('reports bound resources the user can no longer access', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      organizationSlugs: ['departed-org'],
      selection: { 'project:database': 'read' },
      permissions: v2(orgEntry(ORG.slug, 'readonly')),
      organizations: [ORG],
    })
    expect(result.inaccessibleOrgSlugs).toEqual(['departed-org'])
    expect(result.hasNoAccessibleResource).toBe(true)
    expect(result.entries['project:database'].status).toBe('unknown')
  })

  it('reports partially inaccessible projects while still evaluating the rest', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      resourceAccess: 'project',
      projectRefs: [PROJECT.ref, 'gone-project-ref-123'],
      selection: { 'project:database': 'read' },
      permissions: v2(orgEntry(ORG.slug, 'readonly')),
    })
    expect(result.inaccessibleProjectRefs).toEqual(['gone-project-ref-123'])
    expect(result.hasNoAccessibleResource).toBe(false)
    expect(result.entries['project:database'].status).toBe('ok')
  })

  it('is unknown before any resource is selected', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      resourceAccess: 'project',
      organizationSlugs: [ORG.slug],
      projectRefs: [],
      selection: { 'project:database': 'readwrite' },
      permissions: v2(orgEntry(ORG.slug, 'readonly')),
    })
    expect(result.status).toBe('unknown')
    expect(result.exceedingEntryKeys).toEqual([])
  })

  it('never flags account-scoped tokens', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      resourceAccess: 'account',
      organizationSlugs: [],
      selection: { 'project:database': 'readwrite' },
      permissions: v2(orgEntry(ORG.slug, 'member')),
    })
    expect(result.exceedingEntryKeys).toEqual([])
    expect(result.entries['project:database'].status).toBe('ok')
  })
})
