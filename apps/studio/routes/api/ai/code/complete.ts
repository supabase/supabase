import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import complete from '@/pages/api/ai/code/complete'

const handler = toWebHandler(complete)

export const Route = createFileRoute('/api/ai/code/complete')({
  server: { handlers: { POST: handler } },
})
