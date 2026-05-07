import { describe, expect, test } from 'vitest'
import { RawAuthMetricsResponseSchema } from './OverviewUsage.schema'
import {
  getMetricValues,
  calculatePercentageChange,
  getApiSuccessRates,
  getAuthSuccessRates,
  type AuthMetricsResponse,
} from './OverviewUsage.constants'

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

  test('calculatePercentageChange handles zero previous', () => {
    expect(calculatePercentageChange(10, 0)).toBe(100)
    expect(calculatePercentageChange(0, 0)).toBe(0)
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
