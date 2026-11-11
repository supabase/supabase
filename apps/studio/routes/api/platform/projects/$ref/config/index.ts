import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/projects/[ref]/config'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/projects/$ref/config/')({
  server: { handlers: { GET: handler, PATCH: handler } },
})
