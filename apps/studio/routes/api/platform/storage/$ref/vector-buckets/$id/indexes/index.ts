import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { selfHostedSupabaseAdmin as supabase } from '@/lib/api/self-hosted-admin'

type CreateIndexOptions = Parameters<
  ReturnType<typeof supabase.storage.vectors.from>['createIndex']
>[0]

interface CreateVectorIndexBody {
  indexName: CreateIndexOptions['indexName']
  dataType: CreateIndexOptions['dataType']
  dimension: CreateIndexOptions['dimension']
  distanceMetric: CreateIndexOptions['distanceMetric']
  metadataKeys?: string[]
}

export const Route = createFileRoute('/api/platform/storage/$ref/vector-buckets/$id/indexes/')({
  server: {
    handlers: createApiHandlers({
      GET: async ({ params }) => {
        const id = params.id as string
        const { data, error } = await supabase.storage.vectors
          .from(id)
          .listIndexes({ maxResults: 100 })

        if (error) return Response.json({ error: { message: error.message } }, { status: 500 })

        const indexes = await Promise.all(
          data.indexes.map(async ({ indexName }) => {
            return (await supabase.storage.vectors.from(id).getIndex(indexName)).data?.index
          })
        )

        return Response.json({ indexes, nextToken: data.nextToken }, { status: 200 })
      },
      POST: async ({ request, params }) => {
        const id = params.id as string
        const { indexName, dataType, dimension, distanceMetric, metadataKeys } =
          await parseJsonBody<CreateVectorIndexBody>(request)
        const payload: CreateIndexOptions = {
          indexName,
          dataType,
          dimension,
          distanceMetric,
          metadataConfiguration: { nonFilterableMetadataKeys: metadataKeys },
        }

        const { data, error } = await supabase.storage.vectors.from(id).createIndex(payload)
        if (error) return Response.json({ error: { message: error.message } }, { status: 400 })
        return Response.json(data, { status: 200 })
      },
    }),
  },
})
