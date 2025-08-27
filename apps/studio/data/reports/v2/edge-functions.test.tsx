import { describe, expect, it } from 'vitest'
import {
  extractStatusCodesFromData,
  generateStatusCodeAttributes,
  transformStatusCodeData,
} from './edge-functions.config'

describe('extractStatusCodesFromData', () => {
  it('should extract and sort unique status codes from the data', () => {
    const data = [
      { status_code: 200 },
      { status_code: 500 },
      { status_code: 200 },
      { status_code: 404 },
    ]
    const result = extractStatusCodesFromData(data)
    expect(result).toEqual(['200', '404', '500'])
  })

  it('should handle an empty array', () => {
    const data: any[] = []
    const result = extractStatusCodesFromData(data)
    expect(result).toEqual([])
  })

  it('should handle data with missing status_code properties', () => {
    const data = [{ status_code: 200 }, {}, { status_code: 500 }]
    const result = extractStatusCodesFromData(data)
    expect(result).toEqual(['200', '500'])
  })

  it('should handle various data types for status_code', () => {
    const data = [{ status_code: 200 }, { status_code: '500' }, { status_code: 404 }]
    const result = extractStatusCodesFromData(data)
    expect(result).toEqual(['200', '404', '500'])
  })
})

describe('generateStatusCodeAttributes', () => {
  it('should generate the correct attributes for a list of status codes', () => {
    const statusCodes = ['200', '404', '500']
    const result = generateStatusCodeAttributes(statusCodes)
    expect(result.map(({ color, ...rest }) => rest)).toEqual([
      {
        attribute: '200',
        label: '200 OK',
      },
      {
        attribute: '404',
        label: '404 Not Found',
      },
      {
        attribute: '500',
        label: '500 Internal Server Error',
      },
    ])
  })

  it('should handle an empty array', () => {
    const statusCodes: string[] = []
    const result = generateStatusCodeAttributes(statusCodes)
    expect(result).toEqual([])
  })
})

describe('transformStatusCodeData', () => {
  it('should pivot the data correctly', () => {
    const data = [
      { timestamp: '2023-01-01T00:00:00Z', status_code: 200, count: 10 },
      { timestamp: '2023-01-01T00:00:00Z', status_code: 500, count: 5 },
      { timestamp: '2023-01-02T00:00:00Z', status_code: 200, count: 20 },
    ]
    const result = transformStatusCodeData(data, ['200', '500'])
    expect(result).toEqual([
      { timestamp: '2023-01-01T00:00:00.000Z', '200': 10, '500': 5 },
      { timestamp: '2023-01-02T00:00:00.000Z', '200': 20, '500': 0 },
    ])
  })

  it('should handle an empty array', () => {
    const data: any[] = []
    const result = transformStatusCodeData(data, [])
    expect(result).toEqual([])
  })

  it('should handle a single entry', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00Z', status_code: 200, count: 10 }]
    const result = transformStatusCodeData(data, ['200', '404'])
    expect(result).toEqual([{ timestamp: '2023-01-01T00:00:00.000Z', '200': 10, '404': 0 }])
  })
})
