import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import classify from '@/pages/api/ai/feedback/classify'

const handler = toWebHandler(classify)

export const Route = createFileRoute('/api/ai/feedback/classify')({
  server: { handlers: { POST: handler } },
})
