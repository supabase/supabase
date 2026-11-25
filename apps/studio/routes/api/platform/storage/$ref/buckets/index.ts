import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

const parseAsInt = (value: string | null): number | undefined =>
  value ? parseInt(value, 10) : undefined

const parseAsString = (value: string | null): string | undefined => value || undefined

const parseAsStringEnum = <T extends string>(
  value: string | null,
  validValues: readonly T[]
): T | undefined => {
  return value && validValues.includes(value as T) ? (value as T) : undefined
}

const parseStoragePaginationParams = (request: Request) => {
  const { searchParams } = new URL(request.url)

  const limit = parseAsInt(searchParams.get('limit'))
  const offset = parseAsInt(searchParams.get('offset'))
  const search = parseAsString(searchParams.get('search'))
  const sortColumn = parseAsStringEnum(searchParams.get('sortColumn'), [
    'id',
    'created_at',
    'name',
  ] as const)
  const sortOrder = parseAsStringEnum(searchParams.get('sortOrder'), ['asc', 'desc'] as const)

  return { limit, offset, search, sortColumn, sortOrder }
}

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
        const { limit, offset, search, sortColumn, sortOrder } =
          parseStoragePaginationParams(request)

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

        return Response.json(data, { status: 200 })
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

        return Response.json(data, { status: 200 })
      },
    }),
  },
})
