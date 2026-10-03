import { describe, expect, it } from 'vitest'
import { buildScopeStatement, type ScopeConnectionOptions } from './scope'

const baseScopeOptions: ScopeConnectionOptions = {
  user: {
    jwt: 'jwt',
    payload: {
      role: 'authenticated',
      sub: 'user-id',
    },
  },
  method: 'POST',
  path: '/object/bucket/name',
  operation: () => 'object.create',
}
const role = 'authenticated'
const claims = '{"role":"authenticated"}'
const headers = '{"x-client-info":"test"}'

describe('PostgreSQL scope statement', () => {
  it('builds the common request scope without optional transaction settings', () => {
    const statement = buildScopeStatement(baseScopeOptions, role, claims, headers)

    expect(statement.text).toContain("set_config('role', $1, true)")
    expect(statement.text).not.toContain("set_config('statement_timeout'")
    expect(statement.text).not.toContain("set_config('search_path'")
    expect(statement.values).toEqual([
      'authenticated',
      'authenticated',
      'jwt',
      'user-id',
      '{"role":"authenticated"}',
      '{"x-client-info":"test"}',
      'POST',
      '/object/bucket/name',
      'object.create',
    ])
  })

  it('keeps timeout and search path placeholder ordering stable', () => {
    const statement = buildScopeStatement(
      baseScopeOptions,
      role,
      claims,
      headers,
      4321,
      'storage,public,extensions'
    )

    expect(statement.text).toContain("set_config('statement_timeout', $10, true)")
    expect(statement.text).toContain("set_config('search_path', $11, true)")
    expect(statement.values.slice(9)).toEqual(['4321ms', 'storage,public,extensions'])
  })

  it('uses placeholder ten when only search path is present', () => {
    const statement = buildScopeStatement(
      baseScopeOptions,
      role,
      claims,
      headers,
      undefined,
      'storage,public,extensions'
    )

    expect(statement.text).toContain("set_config('search_path', $10, true)")
    expect(statement.values[9]).toBe('storage,public,extensions')
  })

  it('uses placeholder ten when only statement timeout is present', () => {
    const statement = buildScopeStatement(baseScopeOptions, role, claims, headers, 4321)

    expect(statement.text).toContain("set_config('statement_timeout', $10, true)")
    expect(statement.text).not.toContain("set_config('search_path'")
    expect(statement.values[9]).toBe('4321ms')
  })
})
