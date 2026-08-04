import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/auth/[ref]/users/[id]'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/auth/$ref/users/$id/')({
  server: { handlers: { PATCH: handler, DELETE: handler } },
})
