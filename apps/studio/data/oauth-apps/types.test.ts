import { describe, expect, test } from 'vitest'

import { DEVELOPER_ROLE, READ_ONLY_ROLE } from './mocks'
import type { OAuthAppsAuthorizeOrganizationProject, OAuthExistingGrant } from './types'
import { getFailedProjects, getPreselectedProjectRefs, isRoleValidationFailure } from './types'

const project = (ref: string): OAuthAppsAuthorizeOrganizationProject => ({
  ref,
  name: ref,
  role: DEVELOPER_ROLE,
})

const grant = (refs: string[]): OAuthExistingGrant => ({
  approved_scopes: ['projects:read'],
  project_refs: refs,
  approved_at: '2026-08-14T09:12:00.000Z',
})

describe('getPreselectedProjectRefs', () => {
  const live = ['alpha', 'bravo', 'charlie', 'delta'].map(project)

  test('preselects the project_ref query param when it resolves against live projects', () => {
    expect(
      getPreselectedProjectRefs({ existingGrant: null, projectRef: 'alpha', liveProjects: live })
    ).toEqual(['alpha'])
  })

  test('drops a project_ref that does not resolve against live projects', () => {
    expect(
      getPreselectedProjectRefs({ existingGrant: null, projectRef: 'ghost', liveProjects: live })
    ).toEqual([])
  })

  test('returns nothing when there is neither a grant nor a project_ref', () => {
    expect(
      getPreselectedProjectRefs({ existingGrant: null, projectRef: null, liveProjects: live })
    ).toEqual([])
  })

  test('existing-grant refs win over the project_ref query param', () => {
    expect(
      getPreselectedProjectRefs({
        existingGrant: grant(['charlie', 'delta']),
        projectRef: 'alpha',
        liveProjects: live,
      })
    ).toEqual(['charlie', 'delta'])
  })

  test('filters stale refs out of the existing grant', () => {
    expect(
      getPreselectedProjectRefs({
        existingGrant: grant(['alpha', 'ghost']),
        projectRef: null,
        liveProjects: live,
      })
    ).toEqual(['alpha'])
  })

  test('falls back to the project_ref when the existing grant carries no refs', () => {
    expect(
      getPreselectedProjectRefs({
        existingGrant: grant([]),
        projectRef: 'bravo',
        liveProjects: live,
      })
    ).toEqual(['bravo'])
  })

  test('does not cap the number of preselected refs', () => {
    const manyProjects = Array.from({ length: 15 }, (_, index) => project(`ref-${index}`))
    const manyRefs = manyProjects.map((entry) => entry.ref)

    expect(
      getPreselectedProjectRefs({
        existingGrant: grant(manyRefs),
        projectRef: null,
        liveProjects: manyProjects,
      })
    ).toEqual(manyRefs)
  })

  test('returns nothing when there are no live projects', () => {
    expect(
      getPreselectedProjectRefs({
        existingGrant: grant(['alpha']),
        projectRef: 'alpha',
        liveProjects: [],
      })
    ).toEqual([])
  })
})

describe('isRoleValidationFailure', () => {
  test('recognises a role validation failure', () => {
    expect(
      isRoleValidationFailure({
        error_code: 'role_validation_failed',
        message: 'nope',
        validation: { scope_target: 'organization', role: READ_ONLY_ROLE },
      })
    ).toBe(true)
  })

  test('treats a redirect as a success', () => {
    expect(isRoleValidationFailure({ url: 'https://vercel.com/callback?code=abc' })).toBe(false)
  })
})

describe('getFailedProjects', () => {
  test('returns the failures of a projects-level failure', () => {
    const failure = {
      ref: 'alpha',
      name: 'alpha',
      role: READ_ONLY_ROLE,
      failed_scopes: ['database:write' as const],
    }

    expect(
      getFailedProjects({
        error_code: 'role_validation_failed',
        message: 'nope',
        validation: { scope_target: 'projects', failures: [failure] },
      })
    ).toEqual([failure])
  })

  test('is empty for an organization-level failure', () => {
    expect(
      getFailedProjects({
        error_code: 'role_validation_failed',
        message: 'nope',
        validation: { scope_target: 'organization', role: READ_ONLY_ROLE },
      })
    ).toEqual([])
  })

  test('is empty when there is no failure', () => {
    expect(getFailedProjects(null)).toEqual([])
    expect(getFailedProjects(undefined)).toEqual([])
  })
})
