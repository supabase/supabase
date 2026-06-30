import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/auth/[ref]/recover'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/auth/$ref/recover')({
  server: { handlers: { POST: handler } },
})
