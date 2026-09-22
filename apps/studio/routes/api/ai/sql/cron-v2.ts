import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import cronV2 from '@/pages/api/ai/sql/cron-v2'

const handler = toWebHandler(cronV2)

export const Route = createFileRoute('/api/ai/sql/cron-v2')({
  server: { handlers: { POST: handler } },
})
