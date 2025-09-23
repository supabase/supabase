import { PG_META_URL } from 'lib/constants/index'
import { constructHeaders } from '../apiHelpers'
import { PgMetaDatabaseError, databaseErrorSchema, WrappedResult } from './types'
import { assertSelfHosted } from './util'

export type QueryOptions = {
  query: string
  headers?: HeadersInit
}

/**
 * Executes a SQL query against the self-hosted Postgres instance via pg-meta service.
 *
 * _Only call this from server-side self-hosted code._
 */
export async function executeQuery<T = unknown>({
  query,
  headers,
}: QueryOptions): Promise<WrappedResult<T[]>> {
  assertSelfHosted()

  const response = await fetch(`${PG_META_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...constructHeaders(headers ?? {}),
    },
    body: JSON.stringify({ query }),
  })

  try {
    const result = await response.json()

    if (!response.ok) {
      const { message, code, formattedError } = databaseErrorSchema.parse(result)
      const error = new PgMetaDatabaseError(message, code, response.status, formattedError)
      return { data: undefined, error }
    }

    return { data: result, error: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { data: undefined, error }
    }
    throw error
  }
}
