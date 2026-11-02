import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/props/org/[slug]'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/props/org/$slug')({
  server: { handlers: { GET: handler } },
})
