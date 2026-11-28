import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { getLogflareConfig } from '@/lib/api/self-hosted/logflare'

const LOG_DRAIN_SOURCES = [
  'cloudflare.logs.prod',
  'deno-relay-logs',
  'deno-subhosting-events',
  'gotrue.logs.prod',
  'pgbouncer.logs.prod',
  'postgrest.logs.prod',
  'postgres.logs',
  'realtime.logs.prod',
  'storage.logs.prod.2',
]

export const Route = createFileRoute('/api/platform/projects/$ref/analytics/log-drains')({
  server: {
    handlers: createApiHandlers({
      GET: async () => {
        const logflare = getLogflareConfig()
        if (logflare instanceof Response) return logflare

        // list log drains
        const url = logflare.url('/api/backends')
        url.search = new URLSearchParams({ 'metadata[type]': 'log-drain' }).toString()
        const upstream = await fetch(url, { headers: logflare.headers })

        if (!upstream.ok) {
          return Response.json(
            { error: { message: 'Failed to fetch log drains from upstream' } },
            { status: 500 }
          )
        }

        const resp = await upstream.json()

        if (!Array.isArray(resp)) {
          return Response.json(
            { error: { message: 'Unexpected response format from upstream' } },
            { status: 500 }
          )
        }

        return Response.json(resp)
      },
      POST: async ({ request }) => {
        const logflare = getLogflareConfig()
        if (logflare instanceof Response) return logflare

        const body = await parseJsonBody<Record<string, unknown>>(request)

        // create the log drain
        const postResult = await fetch(logflare.url('/api/backends'), {
          body: JSON.stringify({ ...body, metadata: { type: 'log-drain' } }),
          method: 'POST',
          headers: logflare.headers,
        }).then((r) => r.json())

        const sources: { name: string; id: number }[] = await fetch(logflare.url('/api/sources'), {
          headers: logflare.headers,
        }).then((r) => r.json())

        // route every matching source to the new drain
        const rulesUrl = logflare.url('/api/rules')
        await Promise.all(
          sources
            .filter((source) => LOG_DRAIN_SOURCES.includes(source.name.toLocaleLowerCase()))
            .map((source) =>
              fetch(rulesUrl, {
                method: 'POST',
                body: JSON.stringify({
                  backend_id: postResult.id,
                  lql_string: `~".*?"`,
                  source_id: source.id,
                }),
                headers: logflare.headers,
              })
            )
        )
        return Response.json(postResult, { status: 201 })
      },
    }),
  },
})
