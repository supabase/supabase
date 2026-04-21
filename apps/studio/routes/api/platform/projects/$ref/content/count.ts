import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/projects/[ref]/content/count'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/projects/$ref/content/count')({
  server: { handlers: { GET: handler } },
})
