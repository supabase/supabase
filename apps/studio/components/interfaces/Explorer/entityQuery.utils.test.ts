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
