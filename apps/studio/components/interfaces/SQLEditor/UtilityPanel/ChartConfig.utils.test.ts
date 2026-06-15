import { describe, expect, it } from 'vitest'

import {
  getSqlEditorChartDateTimeFormat,
  guessChartAxisKeys,
  isCategoricalChartValue,
  isDateChartValue,
  isNumericChartValue,
  isSqlEditorChartXAxisDate,
  mapSqlRowsToChartTicks,
  shouldAutoConfigureChartAxes,
} from './ChartConfig.utils'

describe('ChartConfig.utils', () => {
  describe('isNumericChartValue', () => {
    it('returns true for numbers and numeric strings', () => {
      expect(isNumericChartValue(42)).toBe(true)
      expect(isNumericChartValue('42')).toBe(true)
      expect(isNumericChartValue('3.14')).toBe(true)
    })

    it('returns false for empty and non-numeric values', () => {
      expect(isNumericChartValue('')).toBe(false)
      expect(isNumericChartValue('active')).toBe(false)
      expect(isNumericChartValue(null)).toBe(false)
    })
  })

  describe('isDateChartValue', () => {
    it('returns true for valid date strings', () => {
      expect(isDateChartValue('2024-01-15T10:00:00Z')).toBe(true)
    })

    it('returns false for numbers and plain strings', () => {
      expect(isDateChartValue(42)).toBe(false)
      expect(isDateChartValue('north-america')).toBe(false)
    })
  })

  describe('isCategoricalChartValue', () => {
    it('returns true for labels and booleans', () => {
      expect(isCategoricalChartValue('active')).toBe(true)
      expect(isCategoricalChartValue(true)).toBe(true)
    })
  })

  describe('guessChartAxisKeys', () => {
    it('prefers date columns for x and count columns for y', () => {
      expect(
        guessChartAxisKeys([
          { created_at: '2024-01-01T00:00:00Z', event_count: 12 },
          { created_at: '2024-01-02T00:00:00Z', event_count: 8 },
        ])
      ).toEqual({
        xKey: 'created_at',
        yKey: 'event_count',
      })
    })

    it('uses a categorical column for x when no date exists', () => {
      expect(
        guessChartAxisKeys([
          { region: 'us-east', total_users: 100 },
          { region: 'eu-west', total_users: 80 },
        ])
      ).toEqual({
        xKey: 'region',
        yKey: 'total_users',
      })
    })

    it('prefers non-id numeric columns for y', () => {
      expect(
        guessChartAxisKeys([
          { id: 1, name: 'alpha', amount: 10 },
          { id: 2, name: 'beta', amount: 20 },
        ])
      ).toEqual({
        xKey: 'name',
        yKey: 'amount',
      })
    })

    it('falls back to two numeric columns when needed', () => {
      expect(
        guessChartAxisKeys([
          { month: 1, revenue: 100 },
          { month: 2, revenue: 150 },
        ])
      ).toEqual({
        xKey: 'month',
        yKey: 'revenue',
      })
    })

    it('returns null when there is no numeric column', () => {
      expect(
        guessChartAxisKeys([
          { region: 'us-east', status: 'active' },
          { region: 'eu-west', status: 'inactive' },
        ])
      ).toBeNull()
    })
  })

  describe('shouldAutoConfigureChartAxes', () => {
    const rows = [{ created_at: '2024-01-01T00:00:00Z', count: 1 }]

    it('returns true when axis keys are missing', () => {
      expect(shouldAutoConfigureChartAxes(rows, { xKey: '', yKey: '' })).toBe(true)
    })

    it('returns true when saved keys no longer exist in the results', () => {
      expect(shouldAutoConfigureChartAxes(rows, { xKey: 'missing', yKey: 'count' })).toBe(true)
    })

    it('returns false when the current config matches the results', () => {
      expect(shouldAutoConfigureChartAxes(rows, { xKey: 'created_at', yKey: 'count' })).toBe(false)
    })
  })

  describe('mapSqlRowsToChartTicks', () => {
    it('maps date x values to ISO timestamps and numeric y values', () => {
      expect(
        mapSqlRowsToChartTicks(
          [{ created_at: '2024-01-15T10:00:00Z', count: 12 }],
          'created_at',
          'count'
        )
      ).toEqual([
        {
          timestamp: '2024-01-15T10:00:00.000Z',
          count: 12,
        },
      ])
    })

    it('maps categorical x values to string timestamps', () => {
      expect(
        mapSqlRowsToChartTicks([{ region: 'us-east', total_users: 100 }], 'region', 'total_users')
      ).toEqual([
        {
          timestamp: 'us-east',
          total_users: 100,
        },
      ])
    })
  })

  describe('isSqlEditorChartXAxisDate', () => {
    it('returns true when the first x value is a date', () => {
      expect(
        isSqlEditorChartXAxisDate('created_at', [{ created_at: '2024-01-15T10:00:00Z', count: 12 }])
      ).toBe(true)
    })

    it('returns false when the first x value is categorical', () => {
      expect(isSqlEditorChartXAxisDate('region', [{ region: 'us-east', total_users: 100 }])).toBe(
        false
      )
    })
  })

  describe('getSqlEditorChartDateTimeFormat', () => {
    it('returns a detailed format for date axes', () => {
      expect(
        getSqlEditorChartDateTimeFormat('created_at', [
          { created_at: '2024-01-15T10:00:00Z', count: 12 },
        ])
      ).toBe('MMM D YYYY HH:mm')
    })

    it('returns the fallback format for non-date axes', () => {
      expect(getSqlEditorChartDateTimeFormat('region', [{ region: 'us-east', count: 1 }])).toBe(
        'MMM D, YYYY, hh:mma'
      )
    })
  })
})
