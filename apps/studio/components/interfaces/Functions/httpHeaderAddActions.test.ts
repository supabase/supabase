import { describe, expect, it } from 'vitest'

import {
  buildEdgeFunctionHeaderAddActions,
  ensureEdgeFunctionAuthorizationHeader,
  getEdgeFunctionAuthHeader,
} from './httpHeaderAddActions'

describe('buildEdgeFunctionHeaderAddActions', () => {
  it('includes the apikey header for secret keys', () => {
    const [authAction] = buildEdgeFunctionHeaderAddActions({
      apiKey: 'sb_secret_123',
      createRow: (name, value) => ({ name, value }),
    })

    expect(authAction.label).toBe('Add secret key')
    expect(authAction.description).toBe(
      'Requires JWT verification to be disabled and authorization handled by the function'
    )
    expect(authAction.createRows()).toEqual([{ name: 'apikey', value: 'sb_secret_123' }])
  })

  it('falls back to the Authorization header for legacy keys', () => {
    const [authAction] = buildEdgeFunctionHeaderAddActions({
      apiKey: 'legacy-service-role-jwt',
      createRow: (name, value) => ({ name, value }),
    })

    expect(authAction.label).toBe('Add secret key')
    expect(authAction.description).toBe('Required for edge functions that enforce JWT verification')
    expect(authAction.createRows()).toEqual([
      { name: 'Authorization', value: 'Bearer legacy-service-role-jwt' },
    ])
  })
})

describe('getEdgeFunctionAuthHeader', () => {
  it('returns the apikey header for publishable keys', () => {
    expect(getEdgeFunctionAuthHeader('sb_publishable_123')).toEqual({
      name: 'apikey',
      value: 'sb_publishable_123',
    })
  })

  it('returns the Authorization header for non-prefixed keys', () => {
    expect(getEdgeFunctionAuthHeader('legacy-service-role-jwt')).toEqual({
      name: 'Authorization',
      value: 'Bearer legacy-service-role-jwt',
    })
  })

  it.each(['sb_secretly_123', 'sb_publishableish_123'])(
    'does not treat %s as a new API key',
    (apiKey) => {
      expect(getEdgeFunctionAuthHeader(apiKey)).toEqual({
        name: 'Authorization',
        value: `Bearer ${apiKey}`,
      })
    }
  )
})

describe('ensureEdgeFunctionAuthorizationHeader', () => {
  const createRow = (name: string, value: string) => ({ id: 'new', name, value })

  it('preserves apikey while normalizing Authorization rows', () => {
    const headers = [
      { id: 'custom-before', name: 'X-Before', value: 'before' },
      { id: 'authorization', name: ' authorization ', value: 'Bearer old-key' },
      { id: 'apikey', name: 'apikey', value: 'sb_secret_123' },
      { id: 'duplicate', name: 'AUTHORIZATION', value: 'Bearer stale-key' },
      { id: 'custom-after', name: 'X-After', value: 'after' },
    ]

    expect(
      ensureEdgeFunctionAuthorizationHeader({
        headers,
        serviceRoleKey: 'legacy-service-role-jwt',
        verifyJwt: true,
        createRow,
      })
    ).toEqual([
      { id: 'custom-before', name: 'X-Before', value: 'before' },
      {
        id: 'authorization',
        name: 'Authorization',
        value: 'Bearer legacy-service-role-jwt',
      },
      { id: 'apikey', name: 'apikey', value: 'sb_secret_123' },
      { id: 'custom-after', name: 'X-After', value: 'after' },
    ])
  })

  it('adds Authorization alongside apikey when JWT verification is enabled', () => {
    const headers = [{ id: 'apikey', name: 'apikey', value: 'sb_secret_123' }]

    expect(
      ensureEdgeFunctionAuthorizationHeader({
        headers,
        serviceRoleKey: 'legacy-service-role-jwt',
        verifyJwt: true,
        createRow,
      })
    ).toEqual([
      { id: 'apikey', name: 'apikey', value: 'sb_secret_123' },
      { id: 'new', name: 'Authorization', value: 'Bearer legacy-service-role-jwt' },
    ])
  })

  it('does not change headers without an applicable service role key', () => {
    const headers = [
      { id: 'authorization', name: 'Authorization', value: 'Bearer existing-key' },
      { id: 'apikey', name: 'apikey', value: 'sb_secret_123' },
    ]

    expect(
      ensureEdgeFunctionAuthorizationHeader({
        headers,
        serviceRoleKey: 'legacy-service-role-jwt',
        verifyJwt: false,
        createRow,
      })
    ).toBe(headers)
    expect(ensureEdgeFunctionAuthorizationHeader({ headers, verifyJwt: true, createRow })).toBe(
      headers
    )
    expect(
      ensureEdgeFunctionAuthorizationHeader({
        headers,
        serviceRoleKey: 'sb_secret_456',
        verifyJwt: true,
        createRow,
      })
    ).toBe(headers)
  })

  it('returns the existing array when Authorization is already normalized', () => {
    const headers = [
      {
        id: 'authorization',
        name: 'Authorization',
        value: 'Bearer legacy-service-role-jwt',
      },
      { id: 'apikey', name: 'apikey', value: 'sb_secret_123' },
    ]

    expect(
      ensureEdgeFunctionAuthorizationHeader({
        headers,
        serviceRoleKey: 'legacy-service-role-jwt',
        verifyJwt: true,
        createRow,
      })
    ).toBe(headers)
  })
})
