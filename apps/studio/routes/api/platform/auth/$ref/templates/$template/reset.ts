import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/auth/[ref]/templates/[template]/reset'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/auth/$ref/templates/$template/reset')({
  server: { handlers: { POST: handler } },
})
