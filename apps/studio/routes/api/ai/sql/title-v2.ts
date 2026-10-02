import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import titleV2 from '@/pages/api/ai/sql/title-v2'

const handler = toWebHandler(titleV2)

export const Route = createFileRoute('/api/ai/sql/title-v2')({
  server: { handlers: { POST: handler } },
})
