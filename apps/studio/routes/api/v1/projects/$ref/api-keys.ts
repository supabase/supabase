import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import {
  applyRevealToApiKey,
  getNonPlatformApiKeys,
  parseRevealQuery,
} from '@/lib/api/self-hosted/api-keys'

export const Route = createFileRoute('/api/v1/projects/$ref/api-keys')({
  server: {
    handlers: createApiHandlers({
      GET: ({ request }) => {
        const reveal = parseRevealQuery(
          new URL(request.url).searchParams.get('reveal') ?? undefined
        )
        const response = getNonPlatformApiKeys().map((key) => applyRevealToApiKey(key, reveal))

        return Response.json(response, { status: 200 })
      },
    }),
  },
})
