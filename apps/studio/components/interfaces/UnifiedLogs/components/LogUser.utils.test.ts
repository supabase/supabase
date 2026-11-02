import { describe, expect, it } from 'vitest'

import { resolveRequestUser } from './LogUser.utils'

const USER_ID = '6f1c1a8e-4a0b-4c1e-9b1e-2f3a4b5c6d7e'

describe('resolveRequestUser', () => {
  it("prefers the log's own user", () => {
    expect(resolveRequestUser({ auth_user: USER_ID }, [{ auth_user: 'someone-else' }])).toEqual({
      kind: 'user',
      userId: USER_ID,
    })
  })

  it('borrows the user from another log in the same request', () => {
    expect(
      resolveRequestUser({ auth_user: null }, [{ auth_user: null }, { auth_user: USER_ID }])
    ).toEqual({ kind: 'user', userId: USER_ID })
  })

  it('flags subjects that are not Supabase Auth user ids', () => {
    expect(resolveRequestUser({ auth_user: 'user_2abcClerk' })).toEqual({
      kind: 'external',
      userId: 'user_2abcClerk',
    })
  })

  it('reports the token role when no user made the request', () => {
    expect(
      resolveRequestUser({ auth_user: null }, [
        { metadata: { 'request.sb.jwt.authorization.payload.role': 'anon' } },
      ])
    ).toEqual({ kind: 'none', role: 'anon' })
    expect(resolveRequestUser({})).toEqual({ kind: 'none', role: undefined })
  })
})
