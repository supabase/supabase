import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import policy from '@/pages/api/ai/sql/policy'

const handler = toWebHandler(policy)

export const Route = createFileRoute('/api/ai/sql/policy')({
  server: { handlers: { POST: handler } },
})
