export const checkHasNonPositiveValues = (
  data: readonly Record<string, unknown>[],
  key: string
): boolean => data.some((row) => (row[key] as number) <= 0)

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

  const maxMagnitude = data.reduce((max, d) => {
    const magnitude = Math.abs(Number(d[key]) || 0)
    return magnitude > max ? magnitude : max
  }, 0)
  return Math.max(36, (formatYAxisTick(maxMagnitude).length + 1) * 8)
}

export const formatLogTick = (value: number): string => {
  if (value >= 1_000_000)
    return `${(value / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`
  if (value >= 1_000)
    return `${(value / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`
  return value.toLocaleString()
}

export const getCumulativeResults = (
  results: { rows: readonly any[] },
  config: { yKey: string | string[] }
) => {
  if (!results?.rows?.length) {
    return []
  }

  const yKeys = Array.isArray(config.yKey) ? config.yKey : [config.yKey]

  const cumulativeResults = results.rows.reduce((acc, row) => {
    const prev = acc[acc.length - 1] || {}
    const next = { ...row }
    yKeys.forEach((yKey) => {
      // Coerce to Number before adding: Postgres returns `bigint`, `numeric`,
      // `money` and `count(*)` columns as strings, so a bare `+` would
      // concatenate (e.g. "10" + "20" -> "1020") instead of summing.
      next[yKey] = (Number(prev[yKey]) || 0) + (Number(row[yKey]) || 0)
    })
    return [...acc, next]
  }, [])

  return cumulativeResults
}
