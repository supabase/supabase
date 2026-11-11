import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import generateV4 from '@/pages/api/ai/sql/generate-v4'

const handler = toWebHandler(generateV4)

export const Route = createFileRoute('/api/ai/sql/generate-v4')({
  server: { handlers: { POST: handler } },
})
