import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/v2/projects/[ref]/analytics/log-drains/[id]'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/v2/projects/$ref/analytics/log-drains/$id')({
  server: { handlers: { PUT: handler, DELETE: handler } },
})
