import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

interface UpdateBucketBody {
  public: boolean
  allowed_mime_types?: string[] | null
  file_size_limit?: number | string | null
}

export const Route = createFileRoute('/api/platform/storage/$ref/buckets/$id/')({
  server: {
    handlers: createApiHandlers({
      GET: async ({ params }) => {
        const { data, error } = await supabase.storage.getBucket(params.id as string)
        if (error) {
          return Response.json({ error: { message: error.message } }, { status: 400 })
        }

        return Response.json(data, { status: 200 })
      },
      PATCH: async ({ request, params }) => {
        const {
          public: isPublicBucket,
          allowed_mime_types: allowedMimeTypes,
          file_size_limit: fileSizeLimit,
        } = await parseJsonBody<UpdateBucketBody>(request)

        const { data, error } = await supabase.storage.updateBucket(params.id as string, {
          public: isPublicBucket,
          allowedMimeTypes,
          fileSizeLimit,
        })
        if (error) {
          return Response.json({ error: { message: error.message } }, { status: 400 })
        }

        return Response.json(data, { status: 200 })
      },
      DELETE: async ({ params }) => {
        const { data, error } = await supabase.storage.deleteBucket(params.id as string)
        if (error) {
          return Response.json({ error: { message: error.message } }, { status: 400 })
        }

        return Response.json(data, { status: 200 })
      },
    }),
  },
})
