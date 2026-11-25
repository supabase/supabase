import { createFileRoute } from '@tanstack/react-router'

import { constructHeaders, parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { applyAndTrackMigrations, listMigrationVersions } from '@/lib/api/self-hosted/migrations'
import { PgMetaDatabaseError } from '@/lib/api/self-hosted/types'

export const Route = createFileRoute('/api/v1/projects/$ref/database/migrations')({
  server: {
    handlers: createApiHandlers(
      {
        GET: async ({ request }) => {
          const headers = constructHeaders(request.headers)
          const { data, error } = await listMigrationVersions({ headers })

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
        POST: async ({ request }) => {
          const headers = constructHeaders(request.headers)
          const { query, name } = await parseJsonBody<{ query: string; name?: string }>(request)

          const { data, error } = await applyAndTrackMigrations({ query, name, headers })

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
