import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { getNonPlatformApiKeyById } from '@/lib/api/self-hosted/api-keys'

export const Route = createFileRoute('/api/v1/projects/$ref/api-keys/$id')({
  server: {
    handlers: createApiHandlers({
      GET: ({ request, params }) => {
        const reveal = new URL(request.url).searchParams.get('reveal') === 'true'
        const apiKey = getNonPlatformApiKeyById(params.id, reveal)

        if (!apiKey) {
          return Response.json({ error: { message: 'API key not found' } }, { status: 404 })
        }
        return Response.json(apiKey)
      },
    }),
  },
})
