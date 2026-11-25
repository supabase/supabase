import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/platform/projects/$ref/api-keys/temporary')({
  server: {
    handlers: createApiHandlers({
      POST: () =>
        Response.json(
          {
            api_key: process.env.SUPABASE_SERVICE_KEY ?? '',
          },
          { status: 200 }
        ),
    }),
  },
})
