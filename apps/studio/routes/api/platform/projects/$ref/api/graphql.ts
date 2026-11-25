import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/platform/projects/$ref/api/graphql')({
  server: {
    handlers: createApiHandlers({
      POST: async ({ request }) => {
        const authorizationHeader = request.headers.get('x-graphql-authorization')
        const body = await parseJsonBody(request)

        const response = await fetch(`${process.env.SUPABASE_URL}/graphql/v1`, {
          method: 'POST',
          headers: {
            apikey: process.env.SUPABASE_SERVICE_KEY!,
            Authorization: authorizationHeader ?? `Bearer ${process.env.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
        if (response.ok) {
          const data = await response.json()

          return Response.json(data, { status: 200 })
        }

        return Response.json({ error: { message: 'Internal Server Error' } }, { status: 500 })
      },
    }),
  },
})
