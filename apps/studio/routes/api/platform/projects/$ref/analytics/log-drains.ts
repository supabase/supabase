import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { PROJECT_ANALYTICS_URL } from '@/lib/constants/api'

const envVarsSet = () => {
  const missingEnvVars = [
    process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN ? null : 'LOGFLARE_PRIVATE_ACCESS_TOKEN',
    process.env.LOGFLARE_URL ? null : 'LOGFLARE_URL',
  ].filter((v): v is string => Boolean(v))
  return missingEnvVars.length === 0 ? true : missingEnvVars
}

function validateLogflareEnv(): { baseUrl: string } | Response {
  const missingEnvVars = envVarsSet()
  if (missingEnvVars !== true) {
    return Response.json(
      { error: { message: `${missingEnvVars.join(', ')} env variables are not set` } },
      { status: 500 }
    )
  }

  const baseUrl = PROJECT_ANALYTICS_URL
  if (!baseUrl) {
    return Response.json(
      { error: { message: `LOGFLARE_URL env variable is not set` } },
      { status: 500 }
    )
  }

  return { baseUrl }
}

export const Route = createFileRoute('/api/platform/projects/$ref/analytics/log-drains')({
  server: {
    handlers: createApiHandlers({
      GET: async () => {
        const envCheck = validateLogflareEnv()
        if (envCheck instanceof Response) return envCheck
        const { baseUrl } = envCheck

        // list log drains
        const url = new URL(baseUrl)
        url.pathname = '/api/backends'
        url.search = new URLSearchParams({
          'metadata[type]': 'log-drain',
        }).toString()
        const upstream = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })

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

        return Response.json(resp, { status: 200 })
      },
      POST: async ({ request }) => {
        const envCheck = validateLogflareEnv()
        if (envCheck instanceof Response) return envCheck
        const { baseUrl } = envCheck

        const body = await parseJsonBody<Record<string, unknown>>(request)

        // create the log drain
        const postUrl = new URL(baseUrl)
        postUrl.pathname = '/api/backends'
        const postResult = await fetch(postUrl, {
          body: JSON.stringify({
            ...body,
            config: body.config,
            metadata: {
              type: 'log-drain',
            },
          }),
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }).then(async (r) => await r.json())

        const sourcesGetUrl = new URL(baseUrl)
        sourcesGetUrl.pathname = '/api/sources'
        const sources = await fetch(sourcesGetUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }).then((r) => r.json())

        const params = sources
          .filter((source: { name: string; metadata: { type: string } }) =>
            [
              'cloudflare.logs.prod',
              'deno-relay-logs',
              'deno-subhosting-events',
              'gotrue.logs.prod',
              'pgbouncer.logs.prod',
              'postgrest.logs.prod',
              'postgres.logs',
              'realtime.logs.prod',
              'storage.logs.prod.2',
            ].includes(source.name.toLocaleLowerCase())
          )
          .map((source: { name: string; id: number }) => {
            return { backend_id: postResult.id, lql_string: `~".*?"`, source_id: source.id }
          })
        const rulesPostUrl = new URL(baseUrl)
        rulesPostUrl.pathname = '/api/rules'
        await Promise.all(
          params.map((param: { backend_id: unknown; lql_string: string; source_id: number }) =>
            fetch(rulesPostUrl, {
              method: 'POST',
              body: JSON.stringify(param),
              headers: {
                Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
            })
          )
        )
        return Response.json(postResult, { status: 201 })
      },
    }),
  },
})
