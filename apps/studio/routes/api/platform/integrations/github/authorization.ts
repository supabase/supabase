import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/platform/integrations/github/authorization')({
  server: {
    handlers: createApiHandlers({
      GET: () => Response.json(null, { status: 200 }),
    }),
  },
})
