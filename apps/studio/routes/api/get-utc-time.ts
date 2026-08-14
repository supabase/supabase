import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import getUtcTime from '@/pages/api/get-utc-time'

const handler = toWebHandler(getUtcTime)

export const Route = createFileRoute('/api/get-utc-time')({
  server: { handlers: { GET: handler } },
})
