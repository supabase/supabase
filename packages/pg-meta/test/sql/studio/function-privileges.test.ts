import { describe, expect, it } from 'vitest'

import {
  buildFunctionPrivilegesSql,
  buildRevokePublicFunctionExecuteSql,
  getExposedFunctionsSql,
} from '../../../src'

describe('getExposedFunctionsSql', () => {
  it('uses has_function_privilege so PUBLIC EXECUTE counts for API roles', () => {
    const sql = getExposedFunctionsSql({ offset: 0, limit: 50 })
    expect(sql).toContain("has_function_privilege('anon', p.oid, 'EXECUTE')")
    expect(sql).toContain("has_function_privilege('authenticated', p.oid, 'EXECUTE')")
    expect(sql).toContain("has_function_privilege('service_role', p.oid, 'EXECUTE')")
    expect(sql).not.toContain('aclexplode')
  })

  it('returns per-role execute flags in the function payload', () => {
    const sql = getExposedFunctionsSql({ offset: 0, limit: 50 })
    expect(sql).toContain("'anon_execute', fg.anon_execute")
    expect(sql).toContain("'authenticated_execute', fg.auth_execute")
    expect(sql).toContain("'service_role_execute', fg.srv_execute")
  })
})

describe('buildFunctionPrivilegesSql', () => {
  it('revokes from PUBLIC as well as the Data API roles', () => {
    const sql = buildFunctionPrivilegesSql(['public.claim_monitor_run_lock'], 'revoke')
    expect(sql).toContain(
      'revoke all on function %I.%I(%s) from public, anon, authenticated, service_role'
    )
  })

  it('grants execute to the Data API roles', () => {
    const sql = buildFunctionPrivilegesSql(['public.claim_monitor_run_lock'], 'grant')
    expect(sql).toContain(
      'grant execute on function %I.%I(%s) to anon, authenticated, service_role'
    )
  })
})

describe('buildRevokePublicFunctionExecuteSql', () => {
  it('revokes from PUBLIC, anon, and authenticated but leaves service_role', () => {
    const sql = buildRevokePublicFunctionExecuteSql(['public.claim_monitor_run_lock'])
    expect(sql).toContain('revoke all on function %I.%I(%s) from public, anon, authenticated')
    expect(sql).not.toContain('service_role')
  })
})
