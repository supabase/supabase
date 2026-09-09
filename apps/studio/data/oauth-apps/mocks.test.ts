import { describe, expect, test } from 'vitest'

import {
  getMockOAuthAppsAuthorizeApproveResult,
  getMockOAuthAppsAuthorizeIdentity,
  getMockOAuthAppsAuthorizeOrganizationProjects,
  getMockOAuthAppsAuthorizeRequest,
  OAUTH_APPS_MOCK_SCENARIOS,
  USE_MOCKS,
} from './mocks'
import { getFailedProjects, isRoleValidationFailure } from './types'

const NORTHWIND_SLUG = 'northwind-traders'

describe('oauth-apps mocks', () => {
  test('mocks are enabled outside production', () => {
    expect(USE_MOCKS).toBe(true)
  })

  test('every organization row carries the member role for that org', () => {
    const identity = getMockOAuthAppsAuthorizeIdentity(OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper)

    expect(identity.organizations.length).toBeGreaterThan(0)
    identity.organizations.forEach((organization) => {
      expect(organization.default_role).toBeTruthy()
    })
  })

  test('every project carries a ref and a role', () => {
    const projects = getMockOAuthAppsAuthorizeOrganizationProjects(NORTHWIND_SLUG)

    expect(projects.length).toBeGreaterThan(0)
    projects.forEach((project) => {
      expect(project.ref).toBeTruthy()
      expect(project.name).toBeTruthy()
      expect(project.role).toBeTruthy()
    })
  })

  test('project roles are heterogeneous within one organization', () => {
    const projects = getMockOAuthAppsAuthorizeOrganizationProjects(NORTHWIND_SLUG)
    const distinctRoles = new Set(projects.map((project) => project.role))

    expect(distinctRoles.size).toBeGreaterThan(1)
  })

  test('a project role can differ from the org-level default_role', () => {
    const identity = getMockOAuthAppsAuthorizeIdentity(OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper)
    const organization = identity.organizations.find((org) => org.slug === NORTHWIND_SLUG)
    const projects = getMockOAuthAppsAuthorizeOrganizationProjects(NORTHWIND_SLUG)

    expect(organization).toBeDefined()
    expect(projects.some((project) => project.role !== organization!.default_role)).toBe(true)
  })

  test('the default scenario has no existing grant', () => {
    const request = getMockOAuthAppsAuthorizeRequest(OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper)

    expect(request.existing_grant).toBeNull()
  })

  test('the re-consent scenario carries a populated existing grant', () => {
    const request = getMockOAuthAppsAuthorizeRequest(OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent)

    expect(request.existing_grant).not.toBeNull()
    expect(request.existing_grant?.project_refs.length).toBeGreaterThan(0)
    expect(request.existing_grant?.created_at).toBeTruthy()
    expect(request.existing_grant?.updated_at).toBeTruthy()
  })

  test('the existing grant declares what it is bound to', () => {
    const request = getMockOAuthAppsAuthorizeRequest(OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent)

    expect(request.existing_grant?.kind).toBe('user_bound')
  })

  test('every request carries the grant config the consent flow reads', () => {
    Object.values(OAUTH_APPS_MOCK_SCENARIOS).forEach((scenario) => {
      const { grant_config: grantConfig } = getMockOAuthAppsAuthorizeRequest(scenario)

      expect(['user_bound', 'organization_bound']).toContain(grantConfig.grant_kind)
      expect(typeof grantConfig.allow_project_scoping).toBe('boolean')
    })
  })

  test('both grant kinds have a fixture', () => {
    const kinds = new Set(
      Object.values(OAUTH_APPS_MOCK_SCENARIOS).map(
        (scenario) => getMockOAuthAppsAuthorizeRequest(scenario).grant_config.grant_kind
      )
    )

    expect(kinds).toEqual(new Set(['user_bound', 'organization_bound']))
  })

  test('every fixture allows project scoping while nothing suppresses the picker', () => {
    Object.values(OAUTH_APPS_MOCK_SCENARIOS).forEach((scenario) => {
      expect(getMockOAuthAppsAuthorizeRequest(scenario).grant_config.allow_project_scoping).toBe(
        true
      )
    })
  })

  test('the existing grant holds a stale ref that does not resolve against live projects', () => {
    const request = getMockOAuthAppsAuthorizeRequest(OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent)
    const liveRefs = getMockOAuthAppsAuthorizeOrganizationProjects(NORTHWIND_SLUG).map(
      (project) => project.ref
    )
    const grantedRefs = request.existing_grant?.project_refs ?? []

    expect(grantedRefs.some((ref) => !liveRefs.includes(ref))).toBe(true)
    expect(grantedRefs.some((ref) => liveRefs.includes(ref))).toBe(true)
  })

  test('the existing grant scopes differ from the scopes the app requests today', () => {
    const request = getMockOAuthAppsAuthorizeRequest(OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent)
    const requestedScopes = request.scope_groups.flatMap((group) => group.scopes).sort()
    const approvedScopes = [...(request.existing_grant?.approved_scopes ?? [])].sort()

    expect(approvedScopes).not.toEqual(requestedScopes)
  })

  test('no fixture project is a branch project', () => {
    const projects = getMockOAuthAppsAuthorizeOrganizationProjects(NORTHWIND_SLUG)

    projects.forEach((project) => {
      expect(project.name).not.toMatch(/branch/i)
    })
  })

  describe('post-submit role validation', () => {
    const approve = (authId: string, projectRefs: string[]) =>
      getMockOAuthAppsAuthorizeApproveResult(authId, { slug: NORTHWIND_SLUG, projectRefs })

    const readOnlyRefs = () =>
      getMockOAuthAppsAuthorizeOrganizationProjects(NORTHWIND_SLUG)
        .filter((project) => project.role === 'read_only')
        .map((project) => project.ref)

    const writableRefs = () =>
      getMockOAuthAppsAuthorizeOrganizationProjects(NORTHWIND_SLUG)
        .filter((project) => project.role !== 'read_only')
        .map((project) => project.ref)

    test('the fixture has both read-only and writable projects to validate against', () => {
      expect(readOnlyRefs().length).toBeGreaterThan(0)
      expect(writableRefs().length).toBeGreaterThan(0)
    })

    test('rejects read-only projects when write scopes are requested', () => {
      const result = approve(OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation, readOnlyRefs())

      expect(isRoleValidationFailure(result)).toBe(true)
    })

    test('reports every rejected project with its ref, name and role', () => {
      const result = approve(OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation, readOnlyRefs())

      if (!isRoleValidationFailure(result)) throw new Error('expected a role validation failure')

      const failures = getFailedProjects(result)

      expect(failures).toHaveLength(readOnlyRefs().length)
      failures.forEach((project) => {
        expect(project.ref).toBeTruthy()
        expect(project.name).toBeTruthy()
        expect(project.role).toBe('read_only')
        expect(project.failed_scopes.length).toBeGreaterThan(0)
      })
    })

    test('targets the projects branch, not the organization branch', () => {
      const result = approve(OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation, readOnlyRefs())

      if (!isRoleValidationFailure(result)) throw new Error('expected a role validation failure')

      expect(result.validation.scope_target).toBe('projects')
    })

    test('every failed scope is one the app actually requested', () => {
      const result = approve(OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation, readOnlyRefs())
      const requestedScopes = getMockOAuthAppsAuthorizeRequest(
        OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation
      ).scope_groups.flatMap((group) => group.scopes)

      if (!isRoleValidationFailure(result)) throw new Error('expected a role validation failure')

      getFailedProjects(result).forEach((project) => {
        project.failed_scopes.forEach((scope) => {
          expect(requestedScopes).toContain(scope)
        })
      })
    })

    test('getFailedProjects is empty for an organization-level failure', () => {
      expect(
        getFailedProjects({
          error_code: 'role_validation_failed',
          message: 'Your organization role cannot grant write access.',
          validation: { scope_target: 'organization', role: 'read_only', failed_scopes: ['logs'] },
        })
      ).toEqual([])
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
      const result = approve(OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation, writableRefs())

      expect(isRoleValidationFailure(result)).toBe(false)
    })

    test('scenarios outside the role-validated set approve read-only projects', () => {
      const result = approve(OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper, readOnlyRefs())

      expect(isRoleValidationFailure(result)).toBe(false)
    })
  })
})
