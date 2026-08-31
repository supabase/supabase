import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/storage/[ref]/vector-buckets/[id]/indexes/[indexName]'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute(
  '/api/platform/storage/$ref/vector-buckets/$id/indexes/$indexName'
)({
  server: { handlers: { DELETE: handler } },
})
