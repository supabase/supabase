import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/get-s3-keys'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/get-s3-keys')({
  server: { handlers: { GET: handler } },
})
