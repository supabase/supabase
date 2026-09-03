import { describe, expect, it } from 'vitest'

import { pgMeta } from './pg-meta'

describe('pgMeta ESM interop', () => {
  it('resolves schemas.list().sql', () => {
    const sql = pgMeta.schemas.list().sql
    expect(typeof sql).toBe('string')
    expect(sql.length).toBeGreaterThan(0)
  })

  it('resolves policies.list().sql', () => {
    const sql = pgMeta.policies.list({ includedSchemas: ['public'] }).sql
    expect(typeof sql).toBe('string')
    expect(sql.length).toBeGreaterThan(0)
  })
})
