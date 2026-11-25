import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { getProjectSettings } from '@/lib/api/self-hosted/settings'

export const Route = createFileRoute('/api/platform/projects/$ref/settings')({
  server: {
    handlers: createApiHandlers({
      GET: () => Response.json(getProjectSettings(), { status: 200 }),
    }),
  },
})
