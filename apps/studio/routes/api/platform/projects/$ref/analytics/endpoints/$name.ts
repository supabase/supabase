import assert from 'node:assert'
import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { retrieveAnalyticsData } from '@/lib/api/self-hosted/logs'

async function handleAnalytics(
  request: Request,
  routeParams: Record<string, string | undefined>
): Promise<Response> {
  const { name, ref } = routeParams
  const params =
    request.method === 'GET'
      ? Object.fromEntries(new URL(request.url).searchParams.entries())
      : await parseJsonBody<Record<string, string | undefined>>(request)

  assert(typeof ref === 'string', 'Invalid or missing ref parameter')
  assert(typeof name === 'string', 'Invalid or missing name parameter')

  const { data, error } = await retrieveAnalyticsData({
    name,
    params,
    projectRef: ref,
  })

  if (data) {
    return Response.json(data, { status: 200 })
  }
  return Response.json({ error: { message: error.message } }, { status: 500 })
}

export const Route = createFileRoute('/api/platform/projects/$ref/analytics/endpoints/$name')({
  server: {
    handlers: createApiHandlers({
      GET: ({ request, params }) => handleAnalytics(request, params),
      POST: ({ request, params }) => handleAnalytics(request, params),
    }),
  },
})
