import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/ai/sql/check-api-key')({
  server: {
    handlers: createApiHandlers(
      {
        GET: () => Response.json({ hasKey: Boolean(process.env.OPENAI_API_KEY) }, { status: 200 }),
      },
      { withAuth: true }
    ),
  },
})
