import { describe, it, expect } from 'vitest'
import { processResultsToExport } from '../../lib/helpers'

describe('processResultsToExport', () => {
  it('should handle simple objects without JSON fields', () => {
    const input = [{ name: 'John', age: 30, active: true }]
    const result = processResultsToExport(input, { wrapJsonObjects: false })
    expect(result).toEqual(input)
  })

  it('should process JSON objects and escape for CSV when wrapJsonObjects=true', () => {
    const jsonObject = { key: 'value' }
    const input = [{ id: 1, data: jsonObject }]
    const result = processResultsToExport(input, { wrapJsonObjects: true })
    expect(result[0].data).toBe('""{""key"":""value""}""')
  })

  it('should process JSON objects and not escape them when wrapJsonObjects=false for Markdown copy', () => {
    const jsonObject = { key: 'value' }
    const input = [{ id: 1, data: jsonObject }]
    const result = processResultsToExport(input, { wrapJsonObjects: false })
    expect(result[0].data).toBe('{"key":"value"}')
  })

  it('should handle nested JSON objects correctly and escape them for CSV exports when wrapJsonObjects=true', () => {
    const nestedObject = {
      user: { name: 'John' },
      settings: { theme: 'dark' },
    }
    const input = [{ id: 1, config: nestedObject }]
    const result = processResultsToExport(input, { wrapJsonObjects: true })
    expect(result[0].config).toBe(
      '""{""user"":{""name"":""John""},""settings"":{""theme"":""dark""}}""'
    )
  })

  it('should handle multiple rows with JSON objects for CSV export', () => {
    const input = [
      { id: 1, data: { x: 1 } },
      { id: 2, data: { x: 2 } },
    ]
    const result = processResultsToExport(input, { wrapJsonObjects: true })
    expect(result[0].data).toBe('""{""x"":1}""')
    expect(result[1].data).toBe('""{""x"":2}""')
  })

  it('should handle multiple rows with JSON objects for Copy as markdown', () => {
    const input = [
      { id: 1, data: { x: 1 } },
      { id: 2, data: { x: 2 } },
    ]
    const result = processResultsToExport(input, { wrapJsonObjects: false })
    expect(result[0].data).toBe('{"x":1}')
    expect(result[1].data).toBe('{"x":2}')
  })

  it('should preserve non-object values', () => {
    const input = [
      {
        id: 1,
        name: 'Test',
        number: 42,
        boolean: true,
        object: { test: true },
      },
    ]
    const result = processResultsToExport(input, { wrapJsonObjects: true })
    expect(result[0].id).toBe(1)
    expect(result[0].name).toBe('Test')
    expect(result[0].number).toBe(42)
    expect(result[0].boolean).toBe(true)
    expect(result[0].object).toBe('""{""test"":true}""')
  })
})
