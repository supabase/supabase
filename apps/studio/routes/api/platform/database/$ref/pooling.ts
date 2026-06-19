import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/database/[ref]/pooling'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/database/$ref/pooling')({
  server: { handlers: { GET: handler, PATCH: handler } },
})
