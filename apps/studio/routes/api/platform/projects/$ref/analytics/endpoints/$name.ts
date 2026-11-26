import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers, type ApiHandlerContext } from '@/lib/api/apiWrapper'
import { retrieveAnalyticsData } from '@/lib/api/self-hosted/logs'

async function handleAnalytics({ request, params: { name, ref } }: ApiHandlerContext) {
  let params: Record<string, string | undefined>
  if (request.method === 'GET') {
    const searchParams = new URL(request.url).searchParams
    // Route params are not analytics query params
    searchParams.delete('name')
    searchParams.delete('ref')
    params = Object.fromEntries(searchParams)
  } else {
    params = await parseJsonBody(request)
  }

  const { data, error } = await retrieveAnalyticsData({ name, params, projectRef: ref })

  if (data) {
    return Response.json(data)
  }
  return Response.json({ error: { message: error.message } }, { status: 500 })
}

export const Route = createFileRoute('/api/platform/projects/$ref/analytics/endpoints/$name')({
  server: {
    handlers: createApiHandlers({ GET: handleAnalytics, POST: handleAnalytics }),
  },
})
