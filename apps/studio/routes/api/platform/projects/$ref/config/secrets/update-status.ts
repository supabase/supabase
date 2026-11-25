import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/platform/projects/$ref/config/secrets/update-status')({
  server: {
    handlers: createApiHandlers({
      // Self-hosted Studio cannot trigger JWT secret rotations, so there is never
      // an in-flight update. Return null so the consuming UI renders the steady
      // state instead of spinning a loader against a 404'd endpoint.
      GET: () => Response.json({ update_status: null }, { status: 200 }),
    }),
  },
})
