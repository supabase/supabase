import { describe, expect, test } from 'vitest'

import type { OAuthAppGrantConfig } from './types'
import { getOAuthAppType, getOAuthConsentModel, getScopedProjectRefs } from './types'

const config = (overrides: Partial<OAuthAppGrantConfig> = {}): OAuthAppGrantConfig => ({
  bind_to_authorizing_user: false,
  project_selection: 'off',
  is_dynamic_client: false,
  ...overrides,
})

describe('getOAuthAppType', () => {
  test.each([
    ['A', config()],
    ['B', config({ project_selection: 'required' })],
    ['B', config({ project_selection: 'optional' })],
    ['C', config({ bind_to_authorizing_user: true })],
    ['D', config({ bind_to_authorizing_user: true, project_selection: 'required' })],
    ['E', config({ is_dynamic_client: true })],
  ])('maps the flag combination to type %s', (expected, grantConfig) => {
    expect(getOAuthAppType(grantConfig)).toBe(expected)
  })
})

describe('getOAuthConsentModel', () => {
  test('type A hides the picker and only an owner can approve', () => {
    const model = getOAuthConsentModel(config())

    expect(model.grant_kind).toBe('organization_bound')
    expect(model.requires_owner).toBe(true)
    expect(model.shows_project_picker).toBe(false)
    expect(model.implicit_project_scope).toEqual({ target: 'all_projects' })
  })

  test('type B shows the picker but still needs an owner', () => {
    const model = getOAuthConsentModel(config({ project_selection: 'required' }))

    expect(model.grant_kind).toBe('organization_bound')
    expect(model.requires_owner).toBe(true)
    expect(model.shows_project_picker).toBe(true)
    expect(model.implicit_project_scope).toBeNull()
  })

  test('type C lets any member approve, but grants the whole organization', () => {
    const model = getOAuthConsentModel(config({ bind_to_authorizing_user: true }))

    expect(model.grant_kind).toBe('user_bound')
    expect(model.requires_owner).toBe(false)
    expect(model.shows_project_picker).toBe(false)
    expect(model.implicit_project_scope).toEqual({ target: 'all_projects' })
  })

  test('type D lets any member approve for a selection they choose', () => {
    const model = getOAuthConsentModel(
      config({ bind_to_authorizing_user: true, project_selection: 'required' })
    )

    expect(model.grant_kind).toBe('user_bound')
    expect(model.requires_owner).toBe(false)
    expect(model.shows_project_picker).toBe(true)
    expect(model.offers_all_projects).toBe(false)
  })

  test('only the optional mode offers org-wide alongside the picker', () => {
    expect(
      getOAuthConsentModel(config({ project_selection: 'optional' })).offers_all_projects
    ).toBe(true)
    expect(
      getOAuthConsentModel(config({ project_selection: 'required' })).offers_all_projects
    ).toBe(false)
  })

  test('the off mode never offers a choice it cannot render', () => {
    const model = getOAuthConsentModel(config())

    expect(model.shows_project_picker).toBe(false)
    expect(model.offers_all_projects).toBe(false)
  })

  test('a dynamic client is forced user-bound with a required picker, whatever the flags say', () => {
    const model = getOAuthConsentModel(
      config({ is_dynamic_client: true, bind_to_authorizing_user: false, project_selection: 'off' })
    )

    expect(model.grant_kind).toBe('user_bound')
    expect(model.requires_owner).toBe(false)
    expect(model.shows_project_picker).toBe(true)
    expect(model.offers_all_projects).toBe(false)
    expect(model.implicit_project_scope).toBeNull()
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
