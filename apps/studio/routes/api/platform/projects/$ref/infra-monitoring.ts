import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/platform/projects/$ref/infra-monitoring')({
  server: {
    handlers: createApiHandlers({
      // Platform specific endpoint
      GET: () => Response.json({ data: [], yAxisLimit: 0, format: '%', total: 0 }),
    }),
  },
})
