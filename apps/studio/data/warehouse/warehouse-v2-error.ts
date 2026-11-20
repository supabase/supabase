import { handleError } from '@/data/fetchers'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * Throws a classified error for a failed v2 Management API request.
 *
 * v2 routes nest the error as `{ error: { code, message, description? } }`, while `handleError`
 * reads a top-level `message`. `message` is a fixed title for the error code and `description`
 * carries the specifics (for example why the project can't be used), so the description wins.
 *
 * `code` keeps the numeric HTTP status rather than the string error code: classification and
 * `checkLocalPipelinesNotSetUp` read it.
 */
export function handleWarehouseV2Error(error: unknown): never {
  if (!isRecord(error) || !isRecord(error.error)) return handleError(error)

  const { error: nested, ...rest } = error
  const message = [nested.description, nested.message].find(
    (value): value is string => typeof value === 'string' && value.length > 0
  )

  return handleError({ ...rest, message })
}
