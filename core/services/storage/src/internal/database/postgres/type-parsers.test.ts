import { describe, expect, it, vi } from 'vitest'
import { installPostgresTypeParsers, type PostgresTypeParserRegistry } from './type-parsers'

describe('PostgreSQL type parsers', () => {
  it('installs the existing process-global textual int8 parser', () => {
    const setTypeParser = vi.fn()
    const registry = { setTypeParser } as unknown as PostgresTypeParserRegistry

    installPostgresTypeParsers(registry)

    expect(setTypeParser).toHaveBeenCalledWith(20, 'text', parseInt)

    const parseInt8 = setTypeParser.mock.calls[0]?.[2] as (value: string) => number

    expect(parseInt8('42')).toBe(42)
    expect(parseInt8('-42')).toBe(-42)
    expect(parseInt8('0x10')).toBe(16)
  })
})
