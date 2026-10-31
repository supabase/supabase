export function metricColor(value: number): string {
  if (value >= 90) return 'text-destructive'
  if (value >= 80) return 'text-warning'
  return 'text-foreground-light'
}
