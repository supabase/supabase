import { describe, expect, it } from 'vitest'

import { inDateRange } from './DataTable.utils'

const rowWith = (date: Date | string) => ({ getValue: () => date }) as any

describe('inDateRange', () => {
  // Built from local components so the same-day (local) check is timezone-stable.
  const start = new Date(2024, 0, 10, 0, 0, 0)
  const end = new Date(2024, 0, 20, 0, 0, 0)

  it('includes a timestamp on the start boundary', () => {
    expect(inDateRange(rowWith(start), 'ts', [start, end], () => {})).toBe(true)
  })

  it('includes a timestamp on the end boundary', () => {
    expect(inDateRange(rowWith(end), 'ts', [start, end], () => {})).toBe(true)
  })

  it('includes a timestamp inside the range', () => {
    const mid = new Date(2024, 0, 15, 12, 0, 0)
    expect(inDateRange(rowWith(mid), 'ts', [start, end], () => {})).toBe(true)
  })

  it('excludes a timestamp before the start', () => {
    const before = new Date(2024, 0, 9, 23, 59, 59)
    expect(inDateRange(rowWith(before), 'ts', [start, end], () => {})).toBe(false)
  })

  it('excludes a timestamp after the end', () => {
    const after = new Date(2024, 0, 20, 0, 0, 1)
    expect(inDateRange(rowWith(after), 'ts', [start, end], () => {})).toBe(false)
  })

  it('matches the same day when no end is provided', () => {
    const sameDay = new Date(2024, 0, 10, 18, 30, 0)
    expect(inDateRange(rowWith(sameDay), 'ts', [start], () => {})).toBe(true)
  })

  it('returns false for an invalid date', () => {
    expect(inDateRange(rowWith('not-a-date'), 'ts', [start, end], () => {})).toBe(false)
  })
})
