import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

export const Route = createFileRoute('/api/platform/storage/$ref/vector-buckets/$id/')({
  server: {
    handlers: createApiHandlers({
      GET: async ({ params }) => {
        const { data, error } = await supabase.storage.vectors.getBucket(params.id as string)
        if (error) return Response.json({ error: { message: error.message } }, { status: 400 })
        return Response.json(data.vectorBucket, { status: 200 })
      },
      DELETE: async ({ params }) => {
        const { data, error } = await supabase.storage.vectors.deleteBucket(params.id as string)
        if (error) return Response.json({ error: { message: error.message } }, { status: 400 })
        return Response.json(data, { status: 200 })
      },
    }),
  },
})
