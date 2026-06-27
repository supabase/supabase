import { describe, expect, it } from 'vitest'

import {
  buildEdgeFunctionHeaderAddActions,
  getEdgeFunctionAuthHeader,
} from './httpHeaderAddActions'

describe('buildEdgeFunctionHeaderAddActions', () => {
  it('includes the apikey header for secret keys', () => {
    const [authAction] = buildEdgeFunctionHeaderAddActions({
      apiKey: 'sb_secret_123',
      createRow: (name, value) => ({ name, value }),
    })

    expect(authAction.label).toBe('Add apikey header with secret key')
    expect(authAction.createRows()).toEqual([{ name: 'apikey', value: 'sb_secret_123' }])
  })

  it('falls back to the Authorization header for legacy keys', () => {
    const [authAction] = buildEdgeFunctionHeaderAddActions({
      apiKey: 'legacy-service-role-jwt',
      createRow: (name, value) => ({ name, value }),
    })

    expect(authAction.label).toBe('Add auth header with secret key')
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
})
