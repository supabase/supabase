import type { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { isValidEdgeFunctionURL } from '@/lib/api/edgeFunctions'
import { IS_PLATFORM } from '@/lib/constants'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      return new Response(
        JSON.stringify({ data: null, error: { message: `Method ${method} Not Allowed` } }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json', Allow: 'POST' },
        }
      )
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { url: requestUrl, method, body: requestBody, headers: customHeaders } = req.body
    const url =
      typeof requestUrl === 'string' && URL.canParse(requestUrl) ? new URL(requestUrl) : undefined
    const { SUPABASE_URL, SUPABASE_PUBLIC_URL } = process.env

    if (
      !IS_PLATFORM &&
      url &&
      SUPABASE_URL &&
      SUPABASE_PUBLIC_URL &&
      URL.canParse(SUPABASE_URL) &&
      URL.canParse(SUPABASE_PUBLIC_URL) &&
      url.origin === new URL(SUPABASE_PUBLIC_URL).origin
    ) {
      const internalUrl = new URL(SUPABASE_URL)
      url.protocol = internalUrl.protocol
      url.host = internalUrl.host
      url.port = internalUrl.port
    }

    if (!url || !isValidEdgeFunctionURL(url.href, IS_PLATFORM, SUPABASE_URL)) {
      return res.status(400).json({
        status: 400,
        error: { message: 'Provided URL is not a valid Supabase edge function URL' },
      })
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
      suppliedHeaders.set(name.toLowerCase(), { name, value: value as string })
    })

    const requestHeaders: Record<string, string> = Object.fromEntries(
      [...suppliedHeaders.values()].map(({ name, value }) => [name, value])
    )

    // Prepare the request body based on method and Content-Type
    let finalBody = undefined
    if (method !== 'GET' && method !== 'HEAD') {
      if (suppliedHeaders.get('content-type')?.value === 'application/json') {
        finalBody = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)
      } else {
        finalBody = requestBody
      }
    }

    const response = await fetch(url.href, {
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

    return res.status(200).json({
      status: response.status,
      headers: responseHeaders,
      body: responseBody,
    })
  } catch (error: any) {
    return res.status(500).json({
      status: 500,
      error: {
        message: error.message || 'Failed to test edge function',
      },
    })
  }
}

export default async function edgeFunctionTest(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler, { withAuth: true })
}
