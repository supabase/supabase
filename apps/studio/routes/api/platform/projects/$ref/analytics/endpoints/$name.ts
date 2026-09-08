import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/projects/[ref]/analytics/endpoints/[name]'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/projects/$ref/analytics/endpoints/$name')({
  server: { handlers: { GET: handler, POST: handler } },
})
