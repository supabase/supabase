import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import checkCname from '@/pages/api/check-cname'

const handler = toWebHandler(checkCname)

export const Route = createFileRoute('/api/check-cname')({
  server: { handlers: { GET: handler } },
})
