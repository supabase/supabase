import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

export const Route = createFileRoute(
  '/api/platform/storage/$ref/vector-buckets/$id/indexes/$indexName'
)({
  server: {
    handlers: createApiHandlers({
      DELETE: async ({ params }) => {
        const { data, error } = await supabase.storage.vectors
          .from(params.id)
          .deleteIndex(params.indexName)

        if (error) return Response.json({ error: { message: error.message } }, { status: 400 })
        return Response.json(data)
      },
    }),
  },
})
