import { describe, expect, test } from 'vitest'

import { getDoBlockDelimiter } from '../src/helpers'
import { safeSql } from '../src/pg-format'
import { update as updateFunction, type PGSavedFunction } from '../src/pg-meta-functions'

// Mimics how Postgres parses a dollar-quoted DO block: the body runs from the
// opening tag up to the *next* occurrence of the exact same tag. If the tag
// appears inside the body (e.g. `$$` inside an interpolated value), the block
// is truncated and the statement is broken. Handles `DO <tag>` and
// `DO LANGUAGE plpgsql <tag>` openers.
function parseDoBlocks(sql: string): { tag: string; body: string; closed: boolean }[] {
  const blocks: { tag: string; body: string; closed: boolean }[] = []
  const opener = /\bdo\b(?:\s+language\s+[a-zA-Z_]+)?\s*(\$[A-Za-z_0-9]*\$)/gi
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

const testFunction = {
  id: 7,
  schema: 'public',
  name: 'greet',
  language: 'plpgsql',
  definition: 'begin return 1; end',
  behavior: 'VOLATILE',
  security_definer: false,
  type: 'function',
  argument_types: safeSql``,
  identity_argument_types: safeSql``,
  return_type: safeSql`integer`,
  config_params: null,
} as unknown as PGSavedFunction

describe('getDoBlockDelimiter', () => {
  test('returns the default delimiter when values are clean', () => {
    expect(getDoBlockDelimiter(['public', 'greet'])).toBe('$pg_meta$')
  })

  test('escalates the delimiter when a value contains the default', () => {
    expect(getDoBlockDelimiter(['$pg_meta$'])).toBe('$pg_meta_1$')
    expect(getDoBlockDelimiter(['$pg_meta$', '$pg_meta_1$'])).toBe('$pg_meta_2$')
  })

  test('default delimiter is fine for values containing $$', () => {
    expect(getDoBlockDelimiter(['weird$$name'])).toBe('$pg_meta$')
  })
})

describe('dollar-quote safety with $$ in values', () => {
  test('functions.update survives $$ in the function body', () => {
    const { sql } = updateFunction(testFunction, { definition: 'select $$nested$$' })
    expectDoBlocksIntact(String(sql), ['$$nested$$'])
  })

  test('functions.update survives a $$ function name', () => {
    const { sql } = updateFunction(testFunction, { name: 'weird$$name' })
    expectDoBlocksIntact(String(sql), ['weird$$name'])
  })

  test('functions.update is unchanged for normal values', () => {
    const { sql } = updateFunction(testFunction, { definition: 'select 1' })
    expect(String(sql)).toContain('DO LANGUAGE plpgsql $pg_meta$')
    expectDoBlocksIntact(String(sql), ['select 1'])
  })
})
