import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { DEFAULT_PROJECT } from '@/lib/constants/api'

export const Route = createFileRoute('/api/platform/projects/')({
  server: {
    handlers: createApiHandlers({
      // Platform specific endpoint
      GET: () => Response.json([DEFAULT_PROJECT], { status: 200 }),
    }),
  },
})
