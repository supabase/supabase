/**
 * Extracts a human-readable error message from various error types.
 */
export function getErrorMessage(error: unknown): string | null {
  if (error === null || error === undefined) return null
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message)
  }
  return String(error)
}
