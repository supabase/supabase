import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import assistantPolicy from '@/pages/api/ai/assistant-policy'

const handler = toWebHandler(assistantPolicy)

export const Route = createFileRoute('/api/ai/assistant-policy')({
  server: { handlers: { POST: handler } },
})
