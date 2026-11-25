import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

export const Route = createFileRoute('/api/platform/storage/$ref/vector-buckets/')({
  server: {
    handlers: createApiHandlers({
      GET: async () => {
        const { data, error } = await supabase.storage.vectors.listBuckets()
        if (error) return Response.json({ error: { message: error.message } }, { status: 500 })

        return Response.json(data, { status: 200 })
      },
      POST: async ({ request }) => {
        const { bucketName } = await parseJsonBody<{ bucketName: string }>(request)
        const { data, error } = await supabase.storage.vectors.createBucket(bucketName)
        if (error) return Response.json({ error: { message: error.message } }, { status: 400 })
        return Response.json(data, { status: 200 })
      },
    }),
  },
})
