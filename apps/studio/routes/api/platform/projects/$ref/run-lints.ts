import { createFileRoute } from '@tanstack/react-router'

import { constructHeaders } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { DEFAULT_EXPOSED_SCHEMAS } from '@/lib/api/self-hosted/constants'
import { getLints } from '@/lib/api/self-hosted/lints'

export const Route = createFileRoute('/api/platform/projects/$ref/run-lints')({
  server: {
    handlers: createApiHandlers({
      GET: async ({ request }) => {
        const { data, error } = await getLints({
          headers: constructHeaders(request.headers),
          exposedSchemas: DEFAULT_EXPOSED_SCHEMAS,
        })

        if (error) {
          return Response.json(error, { status: 400 })
        }
        return Response.json(data, { status: 200 })
      },
    }),
  },
})
