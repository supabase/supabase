import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import statusOverride from '@/pages/api/status-override'

const handler = toWebHandler(statusOverride)

export const Route = createFileRoute('/api/status-override')({
  server: { handlers: { GET: handler } },
})
