import { describe, expect, test } from 'vitest'

import {
  getMockOAuthAppGrants,
  getMockOAuthAppsAuthorizeApproveResult,
  getMockOAuthAppsAuthorizeIdentity,
  getMockOAuthAppsAuthorizeOrganizationProjects,
  getMockOAuthAppsAuthorizeRequest,
  getMockOAuthAppsOverview,
  getMockOAuthBlockedApps,
  getMockOAuthOrgAppDetails,
  OAUTH_APPS_MOCK_SCENARIOS,
  READ_ONLY_ROLE,
  USE_MOCKS,
} from './mocks'
import { getFailedProjects, isRoleValidationFailure } from './types'

const NORTHWIND_SLUG = 'northwind-traders'
const TAILSPIN_SLUG = 'tailspin-toys'

const scenarios = Object.values(OAUTH_APPS_MOCK_SCENARIOS)

describe('oauth-apps mocks', () => {
  test('mocks are enabled outside production', () => {
    expect(USE_MOCKS).toBe(true)
  })

  test('every scenario resolves a request and an identity', () => {
    scenarios.forEach((scenario) => {
      expect(getMockOAuthAppsAuthorizeRequest(scenario)).toBeDefined()
      expect(getMockOAuthAppsAuthorizeIdentity(scenario).organizations.length).toBeGreaterThan(0)
    })
  })

  test('every organization row carries the member role for that org', () => {
    const identity = getMockOAuthAppsAuthorizeIdentity(OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper)

    identity.organizations.forEach((organization) => {
      expect(organization.default_role.name).toBeTruthy()
    })
  })

  test('every project carries a ref and a role', () => {
    const projects = getMockOAuthAppsAuthorizeOrganizationProjects(NORTHWIND_SLUG)

    expect(projects.length).toBeGreaterThan(0)
    projects.forEach((project) => {
      expect(project.ref).toBeTruthy()
      expect(project.name).toBeTruthy()
      expect(project.role.name).toBeTruthy()
    })
  })

  test('project roles are heterogeneous within one organization', () => {
    const projects = getMockOAuthAppsAuthorizeOrganizationProjects(NORTHWIND_SLUG)
    const distinctRoles = new Set(projects.map((project) => project.role.id))

    expect(distinctRoles.size).toBeGreaterThan(1)
  })

  test('both grant kinds have a fixture', () => {
    const kinds = new Set(
      scenarios.map((scenario) => getMockOAuthAppsAuthorizeRequest(scenario).grant_kind)
    )

    expect(kinds).toEqual(new Set(['organization_bound', 'member_bound']))
  })

  test('a member-bound app exists for every project scoping mode', () => {
    const modes = new Set(
      scenarios
        .map((scenario) => getMockOAuthAppsAuthorizeRequest(scenario))
        .filter((request) => request.grant_kind === 'member_bound')
        .map((request) => request.project_scoping_mode)
    )

    expect(modes).toEqual(new Set(['off', 'optional', 'required']))
  })

  test('a dynamic client has a fixture', () => {
    const dynamic = scenarios.filter(
      (scenario) => getMockOAuthAppsAuthorizeRequest(scenario).registration_type === 'dynamic'
    )

    expect(dynamic.length).toBeGreaterThan(0)
  })

  test('app_name mirrors the live name field', () => {
    scenarios.forEach((scenario) => {
      const request = getMockOAuthAppsAuthorizeRequest(scenario)
      expect(request.app_name).toBe(request.name)
    })
  })

  test('no fixture project is a branch project', () => {
    getMockOAuthAppsAuthorizeOrganizationProjects(NORTHWIND_SLUG).forEach((project) => {
      expect(project.name).not.toMatch(/branch/i)
    })
  })
})

describe('org app details fixtures', () => {
  test('an unknown pair degrades to an unblocked, grant-less default', () => {
    const details = getMockOAuthOrgAppDetails('not-an-org', 'not-an-app')

    expect(details.blocked_reason).toBeNull()
    expect(details.existing_grant).toBeNull()
    expect(details.organization_settings.require_project_scoping).toBe(false)
  })

  test('every blocked reason has a fixture', () => {
    expect(getMockOAuthOrgAppDetails('fabrikam-industries', 'vercel-org-wide').blocked_reason).toBe(
      'org_requires_project_scoping'
    )
    expect(getMockOAuthOrgAppDetails('litware-inc', 'vercel').blocked_reason).toBe(
      'app_blocked_for_organization'
    )
  })

  test('an org that requires project scoping does not block a project-scoped app', () => {
    const details = getMockOAuthOrgAppDetails('fabrikam-industries', 'vercel')

    expect(details.organization_settings.require_project_scoping).toBe(true)
    expect(details.blocked_reason).toBeNull()
  })

  test('the re-consent scenario carries an existing grant with a stale and a live ref', () => {
    const { app_id } = getMockOAuthAppsAuthorizeRequest(OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent)
    const grant = getMockOAuthOrgAppDetails(TAILSPIN_SLUG, app_id).existing_grant
    const liveRefs = getMockOAuthAppsAuthorizeOrganizationProjects(TAILSPIN_SLUG).map(
      (project) => project.ref
    )

    expect(grant).not.toBeNull()
    expect(grant!.approved_at).toBeTruthy()
    expect(grant!.project_refs.some((ref) => liveRefs.includes(ref))).toBe(true)
    expect(grant!.project_refs.some((ref) => !liveRefs.includes(ref))).toBe(true)
  })

  test('the existing grant scopes differ from the scopes the app requests today', () => {
    const request = getMockOAuthAppsAuthorizeRequest(OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent)
    const grant = getMockOAuthOrgAppDetails(TAILSPIN_SLUG, request.app_id).existing_grant
    const requestedScopes = request.scopes.flatMap((group) => group.scopes).sort()

    expect([...(grant?.approved_scopes ?? [])].sort()).not.toEqual(requestedScopes)
  })

  test('an existing grant without project refs has a fixture', () => {
    const { app_id } = getMockOAuthAppsAuthorizeRequest(
      OAUTH_APPS_MOCK_SCENARIOS.vercelReconsentAllProjects
    )

    expect(getMockOAuthOrgAppDetails(TAILSPIN_SLUG, app_id).existing_grant?.project_refs).toEqual(
      []
    )
  })
})

describe('post-submit role validation', () => {
  const approve = (authId: string, projectRefs: string[] | undefined) =>
    getMockOAuthAppsAuthorizeApproveResult(authId, { slug: NORTHWIND_SLUG, projectRefs })

  const readOnlyRefs = () =>
    getMockOAuthAppsAuthorizeOrganizationProjects(NORTHWIND_SLUG)
      .filter((project) => project.role.id === READ_ONLY_ROLE.id)
      .map((project) => project.ref)

  const writableRefs = () =>
    getMockOAuthAppsAuthorizeOrganizationProjects(NORTHWIND_SLUG)
      .filter((project) => project.role.id !== READ_ONLY_ROLE.id)
      .map((project) => project.ref)

  test('the fixture has both read-only and writable projects to validate against', () => {
    expect(readOnlyRefs().length).toBeGreaterThan(0)
    expect(writableRefs().length).toBeGreaterThan(0)
  })

  test('rejects read-only projects when write scopes are requested', () => {
    const result = approve(OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation, readOnlyRefs())

    if (!isRoleValidationFailure(result)) throw new Error('expected a role validation failure')

    expect(result.validation.scope_target).toBe('projects')
    const failures = getFailedProjects(result)
    expect(failures).toHaveLength(readOnlyRefs().length)
    failures.forEach((project) => {
      expect(project.ref).toBeTruthy()
      expect(project.name).toBeTruthy()
      expect(project.role.id).toBe(READ_ONLY_ROLE.id)
      expect(project.failed_scopes.length).toBeGreaterThan(0)
    })
  })

  test('every failed scope is one the app actually requested', () => {
    const result = approve(OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation, readOnlyRefs())
    const requestedScopes = getMockOAuthAppsAuthorizeRequest(
      OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation
    ).scopes.flatMap((group) => group.scopes)

    if (!isRoleValidationFailure(result)) throw new Error('expected a role validation failure')

    getFailedProjects(result).forEach((project) => {
      project.failed_scopes.forEach((scope) => expect(requestedScopes).toContain(scope))
    })
  })

  test('rejects only the read-only refs out of a mixed selection', () => {
    const result = approve(OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation, [
      ...readOnlyRefs(),
      ...writableRefs(),
    ])

    if (!isRoleValidationFailure(result)) throw new Error('expected a role validation failure')

    expect(
      getFailedProjects(result)
        .map((project) => project.ref)
        .sort()
    ).toEqual(readOnlyRefs().sort())
  })

  test('approves a selection of writable projects', () => {
    expect(
      isRoleValidationFailure(
        approve(OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation, writableRefs())
      )
    ).toBe(false)
  })

  test('scenarios outside the role-validated set approve read-only projects', () => {
    expect(
      isRoleValidationFailure(approve(OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper, readOnlyRefs()))
    ).toBe(false)
  })

  test('an org-wide approval by a read-only member fails on the organization branch', () => {
    const result = approve(OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects, undefined)

    if (!isRoleValidationFailure(result)) throw new Error('expected a role validation failure')

    expect(result.validation.scope_target).toBe('organization')
    if (result.validation.scope_target !== 'organization') return
    expect(result.validation.role.id).toBe(READ_ONLY_ROLE.id)
    expect(result.validation.failed_scopes.length).toBeGreaterThan(0)
    expect(getFailedProjects(result)).toEqual([])
  })

  test('an org-wide approval by a writable member succeeds', () => {
    const result = getMockOAuthAppsAuthorizeApproveResult(
      OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects,
      { slug: 'fabrikam-industries', projectRefs: undefined }
    )

    expect(isRoleValidationFailure(result)).toBe(false)
  })
})

describe('authorized apps overview fixtures', () => {
  test('both statuses the table renders have a fixture', () => {
    const statuses = new Set(getMockOAuthAppsOverview().data.map((app) => app.status))

    expect(statuses).toEqual(new Set(['active', 'legacy']))
  })

  test('the legacy app carries an organization grant', () => {
    const legacy = getMockOAuthAppsOverview().data.find((app) => app.status === 'legacy')

    expect(legacy?.org_grant).not.toBeNull()
  })

  test('a singular and a plural grant count both have a fixture', () => {
    const counts = getMockOAuthAppsOverview().data.map((app) => app.member_grant_count)

    expect(counts).toContain(1)
    expect(counts.some((count) => count > 1)).toBe(true)
  })

  test('app ids are unique so the table can key rows on them', () => {
    const apps = getMockOAuthAppsOverview().data

    expect(new Set(apps.map((app) => app.id)).size).toBe(apps.length)
  })
})

describe('blocked apps fixtures', () => {
  test('lists at least one blocked app with who blocked it', () => {
    const blocked = getMockOAuthBlockedApps().data

    expect(blocked.length).toBeGreaterThan(0)
    blocked.forEach((app) => {
      expect(app.blocked_at).toBeTruthy()
      expect(app.blocked_by.email).toBeTruthy()
    })
  })
})

describe('app grants fixtures', () => {
  test('every app in the overview resolves a grant list', () => {
    getMockOAuthAppsOverview().data.forEach((app) => {
      expect(Array.isArray(getMockOAuthAppGrants(app.id).data)).toBe(true)
    })
  })

  test('an unknown app id degrades to an empty page', () => {
    expect(getMockOAuthAppGrants('not-an-app').data).toEqual([])
  })

  test('an organization-bound grant has no user and no project refs', () => {
    const grants = getMockOAuthAppsOverview().data.flatMap(
      (app) => getMockOAuthAppGrants(app.id).data
    )
    const orgBound = grants.filter((grant) => grant.kind === 'organization_bound')

    expect(orgBound.length).toBeGreaterThan(0)
    orgBound.forEach((grant) => {
      expect(grant.user).toBeNull()
      expect(grant.project_refs).toBeNull()
    })
  })

  test('member-bound grants carry a user', () => {
    const grants = getMockOAuthAppsOverview().data.flatMap(
      (app) => getMockOAuthAppGrants(app.id).data
    )
    const memberBound = grants.filter((grant) => grant.kind === 'member_bound')

    expect(memberBound.length).toBeGreaterThan(0)
    memberBound.forEach((grant) => {
      expect(grant.user?.email).toBeTruthy()
    })
  })
})
