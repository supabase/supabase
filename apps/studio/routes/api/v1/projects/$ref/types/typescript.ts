import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/v1/projects/[ref]/types/typescript'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/v1/projects/$ref/types/typescript')({
  server: { handlers: { GET: handler } },
})
