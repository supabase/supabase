import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/projects/[ref]/run-lints'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/projects/$ref/run-lints')({
  server: { handlers: { GET: handler } },
})
