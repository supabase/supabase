import { describe, expect, it } from 'vitest'

import { enrichLintsQuery, getLintsSQL, safeSql } from '../../../src'

describe('getLintsSQL', () => {
  it('embeds docsUrl in remediation links', () => {
    const docsUrl = 'https://supabase.com/docs'
    const sql = getLintsSQL({ docsUrl })

    expect(sql).toContain(
      `'${docsUrl}/guides/database/database-linter?lint=0001_unindexed_foreign_keys'`
    )
    expect(sql).toContain(
      `'${docsUrl}/guides/database/database-linter?lint=0024_permissive_rls_policy'`
    )
  })

  it('resets search_path before running lints', () => {
    const sql = getLintsSQL({ docsUrl: 'https://supabase.com/docs' })

    expect(sql).toMatch(/^set local search_path = '';/)
  })
})

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
