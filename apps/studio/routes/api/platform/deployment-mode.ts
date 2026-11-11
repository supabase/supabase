import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/deployment-mode'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/deployment-mode')({
  server: { handlers: { GET: handler } },
})
