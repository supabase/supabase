import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

export const Route = createFileRoute('/api/platform/storage/$ref/buckets/$id/objects/move')({
  server: {
    handlers: createApiHandlers({
      POST: async ({ request, params }) => {
        const { from, to } = await parseJsonBody<{ from: string; to: string }>(request)

        const { data, error } = await supabase.storage.from(params.id as string).move(from, to)
        if (error) {
          return Response.json({ error: { message: error.message } }, { status: 400 })
        }

        return Response.json(data, { status: 200 })
      },
    }),
  },
})
