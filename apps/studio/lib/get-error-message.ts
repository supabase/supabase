/**
 * Extracts a human-readable message from an unknown thrown value, optionally
 * falling back when there isn't one.
 */
export function getErrorMessage(error: unknown): string | null
export function getErrorMessage(error: unknown, fallback: string): string
export function getErrorMessage(error: unknown, fallback?: string): string | null {
  if (typeof error === 'string') {
    const trimmed = error.trim()
    if (trimmed.length > 0) return trimmed
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error
    if (typeof message === 'string') {
      const trimmed = message.trim()
      if (trimmed.length > 0) return trimmed
    }
  }

  return fallback ?? null
}
