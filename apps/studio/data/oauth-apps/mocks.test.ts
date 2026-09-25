import { describe, expect, test } from 'vitest'

import {
  getMockOAuthAppGrants,
  getMockOAuthApprovals,
  getMockOAuthAppsAuthorizeApproveResult,
  getMockOAuthAppsAuthorizeIdentity,
  getMockOAuthAppsAuthorizeOrganizationProjects,
  getMockOAuthAppsAuthorizeRequest,
  getMockOAuthAppsPreflightValidation,
  getMockOAuthOrgAppDetails,
  getMockOAuthOwnGrants,
  OAUTH_APPS_MOCK_SCENARIOS,
  READ_ONLY_ROLE,
  USE_MOCKS,
} from './mocks'
import { getFailedProjects, isPreflightValidationFailure, isRoleValidationFailure } from './types'

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

  test('a member-bound app exists both with and without project scoping', () => {
    const modes = new Set(
      scenarios
        .map((scenario) => getMockOAuthAppsAuthorizeRequest(scenario))
        .filter((request) => request.grant_kind === 'member_bound')
        .map((request) => request.project_scoping_mode)
    )

    expect(modes).toEqual(new Set([true, false]))
  })

  test('a DCR-registered app is forced org-bound and unscoped', () => {
    const dynamic = getMockOAuthAppsAuthorizeRequest(OAUTH_APPS_MOCK_SCENARIOS.dynamicMcpClient)

    expect(dynamic.registration_type).toBe('dynamic')
    expect(dynamic.grant_kind).toBe('organization_bound')
    expect(dynamic.project_scoping_mode).toBe(false)
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
  test('an unknown pair degrades to a grant-less default', () => {
    expect(getMockOAuthOrgAppDetails('not-an-org', 'not-an-app').existing_grant).toBeNull()
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

    expect([...(grant?.approved_scopes ?? [])].sort()).not.toEqual([...request.scopes].sort())
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

describe('preflight validation fixtures', () => {
  test('an unknown org or app degrades to success', () => {
    expect(
      isPreflightValidationFailure(getMockOAuthAppsPreflightValidation('not-an-org', 'vercel'))
    ).toBe(false)
    expect(
      isPreflightValidationFailure(
        getMockOAuthAppsPreflightValidation(NORTHWIND_SLUG, 'not-an-app')
      )
    ).toBe(false)
  })

  test('an org-bound app fails the organization branch for a non-admin', () => {
    const result = getMockOAuthAppsPreflightValidation(NORTHWIND_SLUG, 'kemal-bot')

    if (!isPreflightValidationFailure(result)) throw new Error('expected a preflight failure')
    expect(result.validation.scope_target).toBe('organization')
    if (result.validation.scope_target !== 'organization') return
    expect(result.validation.role.id).toBe(READ_ONLY_ROLE.id)
    expect('failed_scopes' in result.validation).toBe(false)
  })

  test('an org-bound app passes the organization branch for an admin', () => {
    const result = getMockOAuthAppsPreflightValidation(TAILSPIN_SLUG, 'kemal-bot')

    expect(isPreflightValidationFailure(result)).toBe(false)
  })

  test('a member-bound app fails the all-projects branch for a read-only member', () => {
    const result = getMockOAuthAppsPreflightValidation(NORTHWIND_SLUG, 'vercel')

    if (!isPreflightValidationFailure(result)) throw new Error('expected a preflight failure')
    expect(result.validation.scope_target).toBe('all_projects')
    if (result.validation.scope_target !== 'all_projects') return
    expect(result.validation.role.id).toBe(READ_ONLY_ROLE.id)
    expect(result.validation.failed_scopes.length).toBeGreaterThan(0)
  })

  test('a member-bound app passes the all-projects branch for an admin', () => {
    const result = getMockOAuthAppsPreflightValidation(TAILSPIN_SLUG, 'vercel')

    expect(isPreflightValidationFailure(result)).toBe(false)
  })

  test('preflight never returns a project-level failure', () => {
    const result = getMockOAuthAppsPreflightValidation(NORTHWIND_SLUG, 'vercel')

    if (!isPreflightValidationFailure(result)) throw new Error('expected a preflight failure')
    expect(result.validation.scope_target).not.toBe('projects')
  })
})

describe('post-submit role validation', () => {
  const approve = (authId: string, slug: string, projectRefs: string[] | undefined) =>
    getMockOAuthAppsAuthorizeApproveResult(authId, { slug, projectRefs })

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
    const result = approve(
      OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation,
      NORTHWIND_SLUG,
      readOnlyRefs()
    )

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
    const result = approve(
      OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation,
      NORTHWIND_SLUG,
      readOnlyRefs()
    )
    const requestedScopes = getMockOAuthAppsAuthorizeRequest(
      OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation
    ).scopes

    if (!isRoleValidationFailure(result)) throw new Error('expected a role validation failure')

    getFailedProjects(result).forEach((project) => {
      project.failed_scopes.forEach((scope) => expect(requestedScopes).toContain(scope))
    })
  })

  test('rejects only the read-only refs out of a mixed selection', () => {
    const result = approve(OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation, NORTHWIND_SLUG, [
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
        approve(OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation, NORTHWIND_SLUG, writableRefs())
      )
    ).toBe(false)
  })

  test('scenarios outside the role-validated set approve read-only projects', () => {
    expect(
      isRoleValidationFailure(
        approve(OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper, NORTHWIND_SLUG, readOnlyRefs())
      )
    ).toBe(false)
  })

  test('a member-bound, all-projects approval by a read-only member fails on the all_projects branch', () => {
    const result = approve(OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects, NORTHWIND_SLUG, undefined)

    if (!isRoleValidationFailure(result)) throw new Error('expected a role validation failure')

    expect(result.validation.scope_target).toBe('all_projects')
    if (result.validation.scope_target !== 'all_projects') return
    expect(result.validation.role.id).toBe(READ_ONLY_ROLE.id)
    expect(result.validation.failed_scopes.length).toBeGreaterThan(0)
    expect(getFailedProjects(result)).toEqual([])
  })

  test('a member-bound, all-projects approval by a writable member succeeds', () => {
    const result = approve(
      OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects,
      'fabrikam-industries',
      undefined
    )

    expect(isRoleValidationFailure(result)).toBe(false)
  })

  test('an org-bound approval by a non-admin fails on the organization branch, without failed_scopes', () => {
    const result = approve(OAUTH_APPS_MOCK_SCENARIOS.kemalBotOrgWide, NORTHWIND_SLUG, undefined)

    if (!isRoleValidationFailure(result)) throw new Error('expected a role validation failure')

    expect(result.validation.scope_target).toBe('organization')
    if (result.validation.scope_target !== 'organization') return
    expect(result.validation.role.name).toBe('Developer')
    expect('failed_scopes' in result.validation).toBe(false)
  })

  test('an org-bound approval by an admin succeeds', () => {
    const result = approve(
      OAUTH_APPS_MOCK_SCENARIOS.kemalBotOrgWide,
      'fabrikam-industries',
      undefined
    )

    expect(isRoleValidationFailure(result)).toBe(false)
  })
})

describe('authorized apps overview fixtures', () => {
  test('an app with an organization grant has a fixture', () => {
    const withOrgGrant = getMockOAuthApprovals().data.find((app) => app.org_grant !== null)

    expect(withOrgGrant).toBeDefined()
  })

  test('app ids are unique so the table can key rows on them', () => {
    const apps = getMockOAuthApprovals().data

    expect(new Set(apps.map((app) => app.id)).size).toBe(apps.length)
  })
})

describe('app grants fixtures', () => {
  test('every app in the overview resolves a grant list', () => {
    getMockOAuthApprovals().data.forEach((app) => {
      expect(Array.isArray(getMockOAuthAppGrants(app.id).data)).toBe(true)
    })
  })

  test('an unknown app id degrades to an empty page', () => {
    expect(getMockOAuthAppGrants('not-an-app').data).toEqual([])
  })

  test('an organization-bound grant has no user and no projects', () => {
    const grants = getMockOAuthApprovals().data.flatMap((app) => getMockOAuthAppGrants(app.id).data)
    const orgBound = grants.filter((grant) => grant.kind === 'organization_bound')

    expect(orgBound.length).toBeGreaterThan(0)
    orgBound.forEach((grant) => {
      expect(grant.user).toBeNull()
      expect(grant.projects).toBeNull()
    })
  })

  test('member-bound grants carry a user and hydrated projects', () => {
    const grants = getMockOAuthApprovals().data.flatMap((app) => getMockOAuthAppGrants(app.id).data)
    const memberBound = grants.filter((grant) => grant.kind === 'member_bound')

    expect(memberBound.length).toBeGreaterThan(0)
    memberBound.forEach((grant) => {
      expect(grant.user?.email).toBeTruthy()
      expect(grant.projects?.length).toBeGreaterThan(0)
      grant.projects?.forEach((project) => {
        expect(project.ref).toBeTruthy()
        expect(project.name).toBeTruthy()
      })
    })
  })
})

describe('own grants fixtures', () => {
  test("lists at least one grant across the member's orgs", () => {
    const grants = getMockOAuthOwnGrants().data

    expect(grants.length).toBeGreaterThan(0)
    grants.forEach((grant) => {
      expect(grant.app.name).toBeTruthy()
      expect(grant.organization.slug).toBeTruthy()
      expect(grant.approved_scopes.length).toBeGreaterThan(0)
      grant.projects?.forEach((project) => {
        expect(project.ref).toBeTruthy()
        expect(project.name).toBeTruthy()
      })
    })
  })
})
