const FILTER_ERROR_PATTERNS = [
  'invalid input syntax',
  'operator does not exist',
  'could not determine which collation',
  'invalid input value for enum',
  'malformed array literal',
  'invalid byte sequence',
  'syntax error',
]

export function isFilterRelatedError(errorMessage: string | undefined | null): boolean {
  if (!errorMessage) return false
  return FILTER_ERROR_PATTERNS.some((pattern) => errorMessage.includes(pattern))
}
