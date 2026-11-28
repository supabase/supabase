import { PgMetaDatabaseError } from './types'
import { fetchGet } from '@/data/fetchers'
import { constructHeaders } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { PG_META_URL } from '@/lib/constants'

/**
 * Route handlers that proxy an authenticated GET, query string included, to a pg-meta endpoint.
 */
export function createPgMetaProxyHandlers(endpoint: string) {
  return createApiHandlers(
    {
      GET: async ({ request }) => {
        const { search } = new URL(request.url)
        const headers = constructHeaders(Object.fromEntries(request.headers))
        const response = await fetchGet(`${PG_META_URL}/${endpoint}${search}`, { headers })

        if (response.error) {
          const { code, message } = response.error
          return Response.json({ message }, { status: code ?? 500 })
        }
        return Response.json(response)
      },
    },
    { withAuth: true }
  )
}

/**
 * Error response for a failed pg-meta query: keeps a `PgMetaDatabaseError`'s status and formatted
 * error, and falls back to 500 for anything else.
 */
export function pgMetaErrorResponse(error: Error) {
  if (error instanceof PgMetaDatabaseError) {
    const { statusCode, message, formattedError } = error
    return Response.json({ message, formattedError }, { status: statusCode })
  }
  const { message } = error
  return Response.json({ message, formattedError: message }, { status: 500 })
}
