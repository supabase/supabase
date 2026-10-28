import { describe, expect, it } from 'vitest'

import { buildEntitySelectSql, entityQueryId } from './entityQuery.utils'

describe('entityQueryId', () => {
  it('is stable for the same entity, so reopening a table returns to the same draft', () => {
    expect(entityQueryId({ schema: 'public', name: 'users' })).toBe(
      entityQueryId({ schema: 'public', name: 'users' })
    )
  })

  it('separates schema from name, so identifiers containing the separator cannot collide', () => {
    expect(entityQueryId({ schema: 'a:b', name: 'c' })).not.toBe(
      entityQueryId({ schema: 'a', name: 'b:c' })
    )
  })
})

describe('buildEntitySelectSql', () => {
  it('reads the relation by its qualified name', () => {
    expect(buildEntitySelectSql({ schema: 'public', name: 'users' })).toBe(
      'select * from public.users'
    )
  })

  it('escapes identifiers that would otherwise break out of the quoting', () => {
    expect(buildEntitySelectSql({ schema: 'public', name: 'we"ird' })).toBe(
      'select * from public."we""ird"'
    )
  })
})

describe('buildEntitySelectSql per table', () => {
  it('reads auth.users without password hashes or one-time tokens, newest first', () => {
    const sql = buildEntitySelectSql({ schema: 'auth', name: 'users' })
    expect(sql).toMatch(/^select id, email, phone,/)
    expect(sql).not.toMatch(/\*|encrypted_password|token/)
    expect(sql).toMatch(/order by created_at desc nulls last$/)
  })
})
