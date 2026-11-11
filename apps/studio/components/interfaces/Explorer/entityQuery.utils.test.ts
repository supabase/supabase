import { describe, expect, it } from 'vitest'

import { buildEntitySelectSql, buildTableViewSql, entityQueryId } from './entityQuery.utils'

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

describe('buildTableViewSql', () => {
  const entity = { schema: 'public', name: 'tasks' }

  it('is the plain table query until something is filtered or sorted', () => {
    expect(buildTableViewSql({ entity })).toBe(buildEntitySelectSql(entity))
  })

  it("narrows and orders the table the way the Table Editor's filter bar and sort do", () => {
    const sql = buildTableViewSql({
      entity,
      tableView: {
        filters: [{ column: 'title', operator: '~~*', value: 'launch' }],
        sorts: [{ table: 'tasks', column: 'created_at', ascending: false }],
      },
      columnFormats: { title: 'text' },
    })
    expect(sql).toMatch(/^select \* from public\.tasks/i)
    expect(sql).toMatch(/title(::text)? ~~\* '%launch%'/)
    expect(sql).toMatch(/order by .*created_at.* desc/i)
    expect(sql.trim().endsWith(';')).toBe(false)
  })

  it('treats an empty value on a non-text column as null, as the Table Editor does', () => {
    const sql = buildTableViewSql({
      entity,
      tableView: { filters: [{ column: 'due_at', operator: 'is', value: '' }], sorts: [] },
      columnFormats: { due_at: 'timestamptz' },
    })
    expect(sql).toContain('due_at is null')
  })

  it("keeps auth.users to the Users page's columns when filtered", () => {
    const sql = buildTableViewSql({
      entity: { schema: 'auth', name: 'users' },
      tableView: { filters: [{ column: 'email', operator: '=', value: 'a@b.co' }], sorts: [] },
      columnFormats: { email: 'varchar' },
    })
    expect(sql).not.toContain('*')
    expect(sql).not.toContain('encrypted_password')
    expect(sql).toMatch(/order by .*created_at.* desc/i)
  })
})
