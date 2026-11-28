import { createFileRoute } from '@tanstack/react-router'

import { createPgMetaProxyHandlers } from '@/lib/api/self-hosted/pg-meta'

export const Route = createFileRoute('/api/platform/pg-meta/$ref/materialized-views')({
  server: { handlers: createPgMetaProxyHandlers('materialized-views') },
})
