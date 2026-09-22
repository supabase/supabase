import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/storage/[ref]/vector-buckets/[id]/indexes'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/storage/$ref/vector-buckets/$id/indexes/')({
  server: { handlers: { GET: handler, POST: handler } },
})
