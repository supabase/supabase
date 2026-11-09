import { describe, expect, it } from 'vitest'

import {
  canRevokePublicFunctionAccess,
  getFunctionExecutePrivileges,
  getFunctionPublicAccessKind,
  isFunctionCallableByAnyone,
} from './function-api-access.utils'

describe('getFunctionExecutePrivileges', () => {
  it('maps API grant flags onto privilege roles', () => {
    expect(
      getFunctionExecutePrivileges({
        anon_execute: true,
        authenticated_execute: false,
        service_role_execute: true,
      })
    ).toEqual({
      anon: true,
      authenticated: false,
      serviceRole: true,
    })
  })
})

describe('getFunctionPublicAccessKind', () => {
  it.each([
    {
      name: 'anyone when anon can execute',
      privileges: { anon: true, authenticated: true, serviceRole: true },
      expected: 'anyone',
    },
    {
      name: 'signed-in when only authenticated can execute',
      privileges: { anon: false, authenticated: true, serviceRole: false },
      expected: 'signed-in',
    },
    {
      name: 'service-role-only when only service_role can execute',
      privileges: { anon: false, authenticated: false, serviceRole: true },
      expected: 'service-role-only',
    },
    {
      name: 'none when no API role can execute',
      privileges: { anon: false, authenticated: false, serviceRole: false },
      expected: 'none',
    },
  ] as const)('returns $expected when $name', ({ privileges, expected }) => {
    expect(getFunctionPublicAccessKind(privileges)).toBe(expected)
  })
})

describe('isFunctionCallableByAnyone', () => {
  it('is true only when anon can execute', () => {
    expect(
      isFunctionCallableByAnyone({ anon: true, authenticated: false, serviceRole: false })
    ).toBe(true)
    expect(
      isFunctionCallableByAnyone({ anon: false, authenticated: true, serviceRole: true })
    ).toBe(false)
  })
})

describe('canRevokePublicFunctionAccess', () => {
  it('is true when anon or authenticated can execute', () => {
    expect(
      canRevokePublicFunctionAccess({ anon: true, authenticated: false, serviceRole: true })
    ).toBe(true)
    expect(
      canRevokePublicFunctionAccess({ anon: false, authenticated: true, serviceRole: false })
    ).toBe(true)
    expect(
      canRevokePublicFunctionAccess({ anon: false, authenticated: false, serviceRole: true })
    ).toBe(false)
  })
})
