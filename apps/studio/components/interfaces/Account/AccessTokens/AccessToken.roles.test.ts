import { permissions } from '@supabase/shared-types'
import { describe, expect, it } from 'vitest'

import {
  administratorRows,
  developerRows,
  memberRows,
  ownerRows,
  readonlyRows,
  permissionRow as row,
} from './AccessToken.fixtures'
import { getCatalogEntry, type PermissionSelection } from './AccessToken.permissions'
import {
  applySelectionToRoleContext,
  computeTokenRoleContext,
  estimateRoleLevel,
  FGA_SCOPE_MINIMUM_ROLE,
  getIsProjectScopedOnly,
  requiredRoleForEntry,
  type TokenRoleContextArgs,
} from './AccessToken.roles'

type EvaluateTokenAccessArgs = TokenRoleContextArgs & { selection: PermissionSelection }

/**
 * Composes the two production entry points the way a consumer should: resolve the (expensive)
 * role context once from its inputs, then apply the (cheap) selection to it on every change.
 */
const evaluateTokenAccess = ({ selection, ...contextArgs }: EvaluateTokenAccessArgs) =>
  applySelectionToRoleContext(computeTokenRoleContext(contextArgs), selection)

const ORG = { slug: 'acme' }
const OTHER_ORG = { slug: 'globex' }
const PROJECT = { ref: 'abcdefghij1234567890', organization_slug: 'acme' }
const OTHER_PROJECT = { ref: 'klmnopqrst1234567890', organization_slug: 'acme' }

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
    // If this fails, a scope was added/removed upstream: re-transcribe the role unions from the
    // OpenFGA model (platform: openfga/model/supabase.fga) into FGA_SCOPE_MINIMUM_ROLE.
    expect(mappedIds).toEqual(publishedIds)
  })
})

describe('estimateRoleLevel', () => {
  it('identifies each base role from its permission rows', () => {
    expect(estimateRoleLevel(ownerRows(ORG.slug), ORG.slug)).toBe('owner')
    expect(estimateRoleLevel(administratorRows(ORG.slug), ORG.slug)).toBe('administrator')
    expect(estimateRoleLevel(developerRows(ORG.slug), ORG.slug)).toBe('developer')
    expect(estimateRoleLevel(readonlyRows(ORG.slug), ORG.slug)).toBe('readonly')
    expect(estimateRoleLevel(memberRows(ORG.slug), ORG.slug)).toBe('member')
    expect(estimateRoleLevel([], ORG.slug)).toBe('none')
  })

  it('scopes the estimate to the queried organization', () => {
    const rows = [...ownerRows(ORG.slug), ...readonlyRows(OTHER_ORG.slug)]
    expect(estimateRoleLevel(rows, ORG.slug)).toBe('owner')
    expect(estimateRoleLevel(rows, OTHER_ORG.slug)).toBe('readonly')
  })

  it('resolves project-scoped roles only for their projects', () => {
    const rows = developerRows(ORG.slug, [PROJECT.ref])
    expect(estimateRoleLevel(rows, ORG.slug, PROJECT.ref)).toBe('developer')
    // Org-level (no project) the same user is only a member.
    expect(estimateRoleLevel(rows, ORG.slug)).toBe('member')
  })
})

describe('project-scoped membership helpers', () => {
  it('detects project-scoped-only membership', () => {
    expect(getIsProjectScopedOnly(developerRows(ORG.slug, [PROJECT.ref]), ORG.slug)).toBe(true)
    expect(getIsProjectScopedOnly(developerRows(ORG.slug), ORG.slug)).toBe(false)
    expect(getIsProjectScopedOnly([], ORG.slug)).toBe(false)
  })

  it('treats project_refs: null rows as org-wide, in any row order', () => {
    // The real /platform/profile/permissions response serializes the view-synthesized
    // Administrator/Owner rows (auth.subject_roles, user_invites) with project_refs: null, and
    // the response carries no ordering guarantee.
    const nullRow = row(ORG.slug, ['write:Create', 'write:Delete'], ['auth.subject_roles'])
    nullRow.project_refs = null

    expect(getIsProjectScopedOnly([nullRow, ...administratorRows(ORG.slug)], ORG.slug)).toBe(false)
    expect(getIsProjectScopedOnly([...administratorRows(ORG.slug), nullRow], ORG.slug)).toBe(false)
    // A lone null row is org-wide too, not project-scoped.
    expect(getIsProjectScopedOnly([nullRow], ORG.slug)).toBe(false)
  })
})

describe('requiredRoleForEntry', () => {
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
    // branching_production_write is developer, but create/delete require administrator.
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

    // Unknown path (permissions still loading)
    expect(
      evaluateTokenAccess({ ...baseArgs, selection, permissions: undefined }).effectiveSelection
    ).toEqual(expected)
    // Account path (selection tracks the owner by definition)
    expect(
      evaluateTokenAccess({
        ...baseArgs,
        selection,
        resourceAccess: 'account',
        organizationSlugs: [],
        permissions: ownerRows(ORG.slug),
      }).effectiveSelection
    ).toEqual(expected)
    // Evaluated path
    expect(
      evaluateTokenAccess({ ...baseArgs, selection, permissions: ownerRows(ORG.slug) })
        .effectiveSelection
    ).toEqual(expected)
  })

  it('passes everything the user’s role covers', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      selection: { 'project:database': 'readwrite', 'organization:members': 'readwrite' },
      permissions: administratorRows(ORG.slug),
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
        'project:database': 'readwrite', // requires developer
        'project:advisors': 'read', // requires readonly
      },
      permissions: readonlyRows(ORG.slug),
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
      selection: { 'project:api_gateway_keys': 'read' }, // read requires developer
      permissions: readonlyRows(ORG.slug),
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
      permissions: [...ownerRows(ORG.slug), ...readonlyRows(OTHER_ORG.slug)],
    })
    expect(result.exceedingEntryKeys).toEqual(['project:database'])
    // Only the org where the role is insufficient is called out.
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
      permissions: developerRows(ORG.slug, [PROJECT.ref]),
    })
    // Developer on the bound project: database readwrite is fine.
    expect(result.entries['project:database'].status).toBe('ok')
    // Org-level scopes can never be exercised through a project-scoped token — platform rejects
    // them outright regardless of the owner's role, so no role evaluation applies.
    expect(result.entries['organization:members'].status).toBe('unavailable-for-scope')
    expect(result.entries['organization:members'].effectiveMode).toBe('none')
    expect(result.entries['organization:members'].failingResources).toEqual([])
    expect(result.unavailableEntryKeys).toEqual(['organization:members'])
    expect(result.exceedingEntryKeys).toEqual([])
    expect(result.effectiveSelection).toEqual({ 'project:database': 'readwrite' })
  })

  it('honors project-scoped roles for project entries on organization-scoped tokens', () => {
    // An org member invited as Developer to one project: platform checks the owner's permission
    // against the project object, so an org-bound token really can database_write there. Only the
    // projects where the role is insufficient may be reported as failing.
    const result = evaluateTokenAccess({
      ...baseArgs,
      selection: { 'project:database': 'readwrite' },
      permissions: developerRows(ORG.slug, [PROJECT.ref]),
      organizations: [ORG],
      projects: [PROJECT, OTHER_PROJECT],
    })
    expect(result.entries['project:database'].status).toBe('exceeds-role')
    expect(result.entries['project:database'].failingResources).toEqual([
      { type: 'project', id: OTHER_PROJECT.ref, label: OTHER_PROJECT.ref, role: 'member' },
    ])

    // Developer on every project of the org: nothing fails, despite the org role being member.
    const allProjects = evaluateTokenAccess({
      ...baseArgs,
      selection: { 'project:database': 'readwrite' },
      permissions: developerRows(ORG.slug, [PROJECT.ref, OTHER_PROJECT.ref]),
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
      permissions: readonlyRows(ORG.slug),
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
    // Platform's getChecks throws for project-scoped tokens on organization endpoints before
    // any FGA evaluation, so even an org owner's project token can never call them.
    const result = evaluateTokenAccess({
      ...baseArgs,
      resourceAccess: 'project',
      projectRefs: [PROJECT.ref],
      selection: { 'organization:members': 'readwrite', 'user:organizations': 'read' },
      permissions: ownerRows(ORG.slug),
    })
    expect(result.entries['organization:members'].status).toBe('unavailable-for-scope')
    // User-level scopes are granted by the token grant alone (token -> scope tuple checks), so
    // they stay exercisable for any resource binding.
    expect(result.entries['user:organizations'].status).toBe('ok')
    expect(result.effectiveSelection).toEqual({ 'user:organizations': 'read' })
  })

  it('explains org-level failures for members invited only to a project', () => {
    // Read-only on one project, selecting Organization Settings read-write (requires Owner) on
    // an organization-scoped token — the failure carries their real per-project role so the UI
    // can explain the distinction.
    const result = evaluateTokenAccess({
      ...baseArgs,
      resourceAccess: 'organization',
      selection: { 'organization:admin': 'readwrite' },
      permissions: readonlyRows(ORG.slug, [PROJECT.ref]),
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

  it('attaches project-scoped detail even when stray org-level rows exist', () => {
    // Real permissions data can include org-level rows (e.g. restrictive rules) alongside a
    // project-scoped role; the per-project detail must still resolve.
    const strayOrgRow = row(ORG.slug, ['read:Read'], ['notifications'])
    const result = evaluateTokenAccess({
      ...baseArgs,
      resourceAccess: 'organization',
      selection: { 'organization:admin': 'readwrite' },
      permissions: [...readonlyRows(ORG.slug, [PROJECT.ref]), strayOrgRow],
      projects: [{ ...PROJECT, name: 'Acme production' }],
    })
    expect(result.entries['organization:admin'].failingResources).toEqual([
      {
        type: 'organization',
        id: ORG.slug,
        label: ORG.slug,
        role: 'member',
        projectScopedRoles: [{ label: 'Acme production', role: 'readonly' }],
      },
    ])
  })

  it('does not attach project-scoped detail for organization-wide members', () => {
    const result = evaluateTokenAccess({
      ...baseArgs,
      selection: { 'organization:admin': 'readwrite' },
      permissions: developerRows(ORG.slug),
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
      permissions: readonlyRows(ORG.slug),
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
      permissions: readonlyRows(ORG.slug),
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
      permissions: readonlyRows(ORG.slug),
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
      permissions: readonlyRows(ORG.slug),
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
      permissions: memberRows(ORG.slug),
    })
    expect(result.exceedingEntryKeys).toEqual([])
    expect(result.entries['project:database'].status).toBe('ok')
  })
})
