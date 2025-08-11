/**
 * Formats a latency value in milliseconds to a human-readable string
 * with appropriate units (μs, ms, or s) based on the magnitude.
 */
export function formatLatency(value: number): string

/**
 * Formats large numbers with thousands separators for better readability
 * Used for metrics like row counts, query calls, and other statistical values.
 */
export function formatMetricValue(value: number): string
