import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

const createVectorBucketBodySchema = z.object({
  bucketName: z.string(),
})

export const Route = createFileRoute('/api/platform/storage/$ref/vector-buckets/')({
  server: {
    handlers: createApiHandlers({
      GET: async () => {
        const { data, error } = await supabase.storage.vectors.listBuckets()
        if (error) return Response.json({ error: { message: error.message } }, { status: 500 })

        return Response.json(data)
      },
      POST: async ({ request }) => {
        const body = await parseJsonBody(request)
        const parsed = createVectorBucketBodySchema.safeParse(body)
        if (!parsed.success) {
          return Response.json({ error: { message: 'Invalid request body' } }, { status: 400 })
        }

        const { data, error } = await supabase.storage.vectors.createBucket(parsed.data.bucketName)
        if (error) return Response.json({ error: { message: error.message } }, { status: 400 })
        return Response.json(data)
      },
    }),
  },
})
