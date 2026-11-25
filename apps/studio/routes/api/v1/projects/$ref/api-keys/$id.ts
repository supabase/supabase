import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'
import { getNonPlatformApiKeyById, parseRevealQuery } from '@/lib/api/self-hosted/api-keys'

export const Route = createFileRoute('/api/v1/projects/$ref/api-keys/$id')({
  server: {
    handlers: createApiHandlers({
      GET: ({ request, params }) => {
        const { id } = params

        if (!id) {
          return Response.json({ error: { message: 'API key not found' } }, { status: 404 })
        }

        const reveal = parseRevealQuery(
          new URL(request.url).searchParams.get('reveal') ?? undefined
        )
        const apiKey = getNonPlatformApiKeyById(id, reveal)

        if (!apiKey) {
          return Response.json({ error: { message: 'API key not found' } }, { status: 404 })
        }

        return Response.json(apiKey, { status: 200 })
      },
    }),
  },
})
