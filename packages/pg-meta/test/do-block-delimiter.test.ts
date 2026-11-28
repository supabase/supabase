import { describe, expect, test } from 'vitest'

import { getDoBlockDelimiter } from '../src/helpers'
import { safeSql } from '../src/pg-format'
import columnsMeta from '../src/pg-meta-columns'
import { update as updateTable } from '../src/pg-meta-tables'

// Mimics how Postgres parses a dollar-quoted DO block: the body runs from the
// opening tag up to the *next* occurrence of the exact same tag. If the tag
// appears inside the body (e.g. `$$` inside an interpolated identifier), the
// block is truncated and the statement is broken.
function parseDoBlocks(sql: string): { tag: string; body: string; closed: boolean }[] {
  const blocks: { tag: string; body: string; closed: boolean }[] = []
  const opener = /DO (\$[A-Za-z_0-9]*\$)/g
  let match: RegExpExecArray | null
  while ((match = opener.exec(sql)) !== null) {
    const tag = match[1]
    const bodyStart = match.index + match[0].length
    const closeIndex = sql.indexOf(tag, bodyStart)
    blocks.push({
      tag,
      body: closeIndex === -1 ? sql.slice(bodyStart) : sql.slice(bodyStart, closeIndex),
      closed: closeIndex !== -1,
    })
    opener.lastIndex = closeIndex === -1 ? sql.length : closeIndex + tag.length
  }
  return blocks
}

// Every DO block in the generated SQL must survive Postgres's dollar-quote
// parsing with the interpolated identifiers intact.
function expectDoBlocksIntact(sql: string, identifiers: string[]) {
  const blocks = parseDoBlocks(sql)
  expect(blocks.length).toBeGreaterThan(0)
  for (const block of blocks) {
    expect(block.closed).toBe(true)
    for (const identifier of identifiers) {
      expect(block.body).toContain(identifier)
    }
  }
}

describe('getDoBlockDelimiter', () => {
  test('returns the default delimiter when values are clean', () => {
    expect(getDoBlockDelimiter(['public', 'users'])).toBe('$pg_meta$')
  })

  test('escalates the delimiter when a value contains the default', () => {
    expect(getDoBlockDelimiter(['$pg_meta$'])).toBe('$pg_meta_1$')
    expect(getDoBlockDelimiter(['$pg_meta$', '$pg_meta_1$'])).toBe('$pg_meta_2$')
  })

  test('escalates past $$-style collisions', () => {
    expect(getDoBlockDelimiter(['weird$$name'])).toBe('$pg_meta$')
  })
})

describe('dollar-quote safety with $$ in identifiers (supabase/supabase#49688)', () => {
  test('tables.update primary-key drop survives a $$ table name', () => {
    const { sql } = updateTable(
      { id: 1, name: 'weird$$name', schema: 'public' },
      { primary_keys: [] }
    )
    expectDoBlocksIntact(String(sql), ['weird$$name'])
  })

  test('tables.update primary-key drop is unchanged for normal names', () => {
    const { sql } = updateTable({ id: 1, name: 'users', schema: 'public' }, { primary_keys: [] })
    expect(String(sql)).toContain('DO $pg_meta$')
    expectDoBlocksIntact(String(sql), ['public.users'])
  })

  test('columns.update unique drop survives a $$ table name', () => {
    const { sql } = columnsMeta.update(
      {
        name: 'email',
        schema: 'public',
        table: 'weird$$name',
        table_id: 42,
        ordinal_position: 2,
        is_identity: false,
        is_unique: true,
      },
      { is_unique: false }
    )
    expectDoBlocksIntact(String(sql), ['weird$$name'])
  })

  test('columns.update check replace survives a $$ schema and table name', () => {
    const { sql } = columnsMeta.update(
      {
        name: 'price',
        schema: 'odd$$schema',
        table: 'weird$$name',
        table_id: 42,
        ordinal_position: 3,
        is_identity: false,
        is_unique: false,
      },
      { check: safeSql`price > 0` }
    )
    expectDoBlocksIntact(String(sql), ['odd$$schema.weird$$name'])
  })
})
