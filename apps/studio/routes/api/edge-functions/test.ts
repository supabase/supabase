import { createFileRoute } from '@tanstack/react-router'
import { IS_PLATFORM } from 'common'

import { parseJsonBody } from '@/lib/api/apiHelpers'
import { createApiHandlers } from '@/lib/api/apiWrapper'
import { getEdgeFunctionTestUrl } from '@/lib/api/edgeFunctions'
import { DEFAULT_SUPABASE_PUBLIC_URL } from '@/lib/constants/api'

interface EdgeFunctionTestBody {
  url: string
  method: string
  body?: unknown
  headers?: Record<string, string | null | undefined>
}

async function handlePost(request: Request): Promise<Response> {
  const parsedBody = await parseJsonBody<EdgeFunctionTestBody>(request)

  try {
    const { url: requestUrl, method, body: requestBody, headers: customHeaders } = parsedBody
    const url = getEdgeFunctionTestUrl(requestUrl, {
      isPlatform: IS_PLATFORM,
      nimbusProjectsUrl: process.env.NIMBUS_PROD_PROJECTS_URL,
      supabaseUrl: process.env.SUPABASE_URL,
      supabasePublicUrl: process.env.SUPABASE_PUBLIC_URL || DEFAULT_SUPABASE_PUBLIC_URL,
    })

    if (url === undefined) {
      return Response.json(
        {
          status: 400,
          error: { message: 'Provided URL is not a valid Supabase edge function URL' },
        },
        { status: 400 }
      )
    }

    // Forward the supplied headers as given, dropping empty values. Header names are case
    // insensitive, so they are merged on their lowercased name: a supplied `content-type` replaces
    // the default rather than sitting beside it and being comma joined by `fetch`.
    const suppliedHeaders = new Map<string, { name: string; value: string }>([
      ['content-type', { name: 'Content-Type', value: 'application/json' }],
    ])

    Object.entries(customHeaders || {}).forEach(([key, value]) => {
      const name = key.trim()
      if (name.length === 0 || value === undefined || value === null || value === '') return
      suppliedHeaders.set(name.toLowerCase(), { name, value })
    })

    const requestHeaders: Record<string, string> = Object.fromEntries(
      [...suppliedHeaders.values()].map(({ name, value }) => [name, value])
    )

    // Prepare the request body based on method and Content-Type
    let finalBody: BodyInit | undefined = undefined
    if (method !== 'GET' && method !== 'HEAD') {
      if (suppliedHeaders.get('content-type')?.value === 'application/json') {
        finalBody = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)
      } else {
        finalBody = requestBody as BodyInit | undefined
      }
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: finalBody,
      redirect: 'manual', // don't follow the redirect and return response as is
    })

    const responseBody = await response.text()

    const responseHeaders: Record<string, string | string[]> = {}
    response.headers.forEach((value, key) => {
      const existing = responseHeaders[key]
      if (existing === undefined) {
        responseHeaders[key] = value
      } else if (Array.isArray(existing)) {
        existing.push(value)
      } else {
        responseHeaders[key] = [existing, value]
      }
    })

    return Response.json(
      {
        status: response.status,
        headers: responseHeaders,
        body: responseBody,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    return Response.json(
      {
        status: 500,
        error: {
          message: message || 'Failed to test edge function',
        },
      },
      { status: 500 }
    )
  }
}

export const Route = createFileRoute('/api/edge-functions/test')({
  server: {
    handlers: createApiHandlers({
      POST: ({ request }) => handlePost(request),
    }),
  },
})
