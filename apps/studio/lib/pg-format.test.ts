import { describe, it, expect } from 'vitest'
import { quoteLiteral } from './pg-format'

describe('quoteLiteral', () => {
  it('returns NULL for null and undefined', () => {
    expect(quoteLiteral(null)).toBe('NULL')
    expect(quoteLiteral(undefined)).toBe('NULL')
  })

  it('returns correct literals for booleans', () => {
    expect(quoteLiteral(true)).toBe("'t'")
    expect(quoteLiteral(false)).toBe("'f'")
  })

  it('returns quoted string for numbers', () => {
    expect(quoteLiteral(123)).toBe("'123'")
    expect(quoteLiteral(-45.67)).toBe("'-45.67'")
  })

  it('escapes single quotes and backslashes in strings', () => {
    expect(quoteLiteral("O'Reilly")).toBe("'O''Reilly'")
    expect(quoteLiteral('back\\slash')).toBe("E'back\\\\slash'")
    expect(quoteLiteral("quote'and\\backslash")).toBe("E'quote''and\\\\backslash'")
  })

  it('formats Date objects as UTC strings', () => {
    const date = new Date('2023-01-01T12:34:56Z')
    expect(quoteLiteral(date)).toBe("'2023-01-01 12:34:56.000+00'")
  })

  it('handles Buffer objects', () => {
    expect(quoteLiteral(Buffer.from('abc'))).toBe("E'\\\\x616263'")
  })

  it('formats arrays of primitives', () => {
    expect(quoteLiteral([1, 2, 3])).toBe("'1','2','3'")
    expect(quoteLiteral(['a', "b'c", 'd'])).toBe("'a','b''c','d'")
  })

  it('formats nested arrays', () => {
    expect(
      quoteLiteral([
        [1, 2],
        [3, 4],
      ])
    ).toBe("('1', '2'), ('3', '4')")
  })

  it('formats objects as jsonb', () => {
    expect(quoteLiteral({ foo: 'bar', n: 1 })).toBe('\'{"foo":"bar","n":1}\'::jsonb')
  })

  it('handles empty string', () => {
    expect(quoteLiteral('')).toBe("''")
  })
})
