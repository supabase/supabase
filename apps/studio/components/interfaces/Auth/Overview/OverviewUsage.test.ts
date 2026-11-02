import { describe, expect, it, test } from 'vitest'

import {
  calculatePercentageChange,
  calculatePercentagePointChange,
  getApiSuccessRates,
  getAuthSuccessRates,
  getMetricValues,
  type AuthMetricsResponse,
} from './OverviewUsage.constants'
import { RawAuthMetricsResponseSchema, type RawAuthMetricsRow } from './OverviewUsage.schema'

const validSample = {
  result: [
    {
      period: 'current',
      active_users: 5,
      api_error_requests: 0,
      api_total_requests: 38,
      auth_total_errors: 0,
      auth_total_requests: 0,
      password_reset_requests: 0,
      sign_up_count: 4,
    },
    {
      period: 'previous',
      active_users: 0,
      api_error_requests: 0,
      api_total_requests: 0,
      auth_total_errors: 0,
      auth_total_requests: 0,
      password_reset_requests: 0,
      sign_up_count: 0,
    },
  ],
  error: null,
}

describe('RawAuthMetricsResponseSchema', () => {
  test('parses valid payload', () => {
    const parsed = RawAuthMetricsResponseSchema.safeParse(validSample)
    expect(parsed.success).toBe(true)
  })

  test('rejects negative numbers', () => {
    const invalid = {
      ...validSample,
      result: [{ ...validSample.result[0], active_users: -1 }, validSample.result[1]],
    }
    const parsed = RawAuthMetricsResponseSchema.safeParse(invalid)
    expect(parsed.success).toBe(false)
  })

  test('rejects missing fields', () => {
    const invalid = {
      result: [
        {
          period: 'current',
          active_users: 1,
          api_error_requests: 0,
          auth_total_errors: 0,
          auth_total_requests: 0,
          password_reset_requests: 0,
          sign_up_count: 0,
        },
      ],
      error: null,
    }
    const parsed = RawAuthMetricsResponseSchema.safeParse(invalid)
    expect(parsed.success).toBe(false)
  })
})

const sampleMetrics: AuthMetricsResponse = {
  result: [
    {
      period: 'current',
      active_users: 10,
      api_error_requests: 2,
      api_total_requests: 50,
      auth_total_errors: 1,
      auth_total_requests: 20,
      password_reset_requests: 3,
      sign_up_count: 7,
    },
    {
      period: 'previous',
      active_users: 5,
      api_error_requests: 5,
      api_total_requests: 25,
      auth_total_errors: 2,
      auth_total_requests: 10,
      password_reset_requests: 1,
      sign_up_count: 4,
    },
  ],
  error: null,
}

describe('OverviewUsage helpers', () => {
  test('getMetricValues maps snake_case to camel metric names', () => {
    const { current, previous } = getMetricValues(sampleMetrics, 'signUpCount')
    expect(current).toBe(7)
    expect(previous).toBe(4)
  })

  test('getMetricValues returns 0 defaults when metrics undefined', () => {
    const { current, previous } = getMetricValues(undefined, 'activeUsers')
    expect(current).toBe(0)
    expect(previous).toBe(0)
  })

  test('getApiSuccessRates computes success rates correctly', () => {
    const { current, previous } = getApiSuccessRates(sampleMetrics)
    expect(current).toBeCloseTo(96)
    expect(previous).toBeCloseTo(80)
  })

  test('getAuthSuccessRates computes success rates correctly', () => {
    const { current, previous } = getAuthSuccessRates(sampleMetrics)
    expect(current).toBeCloseTo(95)
    expect(previous).toBeCloseTo(80)
  })
})

const createRow = (
  period: RawAuthMetricsRow['period'],
  values: Partial<Omit<RawAuthMetricsRow, 'period'>> = {}
): RawAuthMetricsRow => ({
  period,
  active_users: 0,
  api_error_requests: 0,
  api_total_requests: 0,
  auth_total_errors: 0,
  auth_total_requests: 0,
  password_reset_requests: 0,
  sign_up_count: 0,
  ...values,
})

describe.each([
  { name: 'API', getRates: getApiSuccessRates },
  { name: 'Auth server', getRates: getAuthSuccessRates },
])('$name success rates', ({ getRates }) => {
  it.each<AuthMetricsResponse | undefined>([
    undefined,
    { result: [], error: null },
    { result: [createRow('current'), createRow('previous')], error: null },
  ])('returns no rate when there are no requests: %j', (metrics) => {
    expect(getRates(metrics)).toEqual({ current: null, previous: null })
  })

  it.each(['current', 'previous'] as const)(
    'preserves a populated %s period when the other period is missing',
    (period) => {
      const metrics = {
        result: [createRow(period, { api_total_requests: 10, auth_total_requests: 10 })],
        error: null,
      }

      expect(getRates(metrics)).toEqual({ current: null, previous: null, [period]: 100 })
    }
  )

  it.each([
    { total: 100, errors: 100, expected: 0 },
    { total: 100, errors: 0, expected: 100 },
    { total: 100, errors: 25, expected: 75 },
    { total: 500, errors: 499, expected: 0.2 },
    { total: 100, errors: 101, expected: 0 },
  ])(
    'returns $expected% for $errors failures out of $total requests',
    ({ total, errors, expected }) => {
      const values = {
        api_total_requests: total,
        api_error_requests: errors,
        auth_total_requests: total,
        auth_total_errors: errors,
      }

      const rates = getRates({
        result: [createRow('current', values), createRow('previous', values)],
        error: null,
      })

      expect(rates.current).toBeCloseTo(expected)
      expect(rates.previous).toBeCloseTo(expected)
    }
  )
})

describe('calculatePercentagePointChange', () => {
  it.each([
    { current: 0.2, previous: 0, expected: 0.2 },
    { current: 0.2, previous: 0.0667, expected: 0.1333 },
    { current: 90, previous: 95, expected: -5 },
    { current: 0, previous: 100, expected: -100 },
    { current: 100, previous: 0, expected: 100 },
    { current: 0, previous: 0, expected: 0 },
    { current: 100, previous: 100, expected: 0 },
  ])('returns $expected points from $previous% to $current%', ({ current, previous, expected }) => {
    expect(calculatePercentagePointChange(current, previous)).toBeCloseTo(expected)
  })

  it.each([
    { current: null, previous: 100 },
    { current: 100, previous: null },
    { current: null, previous: null },
  ])('omits a change when either rate is missing: %j', ({ current, previous }) => {
    expect(calculatePercentagePointChange(current, previous)).toBeNull()
  })
})

describe('calculatePercentageChange', () => {
  it.each([
    { current: 150, previous: 100, expected: 50 },
    { current: 50, previous: 100, expected: -50 },
    { current: 0, previous: 100, expected: -100 },
    { current: 100, previous: 100, expected: 0 },
  ])('returns $expected% from $previous to $current', ({ current, previous, expected }) => {
    expect(calculatePercentageChange(current, previous)).toBe(expected)
  })

  it.each([0, 1, 100])('omits a relative change from zero to %i', (current) => {
    expect(calculatePercentageChange(current, 0)).toBeNull()
  })
})
