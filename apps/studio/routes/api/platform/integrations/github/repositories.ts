import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/platform/integrations/github/repositories')({
  server: {
    handlers: createApiHandlers({
      GET: () => Response.json({ repositories: [] }, { status: 200 }),
    }),
  },
})
