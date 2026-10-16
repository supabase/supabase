import { describe, expect, it } from 'vitest'

import { getExposedFunctionsSql } from '../../../src/sql/studio/database/privileges'

describe('exposed functions PUBLIC handling (issue #50441)', () => {
  it('attributes PUBLIC EXECUTE (grantee = 0) to anon/auth/service_role', () => {
    const sql = String(
      getExposedFunctionsSql({ offset: 0, limit: 10, ignoredSchemas: [] })
    )
    expect(sql).toContain(
      "bool_or((pr.rolname = 'anon' or acl.grantee = 0) and acl.privilege_type = 'EXECUTE') as anon_execute"
    )
    expect(sql).toContain(
      "bool_or((pr.rolname = 'authenticated' or acl.grantee = 0) and acl.privilege_type = 'EXECUTE') as auth_execute"
    )
    expect(sql).toContain(
      "bool_or((pr.rolname = 'service_role' or acl.grantee = 0) and acl.privilege_type = 'EXECUTE') as srv_execute"
    )
  })
})
