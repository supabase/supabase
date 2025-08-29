import { describe, expect, it } from 'vitest'
import {
  extractStatusCodesFromData,
  generateStatusCodeAttributes,
  transformStatusCodeData,
  transformInvocationData,
  aggregateInvocationsByTimestamp,
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

describe('transformInvocationData', () => {
  const mockFunctions = [
    { id: 'func1', name: 'Function One' },
    { id: 'func2', name: 'Function Two' },
  ]

  it('should transform raw invocation data with function names', () => {
    const rawData = [
      {
        timestamp: '2023-01-01T00:00:00Z',
        function_id: 'func1',
        count: 10,
      },
      {
        timestamp: '2023-01-01T01:00:00Z',
        function_id: 'func2',
        count: 5,
      },
    ]

    const result = transformInvocationData(rawData, mockFunctions)
    expect(result).toEqual([
      {
        timestamp: '2023-01-01T00:00:00.000Z',
        function_id: 'func1',
        count: 10,
        function_name: 'Function One',
      },
      {
        timestamp: '2023-01-01T01:00:00.000Z',
        function_id: 'func2',
        count: 5,
        function_name: 'Function Two',
      },
    ])
  })

  it('should use function_id as fallback when function name not found', () => {
    const rawData = [
      {
        timestamp: '2023-01-01T00:00:00Z',
        function_id: 'unknown_func',
        count: 10,
      },
    ]

    const result = transformInvocationData(rawData, mockFunctions)
    expect(result).toEqual([
      {
        timestamp: '2023-01-01T00:00:00.000Z',
        function_id: 'unknown_func',
        count: 10,
        function_name: 'unknown_func',
      },
    ])
  })

  it('should handle unix micro timestamps', () => {
    const rawData = [
      {
        timestamp: 1672531200000000, // Unix micro timestamp for 2023-01-01T00:00:00Z
        function_id: 'func1',
        count: 10,
      },
    ]

    const result = transformInvocationData(rawData, mockFunctions)
    expect(result[0].timestamp).toBe('2023-01-01T00:00:00.000Z')
    expect(result[0].function_name).toBe('Function One')
  })

  it('should handle empty data array', () => {
    const result = transformInvocationData([], mockFunctions)
    expect(result).toEqual([])
  })

  it('should handle empty functions array', () => {
    const rawData = [
      {
        timestamp: '2023-01-01T00:00:00Z',
        function_id: 'func1',
        count: 10,
      },
    ]

    const result = transformInvocationData(rawData, [])
    expect(result).toEqual([
      {
        timestamp: '2023-01-01T00:00:00.000Z',
        function_id: 'func1',
        count: 10,
        function_name: 'func1',
      },
    ])
  })
})

describe('aggregateInvocationsByTimestamp', () => {
  it('should aggregate counts by timestamp', () => {
    const data = [
      { timestamp: '2023-01-01T00:00:00.000Z', function_id: 'func1', count: 10 },
      { timestamp: '2023-01-01T00:00:00.000Z', function_id: 'func2', count: 5 },
      { timestamp: '2023-01-01T01:00:00.000Z', function_id: 'func1', count: 20 },
    ]

    const result = aggregateInvocationsByTimestamp(data)
    expect(result).toEqual([
      { timestamp: '2023-01-01T00:00:00.000Z', count: 15 },
      { timestamp: '2023-01-01T01:00:00.000Z', count: 20 },
    ])
  })

  it('should handle single entry per timestamp', () => {
    const data = [
      { timestamp: '2023-01-01T00:00:00.000Z', function_id: 'func1', count: 10 },
      { timestamp: '2023-01-01T01:00:00.000Z', function_id: 'func2', count: 5 },
    ]

    const result = aggregateInvocationsByTimestamp(data)
    expect(result).toEqual([
      { timestamp: '2023-01-01T00:00:00.000Z', count: 10 },
      { timestamp: '2023-01-01T01:00:00.000Z', count: 5 },
    ])
  })

  it('should handle empty data array', () => {
    const result = aggregateInvocationsByTimestamp([])
    expect(result).toEqual([])
  })

  it('should handle multiple entries with same timestamp and different counts', () => {
    const data = [
      { timestamp: '2023-01-01T00:00:00.000Z', function_id: 'func1', count: 1 },
      { timestamp: '2023-01-01T00:00:00.000Z', function_id: 'func2', count: 2 },
      { timestamp: '2023-01-01T00:00:00.000Z', function_id: 'func3', count: 3 },
    ]

    const result = aggregateInvocationsByTimestamp(data)
    expect(result).toEqual([{ timestamp: '2023-01-01T00:00:00.000Z', count: 6 }])
  })

  it('should preserve timestamp order from reduce operation', () => {
    const data = [
      { timestamp: '2023-01-01T02:00:00.000Z', function_id: 'func1', count: 30 },
      { timestamp: '2023-01-01T00:00:00.000Z', function_id: 'func1', count: 10 },
      { timestamp: '2023-01-01T01:00:00.000Z', function_id: 'func1', count: 20 },
    ]

    const result = aggregateInvocationsByTimestamp(data)
    expect(result).toHaveLength(3)
    expect(result.map((item) => item.timestamp)).toEqual([
      '2023-01-01T02:00:00.000Z',
      '2023-01-01T00:00:00.000Z',
      '2023-01-01T01:00:00.000Z',
    ])
  })
})
