import { describe, expect, it } from 'vitest'

import { parseSearch, searchParamsToRecord, stringifySearch } from './router-search-params'

describe('parseSearch (Next-style semantics)', () => {
  it('returns an empty record for empty input', () => {
    expect(parseSearch('')).toEqual({})
    expect(parseSearch('?')).toEqual({})
  })

  it('accepts input with or without the leading "?"', () => {
    expect(parseSearch('?a=1')).toEqual({ a: '1' })
    expect(parseSearch('a=1')).toEqual({ a: '1' })
  })

  it('keeps every value a plain string — no JSON parsing or type coercion', () => {
    expect(parseSearch('?page=2&flag=true&nul=null')).toEqual({
      page: '2',
      flag: 'true',
      nul: 'null',
    })
  })

  it('does not parse JSON-looking text into objects', () => {
    expect(parseSearch(`?q=${encodeURIComponent('{"a":1}')}`)).toEqual({ q: '{"a":1}' })
  })

  it('collects repeated keys into a string array, in order', () => {
    expect(parseSearch('?filter=a:eq:1&filter=b:eq:2&page=2')).toEqual({
      filter: ['a:eq:1', 'b:eq:2'],
      page: '2',
    })
  })

  it('decodes percent-encoding exactly once', () => {
    // `%3Aeq%3A1` must decode to `:eq:1`, not stay encoded or double-decode.
    expect(parseSearch('?sort=name%3Aasc')).toEqual({ sort: 'name:asc' })
    expect(parseSearch('?v=%2540')).toEqual({ v: '%40' })
  })

  it('decodes "+" as a space (URLSearchParams / Next behavior)', () => {
    expect(parseSearch('?q=hello+world')).toEqual({ q: 'hello world' })
    expect(parseSearch('?q=hello%20world')).toEqual({ q: 'hello world' })
  })

  it('preserves empty-string values and bare keys', () => {
    expect(parseSearch('?a=&b')).toEqual({ a: '', b: '' })
  })

  it('decodes unicode values', () => {
    expect(parseSearch(`?name=${encodeURIComponent('日本語 déjà')}`)).toEqual({
      name: '日本語 déjà',
    })
  })
})

describe('stringifySearch', () => {
  it('returns an empty string for an empty record', () => {
    expect(stringifySearch({})).toBe('')
  })

  it('never quotes strings, even ones that are valid JSON', () => {
    expect(stringifySearch({ flag: 'true', page: '2' })).toBe('?flag=true&page=2')
    expect(stringifySearch({ q: '{"a":1}' })).toBe('?q=%7B%22a%22%3A1%7D')
  })

  it('emits repeated keys for arrays', () => {
    expect(stringifySearch({ filter: ['a', 'b'], x: '1' })).toBe('?filter=a&filter=b&x=1')
  })

  it('serializes numbers and booleans from TanStack-native code with String()', () => {
    expect(stringifySearch({ page: 2, flag: true })).toBe('?page=2&flag=true')
  })

  it('omits null and undefined values (including inside arrays)', () => {
    expect(stringifySearch({ a: undefined, b: null, c: 'x' })).toBe('?c=x')
    expect(stringifySearch({ a: ['x', null, undefined, 'y'] })).toBe('?a=x&a=y')
    expect(stringifySearch({ a: undefined })).toBe('')
  })

  it('keeps empty-string values', () => {
    expect(stringifySearch({ a: '' })).toBe('?a=')
  })
})

describe('round-trip stability', () => {
  const roundTrip = (searchStr: string) => stringifySearch(parseSearch(searchStr))

  it('is byte-stable for typical Studio URLs', () => {
    for (const input of [
      '?page=2&flag=true',
      '?filter=a%3Aeq%3A1&filter=b%3Aeq%3A2&page=2&flag=true',
      '?provider=apple',
      '?q=hello+world',
      '?a=&b=1',
    ]) {
      expect(roundTrip(input)).toBe(input)
      // A second pass must not change anything either.
      expect(roundTrip(roundTrip(input))).toBe(roundTrip(input))
    }
  })

  it('reaches a stable encoding after one pass for unencoded input', () => {
    // `:` normalizes to `%3A` (standard URLSearchParams encoding), then stays put.
    const once = roundTrip('?filter=a:eq:1&filter=b:eq:2')
    expect(once).toBe('?filter=a%3Aeq%3A1&filter=b%3Aeq%3A2')
    expect(roundTrip(once)).toBe(once)
  })

  it('round-trips unicode', () => {
    const input = `?name=${encodeURIComponent('日本語')}`
    expect(roundTrip(input)).toBe(input)
  })
})

describe('searchParamsToRecord', () => {
  it('collapses URLSearchParams into the Next query shape', () => {
    expect(searchParamsToRecord(new URLSearchParams('a=1&b=2&b=3'))).toEqual({
      a: '1',
      b: ['2', '3'],
    })
  })
})
