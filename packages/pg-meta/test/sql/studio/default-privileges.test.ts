import { describe, expect, it } from 'vitest'

import { getDefaultPrivilegesStateSql } from '../../../src/sql/studio/database/privileges'

describe('default privileges PUBLIC handling (issue #51316)', () => {
  it('counts grants made TO PUBLIC via left join on grantee = 0', () => {
    const sql = String(getDefaultPrivilegesStateSql({ schema: 'public' }))
    expect(sql).toContain('left join pg_roles gr on gr.oid = acl.grantee')
    expect(sql).toContain('acl.grantee = 0')
    expect(sql).toContain("gr.rolname in ('anon', 'authenticated', 'service_role')")
  })
})
