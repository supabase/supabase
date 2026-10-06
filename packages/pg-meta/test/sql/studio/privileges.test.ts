import { describe, expect, it } from 'vitest'

import {
  getExposedFunctionsSql,
  getExposedTablesSql,
} from '../../../src/sql/studio/database/privileges'

describe('exposed privileges PUBLIC handling (issue #50441)', () => {
  it('attributes PUBLIC EXECUTE (grantee = 0) to anon/auth/service_role for functions', () => {
    const sql = String(
      getExposedFunctionsSql({ offset: 0, limit: 10, ignoredSchemas: [] })
    )
    expect(sql).toContain('acl.grantee = 0')
    expect(sql).toContain("pr.rolname = 'anon'")
    expect(sql).toContain("pr.rolname = 'authenticated'")
    expect(sql).toContain("pr.rolname = 'service_role'")
    expect(sql).toContain("privilege_type = 'EXECUTE'")
  })

  it('attributes PUBLIC grants (grantee = 0) to anon/auth/service_role for tables', () => {
    const sql = String(
      getExposedTablesSql({ offset: 0, limit: 10, ignoredSchemas: [] })
    )
    expect(sql).toContain('acl.grantee = 0')
    expect(sql).toContain("privilege_type = 'SELECT'")
  })
})
