export function formatMetricValue(value: number | null, suffix = ''): string {
  if (value === null) return 'No data'
  if (suffix === 'ms') return `${value.toFixed(2)}${suffix}`
  if (suffix === '%') return `${value.toFixed(1)}${suffix}`
  return `${Math.round(value).toLocaleString()}${suffix}`
}

export function formatMetricChange(change: number | null, suffix = ''): string | undefined {
  if (change === null) return undefined
  const unit = suffix === '%' ? ' pp' : '%'
  const roundedChange = Number(change.toFixed(1))
  return `${roundedChange.toFixed(1)}${unit}`
}
