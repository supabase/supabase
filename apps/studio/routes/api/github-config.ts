import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/github-config'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/github-config')({
  server: { handlers: { GET: handler, POST: handler } },
})
