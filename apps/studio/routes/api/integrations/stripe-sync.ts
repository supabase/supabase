import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import stripeSync from '@/pages/api/integrations/stripe-sync'

const handler = toWebHandler(stripeSync)

export const Route = createFileRoute('/api/integrations/stripe-sync')({
  server: { handlers: { POST: handler, DELETE: handler } },
})
