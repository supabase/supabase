import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { applyRevealToApiKey, getNonPlatformApiKeys } from '@/lib/api/self-hosted/api-keys'

export const Route = createFileRoute('/api/v1/projects/$ref/api-keys')({
  server: {
    handlers: createApiHandlers({
      GET: ({ request }) => {
        const reveal = new URL(request.url).searchParams.get('reveal') === 'true'
        return Response.json(getNonPlatformApiKeys().map((key) => applyRevealToApiKey(key, reveal)))
      },
    }),
  },
})
