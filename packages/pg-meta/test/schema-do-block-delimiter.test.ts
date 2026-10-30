import { describe, expect, test } from 'vitest'

import schemasMeta from '../src/pg-meta-schemas'

const { update, remove } = schemasMeta

// Mimics how Postgres parses a dollar-quoted DO block: the body runs from the
// opening tag up to the *next* occurrence of the exact same tag. If the tag
// appears inside the body (e.g. `$$` inside an interpolated identifier), the
// block is truncated and the statement is broken.
function parseDoBlocks(sql: string): { tag: string; body: string; closed: boolean }[] {
  const blocks: { tag: string; body: string; closed: boolean }[] = []
  const opener = /do (\$[A-Za-z_0-9]*\$)/gi
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
// parsing with the interpolated values intact.
function expectDoBlocksIntact(sql: string, values: string[]) {
  const blocks = parseDoBlocks(sql)
  expect(blocks.length).toBeGreaterThan(0)
  for (const block of blocks) {
    expect(block.closed).toBe(true)
    for (const value of values) {
      expect(block.body).toContain(value)
    }
  }
}

describe('schemas.update DO block dollar-quote safety (supabase/supabase#50882)', () => {
  test('rename survives a $$ schema name', () => {
    const { sql } = update({ name: 'weird$$name' }, { name: 'weird$$name' })
    expectDoBlocksIntact(String(sql), ["'weird$$name'"])
  })

  test('rename is unchanged for normal names', () => {
    const { sql } = update({ name: 'public' }, { name: 'app' })
    expect(String(sql)).toContain('do $pg_meta$')
    expectDoBlocksIntact(String(sql), ["'public'", "'app'"])
  })

  test('owner change survives a $$ role name', () => {
    const { sql } = update({ name: 'public' }, { owner: 'odd$$owner' })
    expectDoBlocksIntact(String(sql), ["'odd$$owner'"])
  })

  test('escalates the delimiter when the name contains $pg_meta$', () => {
    const { sql } = update({ name: '$pg_meta$' }, { name: 'app' })
    expect(String(sql)).toContain('do $pg_meta_1$')
    expectDoBlocksIntact(String(sql), ["'$pg_meta$'"])
  })
})

describe('schemas.remove DO block dollar-quote safety', () => {
  test('remove survives a $$ schema name', () => {
    const { sql } = remove({ name: 'weird$$name' })
    expectDoBlocksIntact(String(sql), ["'weird$$name'"])
  })

  test('remove is unchanged for normal names', () => {
    const { sql } = remove({ name: 'app' })
    expect(String(sql)).toContain('do $pg_meta$')
    expectDoBlocksIntact(String(sql), ["'app'"])
  })
})
