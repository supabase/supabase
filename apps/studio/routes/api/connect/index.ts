import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import getFileNames from '@/pages/api/connect'

const handler = toWebHandler(getFileNames)

export const Route = createFileRoute('/api/connect/')({
  server: { handlers: { GET: handler } },
})
