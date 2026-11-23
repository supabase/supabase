import { describe, expect, it } from 'vitest'

import { convertArgumentTypes } from '@/components/interfaces/Database/Functions/Functions.utils'

describe('convertArgumentTypes', () => {
  it('parses simple argument types', () => {
    expect(convertArgumentTypes({ type: 'function', value: 'a integer, b text' })).toEqual({
      value: [
        { name: 'a', type: 'integer', defaultValue: undefined },
        { name: 'b', type: 'text', defaultValue: undefined },
      ],
    })
  })

  it.each([
    ['a character varying', 'character varying'],
    ['a double precision', 'double precision'],
    ['a timestamp with time zone', 'timestamp with time zone'],
    ['a public.my_type', 'public.my_type'],
    ['a text[]', 'text[]'],
    ['a numeric(10,2)', 'numeric(10,2)'],
  ])('keeps the full type for %s', (value, type) => {
    expect(convertArgumentTypes({ type: 'function', value })).toEqual({
      value: [{ name: 'a', type, defaultValue: undefined }],
    })
  })

  it('keeps a default value that contains a comma inside the same argument', () => {
    expect(
      convertArgumentTypes({
        type: 'function',
        value: "a text DEFAULT 'x, y'::text, b integer DEFAULT 1",
      })
    ).toEqual({
      value: [
        { name: 'a', type: 'text', defaultValue: "'x, y'::text" },
        { name: 'b', type: 'integer', defaultValue: '1' },
      ],
    })
  })

  it('keeps a quoted argument name intact', () => {
    expect(convertArgumentTypes({ type: 'function', value: '"weird name" text' })).toEqual({
      value: [{ name: '"weird name"', type: 'text', defaultValue: undefined }],
    })
  })

  it('strips IN mode prefixes from procedure arguments', () => {
    expect(convertArgumentTypes({ type: 'procedure', value: 'IN a integer, IN b text' })).toEqual({
      value: [
        { name: 'a', type: 'integer', defaultValue: undefined },
        { name: 'b', type: 'text', defaultValue: undefined },
      ],
    })
  })

  it.each(['', '   '])('returns no arguments for an empty value: %s', (value) => {
    expect(convertArgumentTypes({ type: 'function', value })).toEqual({ value: [] })
  })
})
