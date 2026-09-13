import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/integrations/github/connections'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/integrations/github/connections')({
  server: { handlers: { GET: handler } },
})
