import { createFileRoute } from '@tanstack/react-router'

import { fetchPost } from '@/data/fetchers'
import { constructHeaders, parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/platform/auth/$ref/invite')({
  server: {
    handlers: createApiHandlers({
      POST: async ({ request }) => {
        const headers = constructHeaders({
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        })
        const url = `${process.env.SUPABASE_URL}/auth/v1/invite`
        const { email } = await parseJsonBody<{ email?: string }>(request)
        const payload = { email }

        const response = await fetchPost(url, payload, { headers })
        if (response.error) {
          const { code, message } = response.error
          return Response.json({ message }, { status: code ?? 500 })
        }
        return Response.json(response, { status: 200 })
      },
    }),
  },
})
