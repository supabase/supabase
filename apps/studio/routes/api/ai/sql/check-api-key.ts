import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import checkApiKey from '@/pages/api/ai/sql/check-api-key'

const handler = toWebHandler(checkApiKey)

export const Route = createFileRoute('/api/ai/sql/check-api-key')({
  server: { handlers: { GET: handler } },
})
