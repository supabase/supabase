import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import filterV1 from '@/pages/api/ai/sql/filter-v1'

const handler = toWebHandler(filterV1)

export const Route = createFileRoute('/api/ai/sql/filter-v1')({
  server: { handlers: { POST: handler } },
})
