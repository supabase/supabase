/**
 * Formats a value for display in the operation queue.
 * Handles null, undefined, objects, and primitive values.
 */
export const formatOperationItemValue = (value: unknown): string => {
  if (value === null) return 'NULL'
  if (value === undefined) return 'UNDEFINED'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
