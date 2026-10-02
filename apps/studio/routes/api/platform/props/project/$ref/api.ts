import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/props/project/[ref]/api'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/props/project/$ref/api')({
  server: { handlers: { GET: handler } },
})
