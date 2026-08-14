import { IS_PLATFORM } from 'common'
import { NextApiRequest, NextApiResponse } from 'next'

import { isValidEdgeFunctionURL } from '@/lib/api/edgeFunctions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const url = IS_PLATFORM
      ? requestUrl
      : requestUrl.replace(process.env.SUPABASE_PUBLIC_URL, process.env.SUPABASE_URL)

    const validEdgeFnUrl = isValidEdgeFunctionURL(url, IS_PLATFORM)

    if (!validEdgeFnUrl) {
      return res.status(400).json({
        status: 400,
        error: { message: 'Provided URL is not a valid Supabase edge function URL' },
      })
    }

    // Remove any undefined or null values from custom headers
    const sanitizedCustomHeaders = Object.entries(customHeaders || {}).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value as string
        }
        return acc
      },
      {} as Record<string, string>
    )

    // Only use custom headers and ensure Content-Type is set
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...sanitizedCustomHeaders,
    }

    // Use the test authorization header if provided
    if (sanitizedCustomHeaders['x-test-authorization']) {
      requestHeaders['Authorization'] = sanitizedCustomHeaders['x-test-authorization']
      // Remove the x-test-authorization header as we've moved it to Authorization
      delete requestHeaders['x-test-authorization']
    }

    // Prepare the request body based on method and Content-Type
    let finalBody = undefined
    if (method !== 'GET' && method !== 'HEAD') {
      if (requestHeaders['Content-Type'] === 'application/json') {
        finalBody = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)
      } else {
        finalBody = requestBody
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
