import { describe, expect, it } from 'vitest'

import { getChartValueFlags } from './chart-formatters'

describe('getChartValueFlags', () => {
  // ---- RAM / memory ----

  it('detects ram chart from ram_ prefix keys (not ram_usage alone)', () => {
    const flags = getChartValueFlags(['ram_available', 'ram_total'])
    expect(flags.isMemoryChart).toBe(true)
    expect(flags.shouldFormatBytes).toBe(true)
  })

  it('does NOT treat ram_usage-only key as memory chart', () => {
    const flags = getChartValueFlags(['ram_usage'])
    expect(flags.isMemoryChart).toBe(false)
  })

  it('treats ram_usage alongside other ram_ keys as memory chart', () => {
    // ram_usage present AND another ram_ key => ram_usage !== exact-only => isRamChart true
    const flags = getChartValueFlags(['ram_usage', 'ram_available'])
    expect(flags.isMemoryChart).toBe(true)
  })

  it('detects swap chart', () => {
    const flags = getChartValueFlags(['swap_used', 'swap_total'])
    expect(flags.isMemoryChart).toBe(true)
    expect(flags.shouldFormatBytes).toBe(true)
  })

  // ---- network ----

  it('detects network chart', () => {
    const flags = getChartValueFlags(['network_ingress', 'network_egress'])
    expect(flags.isNetworkChart).toBe(true)
    expect(flags.shouldFormatBytes).toBe(true)
  })

  // ---- disk / db size (byte-like extras) ----

  it('detects disk_space_ key as shouldFormatBytes', () => {
    const flags = getChartValueFlags(['disk_space_used'])
    expect(flags.shouldFormatBytes).toBe(true)
    expect(flags.isMemoryChart).toBe(false)
    expect(flags.isNetworkChart).toBe(false)
  })

  it('detects disk_fs_ key as shouldFormatBytes', () => {
    const flags = getChartValueFlags(['disk_fs_used'])
    expect(flags.shouldFormatBytes).toBe(true)
  })

  it('detects pg_database_size key as shouldFormatBytes', () => {
    const flags = getChartValueFlags(['pg_database_size'])
    expect(flags.shouldFormatBytes).toBe(true)
  })

  // ---- format strings ----

  it('sets isBytesFormat for format=bytes', () => {
    const flags = getChartValueFlags(['cpu_usage'], 'bytes')
    expect(flags.isBytesFormat).toBe(true)
    expect(flags.shouldFormatBytes).toBe(true)
  })

  it('sets isBytesFormat for format=bytes-per-second', () => {
    const flags = getChartValueFlags(['cpu_usage'], 'bytes-per-second')
    expect(flags.isBytesFormat).toBe(true)
    expect(flags.shouldFormatBytes).toBe(true)
  })

  it('sets isPercentage for format=%', () => {
    const flags = getChartValueFlags(['cpu_usage'], '%')
    expect(flags.isPercentage).toBe(true)
    expect(flags.shouldFormatBytes).toBe(false)
  })

  // ---- plain numeric keys ----

  it('returns all-false for plain numeric keys with no format', () => {
    const flags = getChartValueFlags(['active_connections', 'idle_connections'])
    expect(flags.isPercentage).toBe(false)
    expect(flags.isBytesFormat).toBe(false)
    expect(flags.isMemoryChart).toBe(false)
    expect(flags.isNetworkChart).toBe(false)
    expect(flags.shouldFormatBytes).toBe(false)
  })

  it('handles empty keys array', () => {
    const flags = getChartValueFlags([])
    expect(flags.isMemoryChart).toBe(false)
    expect(flags.shouldFormatBytes).toBe(false)
  })

  // ---- formatStyle overrides ----

  it('formatStyle=memory forces isMemoryChart', () => {
    const flags = getChartValueFlags(['some_metric'], undefined, [
      { attribute: 'some_metric', formatStyle: 'memory' },
    ])
    expect(flags.isMemoryChart).toBe(true)
    expect(flags.shouldFormatBytes).toBe(true)
  })

  it('formatStyle=network forces isNetworkChart', () => {
    const flags = getChartValueFlags(['some_metric'], undefined, [
      { attribute: 'some_metric', formatStyle: 'network' },
    ])
    expect(flags.isNetworkChart).toBe(true)
    expect(flags.shouldFormatBytes).toBe(true)
  })

  it('formatStyle=bytes forces isBytesFormat and shouldFormatBytes', () => {
    const flags = getChartValueFlags(['some_metric'], undefined, [
      { attribute: 'some_metric', formatStyle: 'bytes' },
    ])
    expect(flags.isBytesFormat).toBe(true)
    expect(flags.shouldFormatBytes).toBe(true)
  })

  it('formatStyle=bytes-per-second forces isBytesFormat', () => {
    const flags = getChartValueFlags(['some_metric'], undefined, [
      { attribute: 'some_metric', formatStyle: 'bytes-per-second' },
    ])
    expect(flags.isBytesFormat).toBe(true)
    expect(flags.shouldFormatBytes).toBe(true)
  })

  it('formatStyle=percent forces isPercentage', () => {
    const flags = getChartValueFlags(['some_metric'], undefined, [
      { attribute: 'some_metric', formatStyle: 'percent' },
    ])
    expect(flags.isPercentage).toBe(true)
  })

  it('formatStyle overrides are applied without format param', () => {
    const flags = getChartValueFlags(['some_metric'], undefined, [
      { attribute: 'some_metric', formatStyle: 'memory' },
    ])
    expect(flags.isMemoryChart).toBe(true)
    expect(flags.isBytesFormat).toBe(false)
  })
})
