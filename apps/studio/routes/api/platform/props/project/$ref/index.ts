import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { DEFAULT_PROJECT } from '@/lib/constants/api'

export const Route = createFileRoute('/api/platform/props/project/$ref/')({
  server: {
    handlers: createApiHandlers({
      GET: () =>
        // Platform specific endpoint
        Response.json(
          {
            project: {
              ...DEFAULT_PROJECT,
              services: [],
            },
          },
          { status: 200 }
        ),
    }),
  },
})
