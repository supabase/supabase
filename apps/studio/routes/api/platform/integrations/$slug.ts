import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/integrations/[slug]'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/integrations/$slug')({
  server: { handlers: { GET: handler } },
})
