import { describe, expect, it } from 'vitest'
import { parse } from 'libpg-query'
import { extractIdentifiers } from './sql-identifiers'

describe('extractIdentifiers', () => {
  it('extracts table and column names from a simple SELECT', async () => {
    const identifiers = extractIdentifiers(await parse('SELECT id, name FROM users'))
    expect(identifiers).toEqual(expect.arrayContaining(['users', 'id', 'name']))
  })

  it('extracts schema-qualified table names', async () => {
    const identifiers = extractIdentifiers(await parse('SELECT id FROM public.users'))
    expect(identifiers).toEqual(expect.arrayContaining(['public', 'users', 'id']))
  })

  it('preserves case for quoted identifiers', async () => {
    const identifiers = extractIdentifiers(await parse('SELECT "MyColumn" FROM "MyTable"'))
    expect(identifiers).toEqual(expect.arrayContaining(['MyColumn', 'MyTable']))
  })

  it('lowercases unquoted identifiers with mixed case', async () => {
    const identifiers = extractIdentifiers(await parse('SELECT MyColumn FROM MyTable'))
    expect(identifiers).toEqual(expect.arrayContaining(['mycolumn', 'mytable']))
  })

  it('extracts identifiers from JOINs', async () => {
    const identifiers = extractIdentifiers(
      await parse('SELECT u.id, o.total FROM users u JOIN orders o ON u.id = o.user_id')
    )
    expect(identifiers).toEqual(
      expect.arrayContaining(['users', 'orders', 'id', 'total', 'user_id'])
    )
  })

  it('extracts identifiers from subqueries', async () => {
    const identifiers = extractIdentifiers(
      await parse('SELECT * FROM (SELECT id FROM inner_table) AS sub')
    )
    expect(identifiers).toEqual(expect.arrayContaining(['inner_table', 'id']))
  })

  it('handles INSERT statements', async () => {
    const identifiers = extractIdentifiers(
      await parse('INSERT INTO users (name, email) VALUES ($1, $2)')
    )
    expect(identifiers).toEqual(expect.arrayContaining(['users', 'name', 'email']))
  })

  it('handles UPDATE statements', async () => {
    const identifiers = extractIdentifiers(await parse('UPDATE users SET name = $1 WHERE id = $2'))
    expect(identifiers).toEqual(expect.arrayContaining(['users', 'name', 'id']))
  })

  it('handles CREATE TABLE statements', async () => {
    const identifiers = extractIdentifiers(
      await parse('CREATE TABLE "MyTable" ("MyColumn" TEXT, other_col INT)')
    )
    expect(identifiers).toEqual(expect.arrayContaining(['MyTable', 'MyColumn', 'other_col']))
  })

  it('returns empty array when no identifiers exist', async () => {
    const identifiers = extractIdentifiers(await parse('SELECT 1'))
    expect(identifiers).toEqual([])
  })
})
