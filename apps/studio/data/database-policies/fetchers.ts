// [Joshen] These are being placed separately as they're also being used in the API
// which we should avoid mixing client side and server side logic (main problem was importing of react query)

import { DEFAULT_PLATFORM_APPLICATION_NAME } from '@supabase/pg-meta/src/constants'
import { get, handleError } from 'data/fetchers'

export type DatabasePoliciesVariables = {
  projectRef?: string
  connectionString?: string | null
  schema?: string
}

export async function getDatabasePolicies(
  { projectRef, connectionString, schema }: DatabasePoliciesVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  if (!projectRef) throw new Error('projectRef is required')

  let headers = new Headers(headersInit)
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/policies', {
    params: {
      header: {
        'x-connection-encrypted': connectionString!,
        'x-pg-application-name': DEFAULT_PLATFORM_APPLICATION_NAME,
      },
      path: { ref: projectRef },
      query: {
        included_schemas: schema || '',
        excluded_schemas: '',
      },
    },
    headers,
    signal,
  })

  if (error) handleError(error)
  return data
}
