import { describe, expect, it } from 'vitest'

import { enrichLintsQuery, safeSql } from '../../../src'
import { getLintsSQL } from '../../../src/sql/studio/advisor/lints'

describe('enrichLintsQuery', () => {
  const dummyQuery = safeSql`SELECT 1`

  it('should include SET LOCAL pgrst.db_schemas when exposedSchemas is provided', () => {
    const result = enrichLintsQuery(dummyQuery, 'public, storage')
    expect(result).toContain("set local pgrst.db_schemas = 'public, storage';")
  })

  it('should NOT include SET LOCAL pgrst.db_schemas when exposedSchemas is undefined', () => {
    const result = enrichLintsQuery(dummyQuery, undefined)
    expect(result).not.toContain('pgrst.db_schemas')
  })

  it('should NOT include SET LOCAL pgrst.db_schemas when exposedSchemas is empty string', () => {
    const result = enrichLintsQuery(dummyQuery, '')
    expect(result).not.toContain('pgrst.db_schemas')
  })

  it('should always include the query', () => {
    const result = enrichLintsQuery(dummyQuery)
    expect(result).toContain(dummyQuery)
  })
})

describe('getLintsSQL rls_disabled_in_public', () => {
  const sql = getLintsSQL({ docsUrl: 'https://supabase.com/docs' })

  // Isolate the rls_disabled_in_public lint block so the assertions below
  // cannot be satisfied by pg_depend joins belonging to other lints.
  const rlsLint = (() => {
    const start = sql.indexOf("'rls_disabled_in_public' as name")
    expect(start).toBeGreaterThan(-1)
    const end = sql.indexOf('union all', start)
    return sql.slice(start, end === -1 ? undefined : end)
  })()

  it('excludes extension-owned tables via a pg_depend join', () => {
    expect(rlsLint).toContain('left join pg_catalog.pg_depend dep')
    expect(rlsLint).toContain("and dep.deptype = 'e'")
    expect(rlsLint).toContain('and dep.objid is null')
  })

  it('still flags user tables with RLS disabled', () => {
    expect(rlsLint).toContain('and not c.relrowsecurity')
  })
})
