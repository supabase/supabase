import { createFileRoute } from '@tanstack/react-router'

import { constructHeaders, parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { applyAndTrackMigrations, listMigrationVersions } from '@/lib/api/self-hosted/migrations'
import { pgMetaErrorResponse } from '@/lib/api/self-hosted/pg-meta'

export const Route = createFileRoute('/api/v1/projects/$ref/database/migrations')({
  server: {
    handlers: createApiHandlers(
      {
        GET: async ({ request }) => {
          const headers = constructHeaders(Object.fromEntries(request.headers))
          const { data, error } = await listMigrationVersions({ headers })

          return error ? pgMetaErrorResponse(error) : Response.json(data)
        },
        POST: async ({ request }) => {
          const headers = constructHeaders(Object.fromEntries(request.headers))
          const { query, name } = await parseJsonBody<{ query: string; name?: string }>(request)
          const { data, error } = await applyAndTrackMigrations({ query, name, headers })

          return error ? pgMetaErrorResponse(error) : Response.json(data)
        },
      },
      { withAuth: true }
    ),
  },
})
