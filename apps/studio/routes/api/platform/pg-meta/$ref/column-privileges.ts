import { createFileRoute } from '@tanstack/react-router'

import { fetchGet } from '@/data/fetchers'
import { constructHeaders, getPgMetaRedirectUrl } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/platform/pg-meta/$ref/column-privileges')({
  server: {
    handlers: createApiHandlers(
      {
        GET: async ({ request }) => {
          const headers = constructHeaders(request.headers)
          const response = await fetchGet(getPgMetaRedirectUrl(request, 'column-privileges'), {
            headers,
          })

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
