import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

type CreateIndexOptions = Parameters<
  ReturnType<typeof supabase.storage.vectors.from>['createIndex']
>[0]

type CreateVectorIndexBody = Pick<
  CreateIndexOptions,
  'indexName' | 'dataType' | 'dimension' | 'distanceMetric'
> & { metadataKeys?: string[] }

export const Route = createFileRoute('/api/platform/storage/$ref/vector-buckets/$id/indexes/')({
  server: {
    handlers: createApiHandlers({
      GET: async ({ params }) => {
        const bucket = supabase.storage.vectors.from(params.id)
        const { data, error } = await bucket.listIndexes({ maxResults: 100 })

        if (error) return Response.json({ error: { message: error.message } }, { status: 500 })

        const indexes = await Promise.all(
          data.indexes.map(async ({ indexName }) => (await bucket.getIndex(indexName)).data?.index)
        )

        return Response.json({ indexes, nextToken: data.nextToken })
      },
      POST: async ({ request, params }) => {
        const { indexName, dataType, dimension, distanceMetric, metadataKeys } =
          await parseJsonBody<CreateVectorIndexBody>(request)

        const { data, error } = await supabase.storage.vectors.from(params.id).createIndex({
          indexName,
          dataType,
          dimension,
          distanceMetric,
          metadataConfiguration: { nonFilterableMetadataKeys: metadataKeys },
        })
        if (error) return Response.json({ error: { message: error.message } }, { status: 400 })
        return Response.json(data)
      },
    }),
  },
})
