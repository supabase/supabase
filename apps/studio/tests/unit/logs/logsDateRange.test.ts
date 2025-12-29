import dayjs from 'dayjs'
import { describe, expect, it, vi } from 'vitest'

import {
  EXPLORER_DATEPICKER_HELPERS,
  getDefaultHelper,
} from 'components/interfaces/Settings/Logs/Logs.constants'
import {
  buildLogQueryParams,
  resolveLogDateRange,
} from 'components/interfaces/Settings/Logs/logsDateRange'

const lastHourHelper = getDefaultHelper(EXPLORER_DATEPICKER_HELPERS)

describe('resolveLogDateRange', () => {
  it('recomputes helper ranges up to current time', () => {
    vi.useFakeTimers()
    const firstNow = new Date('2025-01-01T12:00:00.000Z')
    vi.setSystemTime(firstNow)

    const first = resolveLogDateRange({
      from: '',
      to: '',
      isHelper: true,
      text: lastHourHelper.text,
    })

    expect(first.to).toBe(dayjs(firstNow).toISOString())
    expect(first.from).toBe(dayjs(firstNow).subtract(1, 'hour').toISOString())

    const later = new Date('2025-01-01T13:10:00.000Z')
    vi.setSystemTime(later)

    const second = resolveLogDateRange({
      from: '',
      to: '',
      isHelper: true,
      text: lastHourHelper.text,
    })

    expect(second.to).toBe(dayjs(later).toISOString())
    expect(second.from).toBe(dayjs(later).subtract(1, 'hour').toISOString())
    expect(second.from).not.toBe(first.from)

    vi.useRealTimers()
  })

  it('uses provided range when not a helper', () => {
    const range = resolveLogDateRange({
      from: '2025-01-01T10:00:00.000Z',
      to: '2025-01-01T11:00:00.000Z',
      isHelper: false,
    })

    expect(range.from).toBe('2025-01-01T10:00:00.000Z')
    expect(range.to).toBe('2025-01-01T11:00:00.000Z')
  })
})

describe('buildLogQueryParams', () => {
  it('returns sql with recomputed helper range for repeated runs', () => {
    vi.useFakeTimers()
    const now = new Date('2025-01-02T08:00:00.000Z')
    vi.setSystemTime(now)

    const first = buildLogQueryParams(
      { from: '', to: '', isHelper: true, text: lastHourHelper.text },
      'select 1'
    )

    const later = new Date('2025-01-02T09:30:00.000Z')
    vi.setSystemTime(later)

    const second = buildLogQueryParams(
      { from: '', to: '', isHelper: true, text: lastHourHelper.text },
      'select 1'
    )

    expect(first.sql).toBe('select 1')
    expect(second.sql).toBe('select 1')
    expect(first.from).not.toBe(second.from)
    expect(second.to).toBe(dayjs(later).toISOString())

    vi.useRealTimers()
  })
})
