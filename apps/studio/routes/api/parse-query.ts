import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/parse-query'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/parse-query')({
  server: { handlers: { POST: handler } },
})
