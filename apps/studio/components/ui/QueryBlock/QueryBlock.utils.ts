import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'

export const checkHasNonPositiveValues = (data: Record<string, unknown>[], key: string): boolean =>
  data.some((row) => (row[key] as number) <= 0)

export const formatLogTick = (value: number): string => {
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`
  if (value >= 1_000)
    return `${(value / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`
  return value.toLocaleString()
}

// Add helper function for cumulative results
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
