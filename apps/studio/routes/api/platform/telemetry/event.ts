import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/platform/telemetry/event')({
  server: {
    handlers: createApiHandlers({
      // Platform specific endpoint
      POST: () => Response.json({}, { status: 200 }),
    }),
  },
})
