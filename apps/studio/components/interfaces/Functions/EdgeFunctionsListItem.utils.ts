/**
 * Formats a numeric error rate (0–100) into a display string.
 *
 * Examples:
 *   0      → "0%"
 *   0.05   → "<0.1%"
 *   0.1    → "0.1%"
 *   1.567  → "1.6%"
 *   100    → "100%"
 */
export function formatErrorRate(value: number): string {
  if (value === 0) return '0%'
  if (value >= 100) return '100%'
  if (value < 0.1) return '<0.1%'
  return `${value.toFixed(1)}%`
}
