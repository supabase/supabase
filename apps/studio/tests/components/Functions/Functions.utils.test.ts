import { describe, expect, it } from 'vitest'

import {
  convertArgumentTypes,
  formatArgumentDeclarations,
  getNewArgumentIndex,
  stripInArgModePrefixes,
} from '@/components/interfaces/Database/Functions/Functions.utils'

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

  it('keeps commas inside quoted procedure argument names and defaults', () => {
    expect(
      convertArgumentTypes({ type: 'procedure', value: 'IN "first, IN second" text' })
    ).toEqual({
      value: [{ name: '"first, IN second"', type: 'text', defaultValue: undefined }],
    })
    expect(
      convertArgumentTypes({ type: 'procedure', value: "IN a text DEFAULT 'x, IN y'::text" })
    ).toEqual({
      value: [{ name: 'a', type: 'text', defaultValue: "'x, IN y'::text" }],
    })
  })

  it('preserves unnamed arguments when pg-meta provides their names', () => {
    expect(
      convertArgumentTypes({
        type: 'function',
        value: 'integer DEFAULT 1, b text',
        argumentNames: ['', 'b'],
      })
    ).toEqual({
      value: [
        { name: '', type: 'integer', defaultValue: '1' },
        { name: 'b', type: 'text', defaultValue: undefined },
      ],
    })
  })

  it('preserves unnamed multi-word types and procedure modes', () => {
    expect(
      convertArgumentTypes({
        type: 'function',
        value: 'double precision DEFAULT 1.5',
        argumentNames: [''],
      })
    ).toEqual({
      value: [{ name: '', type: 'double precision', defaultValue: '1.5' }],
    })

    expect(
      convertArgumentTypes({
        type: 'procedure',
        value: 'IN integer DEFAULT 1',
        argumentNames: [''],
      })
    ).toEqual({
      value: [{ name: '', type: 'integer', defaultValue: '1' }],
    })
  })

  it.each(['', '   '])('returns no arguments for an empty value: %s', (value) => {
    expect(convertArgumentTypes({ type: 'function', value })).toEqual({ value: [] })
  })
})

describe('stripInArgModePrefixes', () => {
  it('only strips an IN token at the start of each top-level argument', () => {
    expect(stripInArgModePrefixes('IN a integer, IN b text')).toBe('a integer, b text')
    expect(stripInArgModePrefixes('IN "first, IN second" text')).toBe('"first, IN second" text')
    expect(stripInArgModePrefixes("IN a text DEFAULT 'x, IN y'::text")).toBe(
      "a text DEFAULT 'x, IN y'::text"
    )
  })
})

describe('formatArgumentDeclarations', () => {
  it('serializes a comma default exactly as parsed', () => {
    const { value } = convertArgumentTypes({
      type: 'function',
      value: "f text DEFAULT 'x, y'::text, g integer DEFAULT 1",
    })

    expect(formatArgumentDeclarations(value)).toEqual([
      "f text DEFAULT 'x, y'::text",
      'g integer DEFAULT 1',
    ])
  })

  it('does not append DEFAULT for arguments without one', () => {
    expect(formatArgumentDeclarations([{ name: 'a', type: 'integer' }])).toEqual(['a integer'])
  })

  it('keeps a timestamp default expression unchanged', () => {
    const { value } = convertArgumentTypes({
      type: 'function',
      value: 'a timestamp without time zone DEFAULT now()',
    })

    expect(value).toEqual([
      { name: 'a', type: 'timestamp without time zone', defaultValue: 'now()' },
    ])
    expect(formatArgumentDeclarations(value)).toEqual([
      'a timestamp without time zone DEFAULT now()',
    ])
  })

  it('serializes unnamed arguments without a leading name', () => {
    expect(formatArgumentDeclarations([{ name: '', type: 'integer', defaultValue: '1' }])).toEqual([
      'integer DEFAULT 1',
    ])
  })
})

describe('getNewArgumentIndex', () => {
  it('appends when no argument has a default', () => {
    expect(getNewArgumentIndex([{ name: 'a', type: 'integer', defaultValue: undefined }])).toBe(1)
  })

  it('inserts before the first defaulted argument', () => {
    expect(
      getNewArgumentIndex([
        { name: 'a', type: 'integer', defaultValue: undefined },
        { name: 'b', type: 'text', defaultValue: 'x' },
      ])
    ).toBe(1)
    expect(
      getNewArgumentIndex([
        { name: 'a', type: 'integer', defaultValue: '1' },
        { name: 'b', type: 'text', defaultValue: 'x' },
      ])
    ).toBe(0)
  })
})
