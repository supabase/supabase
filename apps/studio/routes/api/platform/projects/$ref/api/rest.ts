import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/platform/projects/$ref/api/rest')({
  server: {
    handlers: createApiHandlers({
      GET: async () => {
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
          method: 'GET',
          headers: {
            apikey: process.env.SUPABASE_SERVICE_KEY!,
          },
        })
        if (response.ok) {
          const data = await response.json()

          return Response.json(data, { status: 200 })
        }

        return Response.json({ error: { message: 'Internal Server Error' } }, { status: 500 })
      },
      HEAD: () => new Response(null, { status: 200 }),
    }),
  },
})
