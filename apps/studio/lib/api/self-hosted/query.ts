import * as Sentry from '@sentry/nextjs'

import { constructHeaders } from '../apiHelpers'
import { databaseErrorSchema, PgMetaDatabaseError, WrappedResult } from './types'
import { assertSelfHosted, encryptString, getConnectionString } from './util'
import { PG_META_URL } from '@/lib/constants/index'

export type QueryOptions = {
  query: string
  parameters?: unknown[]
  readOnly?: boolean
  headers?: HeadersInit
}

/**
 * Executes a SQL query against the self-hosted Postgres instance via pg-meta service.
 *
 * _Only call this from server-side self-hosted code._
 */
export async function executeQuery<T = unknown>({
  query,
  parameters,
  readOnly = false,
  headers,
}: QueryOptions): Promise<WrappedResult<T[]>> {
  assertSelfHosted()

  const connectionString = getConnectionString({ readOnly })
  const connectionStringEncrypted = encryptString(connectionString)

  const requestBody: { query: string; parameters?: unknown[] } = { query }
  if (parameters !== undefined) {
    requestBody.parameters = parameters
  }

  return await Sentry.startSpan({ name: 'pg-meta.query', op: 'db.query' }, async (span) => {
    const response = await fetch(`${PG_META_URL}/query`, {
      method: 'POST',
      headers: constructHeaders({
        ...headers,
        'Content-Type': 'application/json',
        'x-connection-encrypted': connectionStringEncrypted,
      }),
      body: JSON.stringify(requestBody),
    })

    try {
      const result = await response.json()

      if (!response.ok) {
        const { message, code, formattedError } = databaseErrorSchema.parse(result)
        span.setAttribute('db.error', 1)
        span.setAttribute('db.status_code', response.status)
        const error = new PgMetaDatabaseError(message, code, response.status, formattedError)
        return { data: undefined, error }
      }

      span.setAttribute('db.status_code', response.status)
      return { data: result, error: undefined }
    } catch (error) {
      span.setAttribute('db.error', 1)
      if (error instanceof Error) {
        return { data: undefined, error }
      }
      throw error
    }
  })
}
