import { createFileRoute } from '@tanstack/react-router'

import { constructHeaders, parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { pgMetaErrorResponse } from '@/lib/api/self-hosted/pg-meta'
import { executeQuery } from '@/lib/api/self-hosted/query'

export const Route = createFileRoute('/api/platform/pg-meta/$ref/query/')({
  server: {
    handlers: createApiHandlers(
      {
        POST: async ({ request }) => {
          const { query } = await parseJsonBody<{ query: string }>(request)
          const headers = constructHeaders(Object.fromEntries(request.headers))
          const { data, error } = await executeQuery({ query, headers })

          return error ? pgMetaErrorResponse(error) : Response.json(data)
        },
      },
      { withAuth: true }
    ),
  },
})
