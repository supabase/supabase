import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/telemetry/event'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/telemetry/event')({
  server: { handlers: { POST: handler } },
})
