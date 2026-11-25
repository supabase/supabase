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

export const Route = createFileRoute('/api/platform/projects/$ref/analytics/log-drains/$uuid')({
  server: {
    handlers: createApiHandlers({
      GET: async ({ params }) => {
        const envCheck = validateLogflareEnv()
        if (envCheck instanceof Response) return envCheck
        const { baseUrl } = envCheck

        // get log drain
        const url = new URL(baseUrl)
        url.pathname = `/api/backends/${params.uuid}`
        const result = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }).then((r) => r.json())

        return Response.json(result, { status: 200 })
      },
      PUT: async ({ request, params }) => {
        const envCheck = validateLogflareEnv()
        if (envCheck instanceof Response) return envCheck
        const { baseUrl } = envCheck

        // update the log drain
        const putUrl = new URL(baseUrl)
        putUrl.pathname = `/api/backends/${params.uuid}`
        const body = await parseJsonBody<Record<string, unknown>>(request)
        delete body['metadata']
        try {
          const putResponse = await fetch(putUrl, {
            body: JSON.stringify(body),
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          })
          if (!putResponse.ok) {
            console.error('error updating log drain', putResponse.status)
            return Response.json(
              { error: { message: 'Error updating log drain' } },
              { status: 500 }
            )
          }
          const putResult = await putResponse.json()
          return Response.json(putResult, { status: 200 })
        } catch (err) {
          console.error('error updating log drain', err)
          return Response.json({ error: { message: 'Error updating log drain' } }, { status: 500 })
        }
      },
      DELETE: async ({ params }) => {
        const envCheck = validateLogflareEnv()
        if (envCheck instanceof Response) return envCheck
        const { baseUrl } = envCheck

        // delete the log drain
        const deleteUrl = new URL(baseUrl)
        deleteUrl.pathname = `/api/backends/${params.uuid}`

        try {
          const deleteResponse = await fetch(deleteUrl, {
            headers: {
              Authorization: `Bearer ${process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            method: 'DELETE',
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
