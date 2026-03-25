import { describe, it, expect } from 'vitest'
import { formatDuration } from './QueryPerformance.utils'

describe('formatDuration', () => {
  it('should format seconds', () => {
    expect(formatDuration(1000)).toBe('1.00s')
    expect(formatDuration(30000)).toBe('30.00s')
  })

  it('should format minutes and seconds', () => {
    expect(formatDuration(60000)).toBe('1m')
    expect(formatDuration(125000)).toBe('2m 5s')
  })

  it('should format hours, minutes and seconds', () => {
    expect(formatDuration(3600000)).toBe('1h')
    expect(formatDuration(3661000)).toBe('1h 1m 1s')
  })

  it('should format days, hours, minutes and seconds', () => {
    expect(formatDuration(86400000)).toBe('1d')
    expect(formatDuration(90061000)).toBe('1d 1h 1m 1s')
  })
})
