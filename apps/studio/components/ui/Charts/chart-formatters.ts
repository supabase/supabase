import type { FormatStyle, MultiAttribute } from './chart-view-model'

export interface ChartValueFlags {
  isPercentage: boolean
  isBytesFormat: boolean
  isMemoryChart: boolean
  isNetworkChart: boolean
  shouldFormatBytes: boolean
}

/**
 * Detect, from the series keys and the chart's format, how values should be
 * formatted. If any attribute declares an explicit formatStyle, that takes
 * precedence over the name-pattern heuristics.
 *
 * Note on reconciled drift: Copy A (ComposedChart.tsx) matched disk_space_
 * but not disk_fs_; Copy B (ComposedChart.utils.tsx) matched disk_fs_ but not
 * disk_space_. This helper treats both, plus pg_database_size, as byte-like
 * (the union of what both copies matched).
 */
export function getChartValueFlags(
  seriesKeys: string[],
  format?: string,
  attributes?: Pick<MultiAttribute, 'attribute' | 'formatStyle'>[]
): ChartValueFlags {
  const lower = seriesKeys.map((k) => k.toLowerCase())

  // Name-pattern heuristics (same logic as the two originals, unified)
  const isRamChart = !lower.some((k) => k === 'ram_usage') && lower.some((k) => k.includes('ram_'))
  const isSwapChart = lower.some((k) => k.includes('swap_'))
  const isMemoryHeuristic = isRamChart || isSwapChart

  const isNetworkHeuristic = lower.some((k) => k.includes('network_'))

  // Byte-like extras: union of both originals' patterns
  const byteLikeExtras =
    lower.some((k) => k.includes('disk_space_')) ||
    lower.some((k) => k.includes('disk_fs_')) ||
    lower.some((k) => k.includes('pg_database_size'))

  const isBytesFormatHeuristic = format === 'bytes' || format === 'bytes-per-second'
  const isPercentageHeuristic = format === '%'

  // Explicit formatStyle overrides from attribute metadata
  let forceMemory = false
  let forceNetwork = false
  let forceBytesFormat = false
  let forcePercentage = false

  if (attributes && attributes.length > 0) {
    for (const attr of attributes) {
      const fs = attr.formatStyle as FormatStyle | undefined
      if (!fs) continue
      if (fs === 'memory') forceMemory = true
      else if (fs === 'network') forceNetwork = true
      else if (fs === 'bytes' || fs === 'bytes-per-second') forceBytesFormat = true
      else if (fs === 'percent') forcePercentage = true
    }
  }

  const isPercentage = isPercentageHeuristic || forcePercentage
  const isBytesFormat = isBytesFormatHeuristic || forceBytesFormat
  const isMemoryChart = isMemoryHeuristic || forceMemory
  const isNetworkChart = isNetworkHeuristic || forceNetwork
  const shouldFormatBytes = isBytesFormat || isMemoryChart || isNetworkChart || byteLikeExtras

  return { isPercentage, isBytesFormat, isMemoryChart, isNetworkChart, shouldFormatBytes }
}
