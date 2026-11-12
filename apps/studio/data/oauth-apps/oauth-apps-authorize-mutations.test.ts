import { describe, expect, test } from 'vitest'

import { OAUTH_APPS_MOCK_SCENARIOS } from './mocks'
import { approveOAuthAppsAuthorize } from './oauth-apps-authorize-approve-mutation'

const AUTH_ID = OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper
const SLUG = 'northwind-traders'
const BODY = { project_refs: ['northwindstorefront1'] }

async function approveExpectingRedirect(
  variables: Parameters<typeof approveOAuthAppsAuthorize>[0]
) {
  try {
    const result = await approveOAuthAppsAuthorize(variables)
    return result
  } catch {
    throw new Error('expected a redirect, got a role failure')
  }
}

describe('approveOAuthAppsAuthorize', () => {
  test('returns a redirect url carrying both code and state', async () => {
    const { url } = await approveExpectingRedirect({ slug: SLUG, auth_id: AUTH_ID, body: BODY })

    const params = new URL(url).searchParams
    expect(params.get('code')).toBeTruthy()
    expect(params.get('state')).toBeTruthy()
    expect(params.get('error')).toBeNull()
  })

  test('accepts a body without project_refs', async () => {
    const { url } = await approveExpectingRedirect({ slug: SLUG, auth_id: AUTH_ID, body: {} })

    expect(new URL(url).searchParams.get('code')).toBeTruthy()
  })

  test('requires an authorization request id', async () => {
    await expect(
      approveOAuthAppsAuthorize({ slug: SLUG, auth_id: '', body: BODY })
    ).rejects.toThrow('Authorization request id is required')
  })

  test('requires an organization slug', async () => {
    await expect(
      approveOAuthAppsAuthorize({ slug: '', auth_id: AUTH_ID, body: BODY })
    ).rejects.toThrow('Organization slug is required')
  })

  test('does not enforce a selection cap', async () => {
    const manyRefs = Array.from({ length: 25 }, (_, index) => `ref-${index}`)

    const { url } = await approveExpectingRedirect({
      slug: SLUG,
      auth_id: AUTH_ID,
      body: { project_refs: manyRefs },
    })

    expect(url).toBeTruthy()
  })
})
