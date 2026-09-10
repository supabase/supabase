import { describe, expect, test } from 'vitest'

import type { OAuthAppGrantConfig } from './types'
import { getOAuthConsentModel, getScopedProjectRefs } from './types'

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
