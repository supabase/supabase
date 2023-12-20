export function isError(error: unknown): error is Error {
  return (
    !!error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
  )
}
