import { ChartConfig } from '@/components/interfaces/SQLEditor/UtilityPanel/ChartConfig'

export const checkHasNonPositiveValues = (data: Record<string, unknown>[], key: string): boolean =>
  data.some((row) => (row[key] as number) <= 0)

export const formatYAxisTick = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) {
    const n = value / 1_000_000
    return `${Number.isInteger(n) ? n : n.toFixed(1)}M`
  }
  if (Math.abs(value) >= 1_000) {
    const n = value / 1_000
    return `${Number.isInteger(n) ? n : n.toFixed(1)}K`
  }
  if (value !== 0 && Math.abs(value) < 1) {
    return parseFloat(value.toFixed(2)).toString()
  }
  if (!Number.isInteger(value)) {
    return parseFloat(value.toFixed(1)).toString()
  }
  return String(value)
}

export const computeYAxisWidth = (
  data: Record<string, unknown>[],
  key: string,
  {
    isLogScale = false,
    isPercentage = false,
  }: { isLogScale?: boolean; isPercentage?: boolean } = {}
): number => {
  if (isLogScale) return 52
  if (isPercentage) return Math.max(36, (3 + 1) * 8) // max tick is "100"
  const maxMagnitude =
    data.length > 0 ? Math.max(...data.map((d) => Math.abs(Number(d[key]) || 0))) : 0
  return Math.max(36, (formatYAxisTick(maxMagnitude).length + 1) * 8)
}

export const formatLogTick = (value: number): string => {
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`
  if (value >= 1_000)
    return `${(value / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`
  return value.toLocaleString()
}

export const getCumulativeResults = (results: { rows: any[] }, config: ChartConfig) => {
  if (!results?.rows?.length) {
    return []
  }

  const cumulativeResults = results.rows.reduce((acc, row) => {
    const prev = acc[acc.length - 1] || {}
    const next = {
      ...row,
      [config.yKey]: (prev[config.yKey] || 0) + row[config.yKey],
    }
    return [...acc, next]
  }, [])

  return cumulativeResults
}
