export const isTimeMetric = (dataKey: string) => dataKey.endsWith('p50') || dataKey.endsWith('p95')

export const formatTime = (value: number) => {
  const d = new Date(value)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
