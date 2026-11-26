import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

// Invalid values are dropped rather than rejected
const listBucketsQuerySchema = z.object({
  limit: z.coerce.number().int().optional().catch(undefined),
  offset: z.coerce.number().int().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  sortColumn: z.enum(['id', 'created_at', 'name']).optional().catch(undefined),
  sortOrder: z.enum(['asc', 'desc']).optional().catch(undefined),
})

interface CreateBucketBody {
  id: string
  public: boolean
  allowed_mime_types?: string[] | null
  file_size_limit?: number | string | null
}

export const Route = createFileRoute('/api/platform/storage/$ref/buckets/')({
  server: {
    handlers: createApiHandlers({
      GET: async ({ request }) => {
        const { limit, offset, search, sortColumn, sortOrder } = listBucketsQuerySchema.parse(
          Object.fromEntries(new URL(request.url).searchParams)
        )

        // Only pass keys that are set: storage-js serializes a present undefined value as 'undefined'
        const { data, error } = await supabase.storage.listBuckets({
          ...(limit ? { limit } : {}),
          ...(offset ? { offset } : {}),
          ...(search ? { search } : {}),
          ...(sortColumn ? { sortColumn } : {}),
          ...(sortOrder ? { sortOrder } : {}),
        })
        if (error) {
          return Response.json({ error: { message: 'Internal Server Error' } }, { status: 500 })
        }

        return Response.json(data)
      },
      POST: async ({ request }) => {
        const {
          id,
          public: isPublicBucket,
          allowed_mime_types: allowedMimeTypes,
          file_size_limit: fileSizeLimit,
        } = await parseJsonBody<CreateBucketBody>(request)

        const { data, error } = await supabase.storage.createBucket(id, {
          public: isPublicBucket,
          allowedMimeTypes,
          fileSizeLimit,
        })
        if (error) {
          return Response.json({ error: { message: error.message } }, { status: 400 })
        }

        return Response.json(data)
      },
    }),
  },
})
