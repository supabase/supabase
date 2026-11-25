import { createFileRoute } from '@tanstack/react-router'

import { constructHeaders, parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { executeQuery } from '@/lib/api/self-hosted/query'
import { PgMetaDatabaseError } from '@/lib/api/self-hosted/types'

export const Route = createFileRoute('/api/platform/pg-meta/$ref/query/')({
  server: {
    handlers: createApiHandlers(
      {
        POST: async ({ request }) => {
          const { query } = await parseJsonBody<{ query: string }>(request)
          const headers = constructHeaders(request.headers)
          const { data, error } = await executeQuery({ query, headers })

          if (error) {
            if (error instanceof PgMetaDatabaseError) {
              const { statusCode, message, formattedError } = error
              return Response.json({ message, formattedError }, { status: statusCode })
            }
            const { message } = error
            return Response.json({ message, formattedError: message }, { status: 500 })
          }
          return Response.json(data, { status: 200 })
        },
      },
      { withAuth: true }
    ),
  },
})
