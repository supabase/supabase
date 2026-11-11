import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/storage/[ref]/buckets/[id]/objects'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/storage/$ref/buckets/$id/objects/')({
  server: { handlers: { DELETE: handler } },
})
