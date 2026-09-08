import { describe, expect, test } from 'vitest'

import { OAUTH_APPS_MOCK_SCENARIOS } from './mocks'
import { approveOAuthAppsAuthorize } from './oauth-apps-authorize-approve-mutation'
import { denyOAuthAppsAuthorize } from './oauth-apps-authorize-deny-mutation'
import { isRoleValidationFailure } from './types'

const AUTH_ID = OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper
const SLUG = 'northwind-traders'
const PROJECT_REFS = ['northwindstorefront1']

// approve now returns a redirect-or-role-failure union, so narrow before reading the url.
async function approveExpectingRedirect(
  variables: Parameters<typeof approveOAuthAppsAuthorize>[0]
) {
  const result = await approveOAuthAppsAuthorize(variables)
  if (isRoleValidationFailure(result)) throw new Error('expected a redirect, got a role failure')
  return result
}

describe('approveOAuthAppsAuthorize', () => {
  test('returns a redirect url carrying both code and state', async () => {
    const { url } = await approveExpectingRedirect({
      slug: SLUG,
      auth_id: AUTH_ID,
      project_refs: PROJECT_REFS,
    })

    const params = new URL(url).searchParams
    expect(params.get('code')).toBeTruthy()
    expect(params.get('state')).toBeTruthy()
    expect(params.get('error')).toBeNull()
  })

  test('rejects an empty project_refs list', async () => {
    await expect(
      approveOAuthAppsAuthorize({ slug: SLUG, auth_id: AUTH_ID, project_refs: [] })
    ).rejects.toThrow('At least one project is required')
  })

  test('requires an authorization request id', async () => {
    await expect(
      approveOAuthAppsAuthorize({ slug: SLUG, auth_id: '', project_refs: PROJECT_REFS })
    ).rejects.toThrow('Authorization request id is required')
  })

  test('requires an organization slug', async () => {
    await expect(
      approveOAuthAppsAuthorize({ slug: '', auth_id: AUTH_ID, project_refs: PROJECT_REFS })
    ).rejects.toThrow('Organization slug is required')
  })

  test('does not enforce a selection cap', async () => {
    const manyRefs = Array.from({ length: 25 }, (_, index) => `ref-${index}`)

    const { url } = await approveExpectingRedirect({
      slug: SLUG,
      auth_id: AUTH_ID,
      project_refs: manyRefs,
    })

    expect(url).toBeTruthy()
  })
})

describe('denyOAuthAppsAuthorize', () => {
  test('returns a redirect url carrying access_denied and state', async () => {
    const { url } = await denyOAuthAppsAuthorize({ slug: SLUG, auth_id: AUTH_ID })

    const params = new URL(url).searchParams
    expect(params.get('error')).toBe('access_denied')
    expect(params.get('state')).toBeTruthy()
    expect(params.get('code')).toBeNull()
  })

  test('requires an authorization request id', async () => {
    await expect(denyOAuthAppsAuthorize({ slug: SLUG, auth_id: '' })).rejects.toThrow(
      'Authorization request id is required'
    )
  })

  test('requires an organization slug', async () => {
    await expect(denyOAuthAppsAuthorize({ slug: '', auth_id: AUTH_ID })).rejects.toThrow(
      'Organization slug is required'
    )
  })
})
