import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/profile'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/profile/')({
  server: { handlers: { GET: handler } },
})
