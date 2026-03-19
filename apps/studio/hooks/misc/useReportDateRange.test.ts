import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import { getIntervalGranularity } from './useReportDateRange'

describe('getIntervalGranularity', () => {
  const at = (from: dayjs.Dayjs, to: dayjs.Dayjs) =>
    getIntervalGranularity(from.toISOString(), to.toISOString())

  const now = dayjs('2024-01-10T12:00:00Z')

  it('returns 1m for ranges up to 1 hour', () => {
    expect(at(now.subtract(1, 'minute'), now)).toBe('1m')
    expect(at(now.subtract(30, 'minute'), now)).toBe('1m')
    expect(at(now.subtract(1, 'hour'), now)).toBe('1m')
  })

  it('returns 2m for ranges between 1 hour and 12 hours', () => {
    expect(at(now.subtract(2, 'hour'), now)).toBe('2m')
    expect(at(now.subtract(6, 'hour'), now)).toBe('2m')
    expect(at(now.subtract(12, 'hour'), now)).toBe('2m')
  })

  it('returns 10m for ranges between 12 hours and 24 hours', () => {
    expect(at(now.subtract(13, 'hour'), now)).toBe('10m')
    expect(at(now.subtract(18, 'hour'), now)).toBe('10m')
    expect(at(now.subtract(24, 'hour'), now)).toBe('10m')
  })

  it('returns 30m for ranges between 24 hours and 7 days', () => {
    expect(at(now.subtract(2, 'day'), now)).toBe('30m')
    expect(at(now.subtract(3, 'day'), now)).toBe('30m')
    expect(at(now.subtract(7, 'day'), now)).toBe('30m')
  })

  it('returns 1d for ranges beyond 7 days', () => {
    expect(at(now.subtract(8, 'day'), now)).toBe('1d')
    expect(at(now.subtract(30, 'day'), now)).toBe('1d')
    expect(at(now.subtract(90, 'day'), now)).toBe('1d')
  })
})
