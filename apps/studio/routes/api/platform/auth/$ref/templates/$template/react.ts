import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/auth/[ref]/templates/[template]/react'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/auth/$ref/templates/$template/react')({
  server: { handlers: { GET: handler, PUT: handler } },
})
