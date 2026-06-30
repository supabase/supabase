import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/projects/[ref]/analytics/log-drains/[uuid]'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/projects/$ref/analytics/log-drains/$uuid')({
  server: { handlers: { GET: handler, PUT: handler, DELETE: handler } },
})
