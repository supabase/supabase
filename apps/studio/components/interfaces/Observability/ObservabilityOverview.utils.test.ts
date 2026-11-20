import { describe, expect, it } from 'vitest'

import type { LogsBarChartDatum } from '../ProjectHome/ProjectUsage.metrics'
import {
  calculateErrorRate,
  calculateSuccessRate,
  getHealthStatus,
} from './ObservabilityOverview.utils'

const datum = (ok: number, warning: number, error: number): LogsBarChartDatum => ({
  timestamp: '2024-01-15T12:00:00Z',
  ok_count: ok,
  warning_count: warning,
  error_count: error,
})

describe('calculateErrorRate', () => {
  it.each([
    ['an empty array', [], 0],
    ['zero total', [datum(0, 0, 0)], 0],
    ['a single data point', [datum(80, 10, 10)], 10],
    ['multiple data points', [datum(50, 25, 25), datum(50, 25, 25)], 25],
  ])('handles %s', (_, data, expected) => {
    expect(calculateErrorRate(data)).toBe(expected)
  })
})

describe('calculateSuccessRate', () => {
  it.each([
    ['an empty array', [], 0],
    ['zero total', [datum(0, 0, 0)], 0],
    ['a single data point', [datum(80, 10, 10)], 80],
    ['all successful requests', [datum(100, 0, 0)], 100],
    ['multiple data points', [datum(70, 15, 15), datum(70, 15, 15)], 70],
  ])('handles %s', (_, data, expected) => {
    expect(calculateSuccessRate(data)).toBe(expected)
  })
})

describe('getHealthStatus', () => {
  it.each([
    [0, 0],
    [10, 99],
    // a high error rate is still unknown below the minimum sample size
    [50, 20],
  ])('returns unknown for error rate %s with only %s requests', (errorRate, total) => {
    expect(getHealthStatus(errorRate, total)).toEqual({ status: 'unknown', color: 'muted' })
  })

  it.each([
    [1, 100],
    [5, 100],
    [90, 1000],
  ])('returns error for error rate %s%% over %s requests', (errorRate, total) => {
    expect(getHealthStatus(errorRate, total)).toEqual({ status: 'error', color: 'destructive' })
  })

  it.each([
    [0, 100],
    [0.99, 100],
    [0.5, 1000000],
  ])('returns healthy for error rate %s%% over %s requests', (errorRate, total) => {
    expect(getHealthStatus(errorRate, total)).toEqual({ status: 'healthy', color: 'brand' })
  })
})
