import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import rate from '@/pages/api/ai/feedback/rate'

const handler = toWebHandler(rate)

export const Route = createFileRoute('/api/ai/feedback/rate')({
  server: { handlers: { POST: handler } },
})
