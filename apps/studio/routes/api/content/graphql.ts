import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import graphql from '@/pages/api/content/graphql'

const handler = toWebHandler(graphql)

export const Route = createFileRoute('/api/content/graphql')({
  server: { handlers: { POST: handler } },
})
