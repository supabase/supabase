import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { DEFAULT_PROJECT, PROJECT_REST_URL } from '@/lib/constants/api'

export const Route = createFileRoute('/api/platform/projects/$ref/')({
  server: {
    handlers: createApiHandlers({
      GET: () =>
        // Platform specific endpoint
        Response.json(
          {
            ...DEFAULT_PROJECT,
            connectionString: '',
            restUrl: PROJECT_REST_URL,
          },
          { status: 200 }
        ),
    }),
  },
})
