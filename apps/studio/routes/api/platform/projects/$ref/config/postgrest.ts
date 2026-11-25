import { createFileRoute } from '@tanstack/react-router'
import { components } from 'api-types'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { DEFAULT_EXPOSED_SCHEMAS } from '@/lib/api/self-hosted/constants'

export const Route = createFileRoute('/api/platform/projects/$ref/config/postgrest')({
  server: {
    handlers: createApiHandlers({
      GET: () => {
        const responseObj: components['schemas']['GetPostgrestConfigResponse_Output'] = {
          db_anon_role: 'anon',
          db_extra_search_path: process.env.PGRST_DB_EXTRA_SEARCH_PATH ?? 'public',
          db_schema: DEFAULT_EXPOSED_SCHEMAS,
          jwt_secret:
            process.env.AUTH_JWT_SECRET ??
            'super-secret-jwt-token-with-at-least-32-characters-long',
          max_rows: Number(process.env.PGRST_DB_MAX_ROWS) || 1000,
          role_claim_key: '.role',
        }

        return Response.json(responseObj, { status: 200 })
      },
    }),
  },
})
