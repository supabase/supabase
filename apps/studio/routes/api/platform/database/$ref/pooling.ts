import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/platform/database/$ref/pooling')({
  server: {
    handlers: createApiHandlers({
      GET: () => {
        const project = {
          db_port: 6543,
          pool_mode: 'transaction',
          pgbouncer_enabled: true,
          pgbouncer_status: 'COMING_UP',
        }
        return Response.json({ project }, { status: 200 })
      },
      PATCH: () => Response.json({}, { status: 200 }),
    }),
  },
})
