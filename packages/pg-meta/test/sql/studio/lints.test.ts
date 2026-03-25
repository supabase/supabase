import { describe, expect, it } from 'vitest'

import { enrichLintsQuery } from '../../../src'

describe('enrichLintsQuery', () => {
  const dummyQuery = 'SELECT 1'

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
