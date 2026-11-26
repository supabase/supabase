import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/platform/projects/$ref/config/')({
  server: {
    handlers: createApiHandlers({
      // Platform specific endpoint
      GET: () =>
        Response.json({
          db_anon_role: 'anon',
          db_extra_search_path: 'public',
          db_schema: 'public, storage',
          jwt_secret:
            process.env.AUTH_JWT_SECRET ??
            'super-secret-jwt-token-with-at-least-32-characters-long',
          max_rows: 100,
          role_claim_key: '.role',
        }),
      // Platform specific endpoint
      PATCH: () => Response.json({}),
    }),
  },
})
