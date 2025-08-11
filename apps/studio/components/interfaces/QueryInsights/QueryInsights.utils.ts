/**
 * Formats a latency value in milliseconds to a human-readable string
 * with appropriate units (μs, ms, or s) based on the magnitude.
 *
 * @param value - The latency value in milliseconds
 * @returns Formatted string with appropriate unit
 */
export function formatLatency(value: number): string {
  if (value === 0) return '0 ms'
  if (value < 1) return `${(value * 1000).toFixed(2)} μs`
  if (value < 1000) return `${value.toFixed(2)} ms`
  return `${(value / 1000).toFixed(2)} s`
}

/**
 * Formats large numbers with thousands separators for better readability
 * Used for metrics like row counts, query calls, and other statistical values
 * that can grow to large numbers.
 *
 * Examples:
 * - 1000 -> "1,000"
 * - 1000000 -> "1,000,000"
 *
 * @param value - The number to format
 * @returns Formatted string with thousands separators
 */
export function formatMetricValue(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
