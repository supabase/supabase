import { describe, expect, test } from 'vitest'

import type {
  OAuthAppGrantConfig,
  OAuthAppsAuthorizeOrganizationProject,
  OAuthExistingGrant,
} from './types'
import { getOAuthConsentModel, getPreselectedProjectRefs, getScopedProjectRefs } from './types'

const config = (overrides: Partial<OAuthAppGrantConfig> = {}): OAuthAppGrantConfig => ({
  bind_to_authorizing_user: false,
  project_selection: 'off',
  is_dynamic_client: false,
  ...overrides,
})

describe('getOAuthConsentModel', () => {
  test.each([
    ['organization_bound', config()],
    ['organization_bound', config({ project_selection: 'required' })],
    ['user_bound', config({ bind_to_authorizing_user: true })],
    ['user_bound', config({ bind_to_authorizing_user: true, project_selection: 'optional' })],
  ])('binds the grant to %s', (expected, grantConfig) => {
    expect(getOAuthConsentModel(grantConfig).grant_kind).toBe(expected)
  })

  test.each(['off', 'optional', 'required'] as const)(
    'passes the %s selection mode through untouched',
    (mode) => {
      expect(getOAuthConsentModel(config({ project_selection: mode })).project_selection).toBe(mode)
    }
  )

  test('forces a dynamic client user-bound with a required selection, whatever the flags say', () => {
    const model = getOAuthConsentModel(
      config({ is_dynamic_client: true, bind_to_authorizing_user: false, project_selection: 'off' })
    )

    expect(model.grant_kind).toBe('user_bound')
    expect(model.project_selection).toBe('required')
  })
})

describe('getScopedProjectRefs', () => {
  test('returns the refs of a selection', () => {
    expect(
      getScopedProjectRefs({ target: 'selected_projects', project_refs: ['abc', 'def'] })
    ).toEqual(['abc', 'def'])
  })

  test('degrades an all-projects grant to nothing to preselect', () => {
    expect(getScopedProjectRefs({ target: 'all_projects' })).toEqual([])
  })
})

const project = (ref: string): OAuthAppsAuthorizeOrganizationProject => ({
  ref,
  name: ref,
  role: 'developer',
})

const selectedGrant = (refs: string[]): OAuthExistingGrant => ({
  kind: 'user_bound',
  approved_scopes: ['project_settings'],
  project_scope: { target: 'selected_projects', project_refs: refs },
  created_at: '2026-08-14T09:12:00.000Z',
  updated_at: null,
})

const ALL_PROJECTS_GRANT: OAuthExistingGrant = {
  kind: 'user_bound',
  approved_scopes: ['project_settings'],
  project_scope: { target: 'all_projects' },
  created_at: '2026-08-14T09:12:00.000Z',
  updated_at: null,
}

describe('getPreselectedProjectRefs', () => {
  const live = ['alpha', 'bravo', 'charlie', 'delta'].map(project)

  test('drops suggested refs that do not resolve against live projects', () => {
    expect(
      getPreselectedProjectRefs({
        existingGrant: null,
        suggestedRefs: ['alpha', 'ghost', 'bravo'],
        liveProjects: live,
      })
    ).toEqual(['alpha', 'bravo'])
  })

  test('existing-grant refs come before suggested refs and survive the cap', () => {
    expect(
      getPreselectedProjectRefs({
        existingGrant: selectedGrant(['charlie', 'delta']),
        suggestedRefs: ['alpha', 'bravo'],
        liveProjects: live,
        max: 3,
      })
    ).toEqual(['charlie', 'delta', 'alpha'])
  })

  test('dedupes a suggested ref that the existing grant already carries', () => {
    expect(
      getPreselectedProjectRefs({
        existingGrant: selectedGrant(['alpha']),
        suggestedRefs: ['alpha', 'bravo'],
        liveProjects: live,
      })
    ).toEqual(['alpha', 'bravo'])
  })

  test('truncates at the cap when oversupplied', () => {
    const manyProjects = Array.from({ length: 15 }, (_, index) => project(`ref-${index}`))
    const manyRefs = manyProjects.map((entry) => entry.ref)

    const result = getPreselectedProjectRefs({
      existingGrant: null,
      suggestedRefs: manyRefs,
      liveProjects: manyProjects,
    })

    expect(result).toHaveLength(10)
    expect(result).toEqual(manyRefs.slice(0, 10))
  })

  test('returns nothing for an all-projects existing grant', () => {
    expect(
      getPreselectedProjectRefs({
        existingGrant: ALL_PROJECTS_GRANT,
        suggestedRefs: ['alpha'],
        liveProjects: live,
      })
    ).toEqual([])
  })

  test('returns nothing when there are no live projects', () => {
    expect(
      getPreselectedProjectRefs({
        existingGrant: selectedGrant(['alpha']),
        suggestedRefs: ['alpha'],
        liveProjects: [],
      })
    ).toEqual([])
  })
})
