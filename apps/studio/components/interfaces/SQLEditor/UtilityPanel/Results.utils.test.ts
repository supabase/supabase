import { describe, expect, it } from 'vitest'

import {
  convertResultsToCSV,
  convertResultsToJSON,
  convertResultsToMarkdown,
  formatResults,
  getResultsHeaders,
} from './Results.utils'

describe('Results.utils', () => {
  it.each([
    ['convertResultsToMarkdown', convertResultsToMarkdown],
    ['convertResultsToJSON', convertResultsToJSON],
    ['getResultsHeaders', getResultsHeaders],
    ['convertResultsToCSV', convertResultsToCSV],
  ])('%s returns undefined for empty results', (_, fn) => {
    expect(fn([])).toBeUndefined()
  })

  describe('formatResults', () => {
    it.each([
      ['object', { nested: true }, '{"nested":true}'],
      ['array', ['a', 'b'], '["a","b"]'],
      ['null', null, 'null'],
    ])('stringifies %s values', (_, value, expected) => {
      expect(formatResults([{ id: 1, value }])).toEqual([{ id: 1, value: expected }])
    })

    it('leaves primitive values unchanged', () => {
      const results = [{ name: 'test', count: 42, active: true }]
      expect(formatResults(results)).toEqual(results)
      expect(formatResults([])).toEqual([])
    })
  })

  describe('convertResultsToMarkdown', () => {
    it('converts results to a markdown table, stringifying nested objects', () => {
      const md = convertResultsToMarkdown([
        { id: 1, name: 'Alice' },
        { id: 2, name: { role: 'admin' } },
      ])
      expect(md).toContain('| 1  | Alice')
      expect(md).toContain('{"role":"admin"}')
    })

    it('escapes pipe characters so a value cannot split into extra columns', () => {
      const rows = convertResultsToMarkdown([{ id: 1, name: 'a|b' }])!.split('\n')
      // header + separator + one data row, not more
      expect(rows).toHaveLength(3)
      expect(rows[2]).toContain('a\\|b')
    })

    it('escapes backslashes so an escaped pipe cannot be forged', () => {
      expect(convertResultsToMarkdown([{ id: 1, name: 'a\\|b' }])).toContain('a\\\\\\|b')
    })

    it('replaces newlines with <br> so a multiline value cannot create extra table rows', () => {
      const md = convertResultsToMarkdown([
        { id: 1, query: 'select 1;\nselect 2;' },
        { id: 2, query: 'select 3;\r\nselect 4;' },
        { id: 3, query: 'select 5;\rselect 6;' },
      ])
      const rows = md!.split('\n')
      // header + separator + 3 data rows, not more
      expect(rows).toHaveLength(5)
      expect(rows[2]).toContain('select 1;<br>select 2;')
      expect(rows[3]).toContain('select 3;<br>select 4;')
      expect(rows[4]).toContain('select 5;<br>select 6;')
    })
  })

  describe('convertResultsToJSON', () => {
    it('returns a pretty-printed JSON string preserving nested structure', () => {
      const results = [{ id: 1, meta: { role: 'admin' } }]
      expect(convertResultsToJSON(results)).toBe(JSON.stringify(results, null, 2))
    })
  })

  describe('getResultsHeaders', () => {
    it('returns keys in order from the first row only', () => {
      expect(getResultsHeaders([{ z: 1, a: 2, m: 3 }, { extra: 'bonus' }])).toEqual(['z', 'a', 'm'])
    })
  })

  describe('convertResultsToCSV', () => {
    it('writes a header row from the first result keys followed by data rows', () => {
      const csv = convertResultsToCSV([
        { z: 1, name: 'Alice' },
        { z: 2, name: 'Bob' },
      ])
      // split on CRLF line endings produced by papaparse
      expect(csv!.split('\r\n')).toEqual(['z,name', '1,Alice', '2,Bob'])
    })

    it('stringifies and quotes object and array values', () => {
      const csv = convertResultsToCSV([{ meta: { role: 'admin' }, tags: ['a', 'b'], value: null }])
      // CSV wraps values containing special chars in quotes and escapes inner quotes
      expect(csv).toContain('"{""role"":""admin""}"')
      expect(csv).toContain('"[""a"",""b""]"')
      expect(csv).toContain('null')
    })
  })
})
