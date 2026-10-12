import { describe, expect, it } from 'vitest'

import {
  convertResultsToCSV,
  convertResultsToJSON,
  convertResultsToMarkdown,
  formatResults,
  getResultsHeaders,
} from './Results.utils'

describe('Results.utils', () => {
  describe('formatResults', () => {
    it('should stringify object values', () => {
      const results = [{ id: 1, data: { nested: true } }]
      const formatted = formatResults(results)
      expect(formatted).toEqual([{ id: 1, data: '{"nested":true}' }])
    })

    it('should stringify array values', () => {
      const results = [{ id: 1, tags: ['a', 'b'] }]
      const formatted = formatResults(results)
      expect(formatted).toEqual([{ id: 1, tags: '["a","b"]' }])
    })

    it('should stringify null values', () => {
      const results = [{ id: 1, value: null }]
      const formatted = formatResults(results)
      expect(formatted).toEqual([{ id: 1, value: 'null' }])
    })

    it('should leave primitive values unchanged', () => {
      const results = [{ name: 'test', count: 42, active: true }]
      const formatted = formatResults(results)
      expect(formatted).toEqual([{ name: 'test', count: 42, active: true }])
    })

    it('should return empty array for empty input', () => {
      expect(formatResults([])).toEqual([])
    })
  })

  describe('convertResultsToMarkdown', () => {
    it('should return undefined for empty results', () => {
      expect(convertResultsToMarkdown([])).toBeUndefined()
    })

    it('should convert results to a markdown table', () => {
      const results = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]
      const md = convertResultsToMarkdown(results)
      expect(md).toContain('| id | name  |')
      expect(md).toContain('| 1  | Alice |')
      expect(md).toContain('| 2  | Bob   |')
    })

    it('should stringify nested objects in markdown output', () => {
      const results = [{ id: 1, meta: { role: 'admin' } }]
      const md = convertResultsToMarkdown(results)
      expect(md).toContain('{"role":"admin"}')
    })

    it('should escape pipe characters so a value cannot split into extra columns', () => {
      const results = [{ id: 1, name: 'a|b' }]
      const md = convertResultsToMarkdown(results)
      const rows = md!.split('\n')
      // header + separator + one data row, not more
      expect(rows).toHaveLength(3)
      expect(rows[2]).toContain('a\\|b')
    })

    it('should escape backslashes so an escaped pipe cannot be forged', () => {
      const results = [{ id: 1, name: 'a\\|b' }]
      const md = convertResultsToMarkdown(results)
      expect(md).toContain('a\\\\\\|b')
    })

    it('should replace newlines with <br> so a multiline value cannot create extra table rows', () => {
      const results = [
        { id: 1, query: 'select 1;\nselect 2;' },
        { id: 2, query: 'select 3;\r\nselect 4;' },
        { id: 3, query: 'select 5;\rselect 6;' },
      ]
      const md = convertResultsToMarkdown(results)
      const rows = md!.split('\n')
      // header + separator + 3 data rows, not more
      expect(rows).toHaveLength(5)
      expect(rows[2]).toContain('select 1;<br>select 2;')
      expect(rows[3]).toContain('select 3;<br>select 4;')
      expect(rows[4]).toContain('select 5;<br>select 6;')
    })
  })

  describe('convertResultsToJSON', () => {
    it('should return undefined for empty results', () => {
      expect(convertResultsToJSON([])).toBeUndefined()
    })

    it('should return formatted JSON string', () => {
      const results = [{ id: 1, name: 'Alice' }]
      const json = convertResultsToJSON(results)
      expect(json).toBe(JSON.stringify(results, null, 2))
    })

    it('should preserve nested object structure', () => {
      const results = [{ id: 1, meta: { role: 'admin' } }]
      const json = convertResultsToJSON(results)
      const parsed = JSON.parse(json!)
      expect(parsed[0].meta.role).toBe('admin')
    })
  })

  describe('getResultsHeaders', () => {
    it('should return undefined for empty results', () => {
      expect(getResultsHeaders([])).toBeUndefined()
    })

    it('should return keys from the first row', () => {
      const results = [{ id: 1, name: 'Alice' }]
      expect(getResultsHeaders(results)).toEqual(['id', 'name'])
    })

    it('should preserve key order from the first row', () => {
      const results = [{ z: 1, a: 2, m: 3 }]
      expect(getResultsHeaders(results)).toEqual(['z', 'a', 'm'])
    })

    it('should use only the first row for headers', () => {
      const results = [{ id: 1 }, { id: 2, extra: 'bonus' }]
      expect(getResultsHeaders(results)).toEqual(['id'])
    })
  })

  describe('convertResultsToCSV', () => {
    it('should return undefined for empty results', () => {
      expect(convertResultsToCSV([])).toBeUndefined()
    })

    it('should include header row from first result keys', () => {
      const results = [{ id: 1, name: 'Alice' }]
      const csv = convertResultsToCSV(results)
      expect(csv).toContain('id,name')
    })

    it('should include data rows', () => {
      const results = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]
      const csv = convertResultsToCSV(results)
      expect(csv).toContain('Alice')
      expect(csv).toContain('Bob')
    })

    it('should stringify object values', () => {
      const results = [{ id: 1, meta: { role: 'admin' } }]
      const csv = convertResultsToCSV(results)
      // CSV wraps values containing special chars in quotes and escapes inner quotes
      expect(csv).toContain('"{""role"":""admin""}"')
    })

    it('should stringify array values', () => {
      const results = [{ id: 1, tags: ['a', 'b'] }]
      const csv = convertResultsToCSV(results)
      // CSV wraps values containing special chars in quotes and escapes inner quotes
      expect(csv).toContain('"[""a"",""b""]"')
    })

    it('should stringify null values', () => {
      const results = [{ id: 1, value: null }]
      const csv = convertResultsToCSV(results)
      expect(csv).toContain('null')
    })

    it('should preserve column order from first row', () => {
      const results = [{ z: 1, a: 2, m: 3 }]
      const csv = convertResultsToCSV(results)
      // split on CRLF line endings produced by papaparse
      const headerRow = csv!.split('\r\n')[0]
      expect(headerRow).toBe('z,a,m')
    })
  })
})
