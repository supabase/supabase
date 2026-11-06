import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import test from '@/pages/api/edge-functions/test'

const handler = toWebHandler(test)

export const Route = createFileRoute('/api/edge-functions/test')({
  server: { handlers: { POST: handler } },
})
