import { describe, expect, it } from 'vitest'
import { parse } from 'libpg-query'
import { extractIdentifiers } from './sql-identifiers'

describe('extractIdentifiers', () => {
  it('extracts table and column names from a simple SELECT', async () => {
    const ast = await parse('SELECT id, name FROM users')
    const identifiers = extractIdentifiers(ast)

    expect(identifiers).toContain('users')
    expect(identifiers).toContain('id')
    expect(identifiers).toContain('name')
  })

  it('extracts schema-qualified table names', async () => {
    const ast = await parse('SELECT id FROM public.users')
    const identifiers = extractIdentifiers(ast)

    expect(identifiers).toContain('public')
    expect(identifiers).toContain('users')
    expect(identifiers).toContain('id')
  })

  it('preserves case for quoted identifiers', async () => {
    const ast = await parse('SELECT "MyColumn" FROM "MyTable"')
    const identifiers = extractIdentifiers(ast)

    expect(identifiers).toContain('MyColumn')
    expect(identifiers).toContain('MyTable')
  })

  it('lowercases unquoted identifiers with mixed case', async () => {
    const ast = await parse('SELECT MyColumn FROM MyTable')
    const identifiers = extractIdentifiers(ast)

    // PostgreSQL folds unquoted identifiers to lowercase
    expect(identifiers).toContain('mycolumn')
    expect(identifiers).toContain('mytable')
  })

  it('extracts identifiers from JOINs', async () => {
    const ast = await parse(`
      SELECT u.id, o.total
      FROM users u
      JOIN orders o ON u.id = o.user_id
    `)
    const identifiers = extractIdentifiers(ast)

    expect(identifiers).toContain('users')
    expect(identifiers).toContain('orders')
    expect(identifiers).toContain('id')
    expect(identifiers).toContain('total')
    expect(identifiers).toContain('user_id')
  })

  it('extracts identifiers from subqueries', async () => {
    const ast = await parse(`
      SELECT * FROM (SELECT id FROM inner_table) AS sub
    `)
    const identifiers = extractIdentifiers(ast)

    expect(identifiers).toContain('inner_table')
    expect(identifiers).toContain('id')
  })

  it('handles INSERT statements', async () => {
    const ast = await parse('INSERT INTO users (name, email) VALUES ($1, $2)')
    const identifiers = extractIdentifiers(ast)

    expect(identifiers).toContain('users')
    expect(identifiers).toContain('name')
    expect(identifiers).toContain('email')
  })

  it('handles UPDATE statements', async () => {
    const ast = await parse('UPDATE users SET name = $1 WHERE id = $2')
    const identifiers = extractIdentifiers(ast)

    expect(identifiers).toContain('users')
    expect(identifiers).toContain('name')
    expect(identifiers).toContain('id')
  })

  it('returns empty array when no identifiers exist', async () => {
    const ast = await parse('SELECT 1')
    const identifiers = extractIdentifiers(ast)
    expect(identifiers).toEqual([])
  })
})
