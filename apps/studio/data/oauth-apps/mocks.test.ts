import { describe, expect, test } from 'vitest'

import {
  getMockOAuthAppsAuthorizeIdentity,
  getMockOAuthAppsAuthorizeOrganizationProjects,
  getMockOAuthAppsAuthorizeRequest,
  OAUTH_APPS_MOCK_SCENARIOS,
  USE_MOCKS,
} from './mocks'

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

    expect(projects.some((project) => project.role !== organization?.default_role)).toBe(true)
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
})
