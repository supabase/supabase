import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import getIpAddress from '@/pages/api/get-ip-address'

const handler = toWebHandler(getIpAddress)

export const Route = createFileRoute('/api/get-ip-address')({
  server: { handlers: { GET: handler } },
})
