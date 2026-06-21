import { describe, expect, it } from 'vitest'

import { buildEdgeFunctionTestHeaders } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionTesterSheet.utils'
import type { APIKey } from '@/data/api-keys/api-keys-query'

const publishableKey: APIKey = {
  api_key: 'sb_publishable_project_key',
  id: 'publishable',
  inserted_at: '2026-01-01T00:00:00Z',
  name: 'publishable',
  type: 'publishable',
}

const serviceKey: APIKey = {
  api_key: 'legacy-service-role-jwt',
  hash: 'hash',
  id: 'service_role',
  inserted_at: '2026-01-01T00:00:00Z',
  name: 'service_role',
  prefix: 'prefix',
  secret_jwt_template: { role: 'service_role' },
  type: 'secret',
}

describe('EdgeFunctionTesterSheet.utils: buildEdgeFunctionTestHeaders', () => {
  it('uses the publishable key as apikey without forwarding a legacy service-role JWT', () => {
    const headers = buildEdgeFunctionTestHeaders({
      publishableKey,
      serviceKey,
      testAuthorization: undefined,
      customHeaders: {},
    })

    expect(headers).toMatchObject({
      apikey: 'sb_publishable_project_key',
      'Content-Type': 'application/json',
    })
    expect(headers.Authorization).toBeUndefined()
    expect(headers['x-test-authorization']).toBeUndefined()
  })

  it('keeps explicit role impersonation authorization ahead of the publishable-key default', () => {
    const headers = buildEdgeFunctionTestHeaders({
      publishableKey,
      serviceKey,
      testAuthorization: 'Bearer impersonated-role-token',
      customHeaders: {},
    })

    expect(headers).toMatchObject({
      apikey: 'sb_publishable_project_key',
      'x-test-authorization': 'Bearer impersonated-role-token',
    })
  })

  it('allows custom headers to override generated headers for manual testing', () => {
    const headers = buildEdgeFunctionTestHeaders({
      publishableKey,
      serviceKey,
      testAuthorization: undefined,
      customHeaders: {
        apikey: 'manual-api-key',
        Authorization: 'Bearer manual-token',
        'x-extra-header': 'value',
      },
    })

    expect(headers).toMatchObject({
      apikey: 'manual-api-key',
      Authorization: 'Bearer manual-token',
      'x-extra-header': 'value',
    })
    expect(headers['x-test-authorization']).toBeUndefined()
  })

  it('treats lower-case authorization as a manual override', () => {
    const headers = buildEdgeFunctionTestHeaders({
      publishableKey,
      serviceKey,
      testAuthorization: undefined,
      customHeaders: {
        authorization: 'Bearer manual-token',
      },
    })

    expect(headers).toMatchObject({
      apikey: 'sb_publishable_project_key',
      authorization: 'Bearer manual-token',
    })
    expect(headers['x-test-authorization']).toBeUndefined()
  })

  it('normalizes manually entered x-test-authorization casing before sending to the API route', () => {
    const headers = buildEdgeFunctionTestHeaders({
      publishableKey,
      serviceKey,
      testAuthorization: 'Bearer impersonated-role-token',
      customHeaders: {
        'X-Test-Authorization': 'Bearer manual-token',
      },
    })

    expect(headers).toMatchObject({
      apikey: 'sb_publishable_project_key',
      'x-test-authorization': 'Bearer manual-token',
    })
    expect(headers['X-Test-Authorization']).toBeUndefined()
  })

  it('keeps the legacy service role fallback when a publishable key is unavailable', () => {
    const headers = buildEdgeFunctionTestHeaders({
      publishableKey: undefined,
      serviceKey,
      testAuthorization: undefined,
      customHeaders: {},
    })

    expect(headers).toMatchObject({
      'Content-Type': 'application/json',
      'x-test-authorization': 'Bearer legacy-service-role-jwt',
    })
    expect(headers.apikey).toBeUndefined()
  })
})
