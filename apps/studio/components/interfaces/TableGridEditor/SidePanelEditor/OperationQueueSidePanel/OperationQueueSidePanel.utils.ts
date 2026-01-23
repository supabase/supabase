/**
 * Formats a value for display in the operation queue.
 * Handles null, undefined, objects, and primitive values.
 */
export const formatValue = (value: unknown): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
