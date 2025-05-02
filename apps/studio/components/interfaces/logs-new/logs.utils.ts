/**
 * Utilities for log handling and display
 */

/**
 * Determines the log level based on status code
 * @param statusCode HTTP status code as number or string
 * @returns 'success', 'info', 'warn', or 'error'
 */
export function determineLogLevelFromStatus(statusCode: string | number | undefined): string {
  // Default to info if no status code
  if (!statusCode) return 'info'

  // Convert to number if it's a string
  const code = typeof statusCode === 'string' ? parseInt(statusCode, 10) : statusCode

  // Handle NaN case
  if (isNaN(code)) return 'info'

  // Determine level based on status code ranges
  if (code >= 200 && code < 300) return 'success'
  if (code >= 400 && code < 500) return 'warning'
  if (code >= 500) return 'error'

  // Default for other codes
  return 'info'
}

/**
 * Determines the log level based on log type and status
 * Different log sources may have different level determination logic
 */
export function determineLogLevel(
  logType: string,
  statusCode: string | number | undefined,
  defaultLevel?: string
): string {
  // If a meaningful level is already provided, use it
  if (defaultLevel && defaultLevel !== 'undefined') return defaultLevel

  // Handle specific log types
  switch (logType) {
    case 'edge':
      return determineLogLevelFromStatus(statusCode)
    case 'auth':
    case 'edge function':
      return determineLogLevelFromStatus(statusCode)

    case 'postgres':
      // Could add postgres-specific error code handling here
      return statusCode ? 'warn' : 'info'

    case 'function events':
      // Default to info if not specified
      return defaultLevel || 'info'

    // Add more log types as needed

    default:
      return 'info'
  }
}
