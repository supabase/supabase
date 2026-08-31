import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/pg-meta/[ref]/tables'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/pg-meta/$ref/tables')({
  server: { handlers: { GET: handler } },
})
