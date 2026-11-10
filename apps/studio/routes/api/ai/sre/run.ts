import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import sreRun from '@/pages/api/ai/sre/run'

const handler = toWebHandler(sreRun)

export const Route = createFileRoute('/api/ai/sre/run')({
  server: { handlers: { POST: handler } },
})
