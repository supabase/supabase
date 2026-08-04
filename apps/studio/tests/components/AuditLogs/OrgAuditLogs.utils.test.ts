import dayjs from 'dayjs'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { formatSelectedDateRange } from '@/components/interfaces/Organization/AuditLogs/AuditLogs.utils'

// Pin "now" to a fixed point so date comparisons are deterministic
const NOW = dayjs('2024-06-15T14:30:00')

afterEach(() => {
  vi.useRealTimers()
})

function fakeNow() {
  vi.setSystemTime(NOW.toDate())
}

describe('formatSelectedDateRange', () => {
  test('two different dates: preserves current time on both ends', () => {
    fakeNow()
    const result = formatSelectedDateRange({
      from: '2024-06-10',
      to: '2024-06-14',
    })
    const from = dayjs(result.from)
    const to = dayjs(result.to)
    expect(from.date()).toBe(10)
    expect(to.date()).toBe(14)
    // Both should carry current H:M:S
    expect(from.hour()).toBe(NOW.hour())
    expect(to.hour()).toBe(NOW.hour())
  })

  test('single date matching today: from is set to 00:00:00', () => {
    fakeNow()
    const today = NOW.format('YYYY-MM-DD')
    const result = formatSelectedDateRange({ from: today, to: today })
    const from = dayjs(result.from)
    expect(from.hour()).toBe(0)
    expect(from.minute()).toBe(0)
    expect(from.second()).toBe(0)
  })

  test('single date matching today: to keeps current time', () => {
    fakeNow()
    const today = NOW.format('YYYY-MM-DD')
    const result = formatSelectedDateRange({ from: today, to: today })
    const to = dayjs(result.to)
    expect(to.hour()).toBe(NOW.hour())
    expect(to.minute()).toBe(NOW.minute())
  })

  test('single date in the past: to is set to 23:59:59', () => {
    fakeNow()
    const result = formatSelectedDateRange({
      from: '2024-06-01',
      to: '2024-06-01',
    })
    const to = dayjs(result.to)
    expect(to.hour()).toBe(23)
    expect(to.minute()).toBe(59)
    expect(to.second()).toBe(59)
  })

  test('single date in the past: from keeps current time', () => {
    fakeNow()
    const result = formatSelectedDateRange({
      from: '2024-06-01',
      to: '2024-06-01',
    })
    const from = dayjs(result.from)
    expect(from.hour()).toBe(NOW.hour())
  })

  test('output is in UTC ISO format', () => {
    fakeNow()
    const result = formatSelectedDateRange({
      from: '2024-06-10',
      to: '2024-06-14',
    })
    expect(result.from).toMatch(/Z$/)
    expect(result.to).toMatch(/Z$/)
  })
})
