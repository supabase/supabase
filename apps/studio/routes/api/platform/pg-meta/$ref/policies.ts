import { createFileRoute } from '@tanstack/react-router'

import { fetchGet } from '@/data/fetchers'
import { constructHeaders } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { PG_META_URL } from '@/lib/constants'

export const Route = createFileRoute('/api/platform/pg-meta/$ref/policies')({
  server: {
    handlers: createApiHandlers(
      {
        GET: async ({ request }) => {
          const headers = constructHeaders(request.headers)
          const response = await fetchGet(`${PG_META_URL}/policies`, { headers })

          if (response.error) {
            const { code, message } = response.error
            return Response.json({ message }, { status: code ?? 500 })
          }
          return Response.json(response, { status: 200 })
        },
      },
      { withAuth: true }
    ),
  },
})
