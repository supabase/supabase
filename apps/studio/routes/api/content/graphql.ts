import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'

const CONTENT_API_URL = process.env.NEXT_PUBLIC_CONTENT_API_URL!

export const Route = createFileRoute('/api/content/graphql')({
  server: {
    handlers: createApiHandlers({
      POST: async ({ request }) => {
        const body = await parseJsonBody(request)

        try {
          const response = await fetch(CONTENT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

          const data = await response.json()
          return Response.json(data, { status: response.status })
        } catch (error) {
          console.error('Content API proxy error:', error)
          return Response.json({ error: 'Failed to reach Content API' }, { status: 500 })
        }
      },
    }),
  },
})
