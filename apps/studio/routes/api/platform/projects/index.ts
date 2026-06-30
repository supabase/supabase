import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/projects'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/projects/')({
  server: { handlers: { GET: handler } },
})
