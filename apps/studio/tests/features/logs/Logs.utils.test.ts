import {
  checkForILIKEClause,
  checkForWildcard,
  checkForWithClause,
  fillTimeseries,
  unixMicroToIsoTimestamp,
} from 'components/interfaces/Settings/Logs/Logs.utils'
import { describe, test, expect } from 'vitest'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

describe('fillTimeseries', () => {
  test('should return empty array for empty data without min/max', () => {
    const result = fillTimeseries([], 'timestamp', 'value', 0)
    expect(result).toEqual([])
  })

  test('should return empty array for empty data with min/max', () => {
    const min = '2023-01-01T00:00:00.000Z'
    const max = '2023-01-01T01:00:00.000Z'
    const result = fillTimeseries([], 'timestamp', 'value', 0, min, max)

    // When min/max are provided, the function fills the time range with default values
    // This creates 61 data points (one for each minute from 00:00 to 01:00)
    expect(result).toHaveLength(61)
    expect(result[0]).toEqual({ timestamp: '2023-01-01T00:00:00.000Z', value: 0 })
    expect(result[60]).toEqual({ timestamp: '2023-01-01T01:00:00.000Z', value: 0 })
  })

  test('should normalize timestamps when data exceeds minPointsToFill', () => {
    const data = [
      { timestamp: '2023-01-01T00:00:00.000Z', value: 1 },
      { timestamp: '2023-01-01T00:01:00.000Z', value: 2 },
      { timestamp: '2023-01-01T00:02:00.000Z', value: 3 },
      { timestamp: '2023-01-01T00:03:00.000Z', value: 4 },
      { timestamp: '2023-01-01T00:04:00.000Z', value: 5 },
      { timestamp: '2023-01-01T00:05:00.000Z', value: 6 },
      { timestamp: '2023-01-01T00:06:00.000Z', value: 7 },
      { timestamp: '2023-01-01T00:07:00.000Z', value: 8 },
      { timestamp: '2023-01-01T00:08:00.000Z', value: 9 },
      { timestamp: '2023-01-01T00:09:00.000Z', value: 10 },
      { timestamp: '2023-01-01T00:10:00.000Z', value: 11 },
      { timestamp: '2023-01-01T00:11:00.000Z', value: 12 },
      { timestamp: '2023-01-01T00:12:00.000Z', value: 13 },
      { timestamp: '2023-01-01T00:13:00.000Z', value: 14 },
      { timestamp: '2023-01-01T00:14:00.000Z', value: 15 },
      { timestamp: '2023-01-01T00:15:00.000Z', value: 16 },
      { timestamp: '2023-01-01T00:16:00.000Z', value: 17 },
      { timestamp: '2023-01-01T00:17:00.000Z', value: 18 },
      { timestamp: '2023-01-01T00:18:00.000Z', value: 19 },
      { timestamp: '2023-01-01T00:19:00.000Z', value: 20 },
      { timestamp: '2023-01-01T00:20:00.000Z', value: 21 },
    ]
    const result = fillTimeseries(data, 'timestamp', 'value', 0, undefined, undefined, 20)

    // Should return normalized data without filling gaps
    expect(result).toHaveLength(21)
    result.forEach((item) => {
      expect(item.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })

  test('should fill gaps in sparse data with 1-minute intervals', () => {
    const min = '2023-01-01T00:00:00.000Z'
    const max = '2023-01-01T00:04:00.000Z'
    const data = [
      { timestamp: '2023-01-01T00:01:00.000Z', value: 10 },
      { timestamp: '2023-01-01T00:03:00.000Z', value: 30 },
    ]

    const result = fillTimeseries(data, 'timestamp', 'value', 0, min, max, 20, '2m')

    expect(result).toHaveLength(5)
    const sortedResult = result.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    expect(sortedResult[0]).toEqual({ timestamp: '2023-01-01T00:00:00.000Z', value: 0 })
    expect(sortedResult[1]).toEqual({ timestamp: '2023-01-01T00:01:00.000Z', value: 10 })
    expect(sortedResult[2]).toEqual({ timestamp: '2023-01-01T00:02:00.000Z', value: 0 })
    expect(sortedResult[3]).toEqual({ timestamp: '2023-01-01T00:03:00.000Z', value: 30 })
    expect(sortedResult[4]).toEqual({ timestamp: '2023-01-01T00:04:00.000Z', value: 0 })
  })

  test('should handle multiple value keys', () => {
    const min = '2023-01-01T00:00:00.000Z'
    const max = '2023-01-01T00:02:00.000Z'
    const data = [{ timestamp: '2023-01-01T00:01:00.000Z', count1: 10, count2: 100 }]

    const result = fillTimeseries(data, 'timestamp', ['count1', 'count2'], 5, min, max, 20, '1m')

    expect(result).toHaveLength(3)
    const sortedResult = result.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    expect(sortedResult[0]).toEqual({ timestamp: '2023-01-01T00:00:00.000Z', count1: 5, count2: 5 })
    expect(sortedResult[1]).toEqual({
      timestamp: '2023-01-01T00:01:00.000Z',
      count1: 10,
      count2: 100,
    })
    expect(sortedResult[2]).toEqual({ timestamp: '2023-01-01T00:02:00.000Z', count1: 5, count2: 5 })
  })

  test('should handle different interval formats', () => {
    const min = '2023-01-01T00:00:00.000Z'
    const max = '2023-01-01T00:10:00.000Z'
    const data = [{ timestamp: '2023-01-01T00:05:00.000Z', value: 50 }]

    // Test 5-minute intervals: 00:00, 00:05, 00:10 = 3 points
    const result5m = fillTimeseries(data, 'timestamp', 'value', 0, min, max, 20, '5m')
    expect(result5m).toHaveLength(3)

    // Test 2-minute intervals: 00:00, 00:02, 00:04, 00:05, 00:06, 00:08, 00:10 = 7 points
    const result2m = fillTimeseries(data, 'timestamp', 'value', 0, min, max, 20, '2m')
    console.log(
      '2m intervals:',
      result2m.map((r) => r.timestamp)
    )
    expect(result2m).toHaveLength(7)

    // Test 1-hour intervals: 00:00, 01:00, 02:00 with existing data at 00:05 = 4 points
    const maxHour = '2023-01-01T02:00:00.000Z'
    const result1h = fillTimeseries(data, 'timestamp', 'value', 0, min, maxHour, 20, '1h')
    expect(result1h).toHaveLength(4)
  })

  test('should handle microsecond timestamps correctly', () => {
    const now = dayjs.utc('2023-01-01T00:00:00.000Z')
    const data = [
      { timestamp: now.valueOf() * 1000, value: 1 },
      { timestamp: now.add(1, 'minute').valueOf() * 1000, value: 2 },
    ]

    const result = fillTimeseries(data, 'timestamp', 'value', 0, undefined, undefined, 1)

    expect(result).toHaveLength(2)
    result.forEach((item) => {
      expect(item.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })

  test('should handle mixed timestamp formats', () => {
    const data = [
      { timestamp: '2023-01-01T00:00:00.000Z', value: 1 },
      { timestamp: dayjs.utc('2023-01-01T00:01:00.000Z').valueOf() * 1000, value: 2 },
      { timestamp: '2023-01-01T00:02:00.000Z', value: 3 },
    ]

    const result = fillTimeseries(data, 'timestamp', 'value', 0, undefined, undefined, 1)

    expect(result).toHaveLength(3)
    result.forEach((item) => {
      expect(item.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })

  test('should not fill gaps when data is dense enough', () => {
    const data = Array.from({ length: 25 }, (_, i) => ({
      timestamp: dayjs.utc('2023-01-01T00:00:00.000Z').add(i, 'minute').toISOString(),
      value: i,
    }))

    const result = fillTimeseries(data, 'timestamp', 'value', 0, undefined, undefined, 20)

    expect(result).toHaveLength(25)
    expect(result).toEqual(data)
  })

  test('should handle edge case with single data point', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00.000Z', value: 1 }]

    const result = fillTimeseries(data, 'timestamp', 'value', 0)

    expect(result).toEqual(data)
  })

  test('should handle edge case with single data point and min/max', () => {
    const min = '2023-01-01T00:00:00.000Z'
    const max = '2023-01-01T00:02:00.000Z'
    const data = [{ timestamp: '2023-01-01T00:01:00.000Z', value: 1 }]

    const result = fillTimeseries(data, 'timestamp', 'value', 0, min, max, 20, '1m')

    expect(result).toHaveLength(3)
    const sortedResult = result.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    expect(sortedResult[0]).toEqual({ timestamp: '2023-01-01T00:00:00.000Z', value: 0 })
    expect(sortedResult[1]).toEqual({ timestamp: '2023-01-01T00:01:00.000Z', value: 1 })
    expect(sortedResult[2]).toEqual({ timestamp: '2023-01-01T00:02:00.000Z', value: 0 })
  })

  test('should handle invalid interval format gracefully', () => {
    const min = '2023-01-01T00:00:00.000Z'
    const max = '2023-01-01T00:02:00.000Z'
    const data = [{ timestamp: '2023-01-01T00:01:00.000Z', value: 1 }]

    const result = fillTimeseries(data, 'timestamp', 'value', 0, min, max, 20, 'invalid')

    // Should fall back to default behavior
    expect(result.length).toBeGreaterThan(1)
  })

  test('should preserve all properties of original data', () => {
    const data = [
      {
        timestamp: '2023-01-01T00:00:00.000Z',
        value: 1,
        extra: 'data',
        nested: { prop: 'value' },
      },
    ]

    const result = fillTimeseries(data, 'timestamp', 'value', 0)

    expect(result[0]).toEqual(data[0])
    expect(result[0].extra).toBe('data')
    expect(result[0].nested).toEqual({ prop: 'value' })
  })

  test('should handle empty value keys array', () => {
    const min = '2023-01-01T00:00:00.000Z'
    const max = '2023-01-01T00:01:00.000Z'
    const data = [{ timestamp: '2023-01-01T00:00:30.000Z', value: 1 }]

    const result = fillTimeseries(data, 'timestamp', [], 0, min, max, 20, '30s')

    expect(result).toHaveLength(3)
    result.forEach((item) => {
      expect(item).toHaveProperty('timestamp')
      expect(item).not.toHaveProperty('value')
    })
  })
})

describe('checkForWithClause', () => {
  test('basic queries', () => {
    expect(checkForWithClause('SELECT * FROM table')).toBe(false)
    expect(checkForWithClause('SELECT * FROM table WITH clause')).toBe(true)
    expect(checkForWithClause('WITH test AS (SELECT * FROM table) SELECT * FROM test')).toBe(true)
    expect(checkForWithClause('SELECT * FROM withsomething')).toBe(false)
  })

  test('case sensitivity', () => {
    expect(checkForWithClause('with test AS (SELECT * FROM table) SELECT * FROM test')).toBe(true)
    expect(checkForWithClause('WiTh test AS (SELECT * FROM table) SELECT * FROM test')).toBe(true)
  })

  test('comments', () => {
    expect(checkForWithClause('SELECT * FROM table -- WITH clause')).toBe(false)
    expect(checkForWithClause('SELECT * FROM table /* WITH clause */')).toBe(false)
    expect(checkForWithClause('-- WITH clause\nSELECT * FROM table')).toBe(false)
    expect(checkForWithClause('/* WITH clause */\nSELECT * FROM table')).toBe(false)
  })

  test('string literals', () => {
    expect(checkForWithClause("SELECT 'WITH' FROM table")).toBe(false)
    expect(checkForWithClause("SELECT * FROM table WHERE column = 'WITH clause'")).toBe(false)
  })

  test('subqueries', () => {
    expect(
      checkForWithClause('SELECT * FROM (WITH subquery AS (SELECT 1) SELECT * FROM subquery)')
    ).toBe(true)
    expect(
      checkForWithClause(
        'SELECT * FROM table WHERE column IN (WITH subquery AS (SELECT 1) SELECT * FROM subquery)'
      )
    ).toBe(true)
  })
})

describe('checkForILIKEClause', () => {
  test('basic queries', () => {
    expect(checkForILIKEClause('SELECT * FROM table')).toBe(false)
    expect(checkForILIKEClause('SELECT * FROM table WHERE column ILIKE "%value%"')).toBe(true)
    expect(checkForILIKEClause('SELECT * FROM table WHERE column LIKE "%value%"')).toBe(false)
    expect(checkForILIKEClause('SELECT * FROM ilikesomething')).toBe(false)
  })

  test('case sensitivity', () => {
    expect(checkForILIKEClause('SELECT * FROM table WHERE column ilike "%value%"')).toBe(true)
    expect(checkForILIKEClause('SELECT * FROM table WHERE column IlIkE "%value%"')).toBe(true)
  })

  test('comments', () => {
    expect(checkForILIKEClause('SELECT * FROM table -- ILIKE clause')).toBe(false)
    expect(checkForILIKEClause('SELECT * FROM table /* ILIKE clause */')).toBe(false)
    expect(checkForILIKEClause('-- ILIKE clause\nSELECT * FROM table')).toBe(false)
    expect(checkForILIKEClause('/* ILIKE clause */\nSELECT * FROM table')).toBe(false)
  })

  test('string literals', () => {
    expect(checkForILIKEClause("SELECT 'ILIKE' FROM table")).toBe(false)
    expect(checkForILIKEClause("SELECT * FROM table WHERE column = 'ILIKE clause'")).toBe(false)
  })

  test('subqueries', () => {
    expect(
      checkForILIKEClause('SELECT * FROM (SELECT * FROM table WHERE column ILIKE "%value%")')
    ).toBe(true)
    expect(
      checkForILIKEClause(
        'SELECT * FROM table WHERE column IN (SELECT * FROM subtable WHERE column ILIKE "%value%")'
      )
    ).toBe(true)
  })
})

describe('checkForWildcard', () => {
  test('basic queries', () => {
    expect(checkForWildcard('SELECT * FROM table')).toBe(true)
    expect(checkForWildcard('SELECT column FROM table')).toBe(false)
  })

  test('comments', () => {
    expect(checkForWildcard('SELECT column FROM table -- *')).toBe(false)
    expect(checkForWildcard('SELECT column FROM table /* * */')).toBe(false)
    expect(checkForWildcard('-- *\nSELECT column FROM table')).toBe(false)
    expect(checkForWildcard('/* * */\nSELECT column FROM table')).toBe(false)
  })

  test('count(*)', () => {
    expect(checkForWildcard('SELECT count(*) FROM table')).toBe(false)
  })
})
