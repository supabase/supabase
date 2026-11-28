import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { getLogflareConfig } from '@/lib/api/self-hosted/logflare'

export const Route = createFileRoute('/api/platform/projects/$ref/analytics/log-drains/$uuid')({
  server: {
    handlers: createApiHandlers({
      GET: async ({ params }) => {
        const logflare = getLogflareConfig()
        if (logflare instanceof Response) return logflare

        const result = await fetch(logflare.url(`/api/backends/${params.uuid}`), {
          headers: logflare.headers,
        }).then((r) => r.json())

        return Response.json(result)
      },
      PUT: async ({ request, params }) => {
        const logflare = getLogflareConfig()
        if (logflare instanceof Response) return logflare

        const body = await parseJsonBody<Record<string, unknown>>(request)
        delete body.metadata
        try {
          const putResponse = await fetch(logflare.url(`/api/backends/${params.uuid}`), {
            body: JSON.stringify(body),
            method: 'PUT',
            headers: logflare.headers,
          })
          if (!putResponse.ok) {
            console.error('error updating log drain', putResponse.status)
            return Response.json(
              { error: { message: 'Error updating log drain' } },
              { status: 500 }
            )
          }
          return Response.json(await putResponse.json())
        } catch (err) {
          console.error('error updating log drain', err)
          return Response.json({ error: { message: 'Error updating log drain' } }, { status: 500 })
        }
      },
      DELETE: async ({ params }) => {
        const logflare = getLogflareConfig()
        if (logflare instanceof Response) return logflare

        try {
          const deleteResponse = await fetch(logflare.url(`/api/backends/${params.uuid}`), {
            method: 'DELETE',
            headers: logflare.headers,
          })
          if (!deleteResponse.ok) {
            console.error('error deleting log drain', deleteResponse.status)
            return Response.json(
              { error: { message: 'Error deleting log drain' } },
              { status: 500 }
            )
          }
          return new Response(null, { status: 204 })
        } catch (err) {
          console.error('error deleting log drain', err)
          return Response.json({ error: { message: 'Error deleting log drain' } }, { status: 500 })
        }
      },
    }),
  },
})
