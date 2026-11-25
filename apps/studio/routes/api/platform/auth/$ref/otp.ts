import { createFileRoute } from '@tanstack/react-router'

import { fetchPost } from '@/data/fetchers'
import { constructHeaders, parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/platform/auth/$ref/otp')({
  server: {
    handlers: createApiHandlers({
      POST: async ({ request }) => {
        const headers = constructHeaders({
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        })
        const url = `${process.env.SUPABASE_URL}/auth/v1/otp`
        const { phone } = await parseJsonBody<{ phone?: string }>(request)
        const payload = { phone }

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
