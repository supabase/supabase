import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/ai/sql/parse-client-code'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/ai/sql/parse-client-code')({
  server: { handlers: { POST: handler } },
})
