import { NextApiRequest, NextApiResponse } from 'next'
import { constructHeaders, handleError } from 'data/fetchers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: { message: `Method ${req.method} Not Allowed` },
    })
  }

  try {
    const { url, method, body, headers: customHeaders } = req.body

    console.log('Edge function test request:', {
      url,
      method,
      body,
      customHeaders,
    })

    // Convert incoming headers to HeadersInit format
    const incomingHeaders = Object.entries(req.headers).reduce(
      (acc, [key, value]) => {
        if (value) acc[key] = Array.isArray(value) ? value.join(', ') : value
        return acc
      },
      {} as Record<string, string>
    )

    // Get auth headers from the request to forward them
    const headers = await constructHeaders(incomingHeaders)
    const requestHeaders = {
      ...headers,
      'Content-Type': 'application/json',
      ...customHeaders,
    }

    // Use the test authorization header if provided, otherwise use the default authorization
    if (customHeaders['x-test-authorization']) {
      requestHeaders['Authorization'] = customHeaders['x-test-authorization']
      console.log('Using test authorization header')
    }

    console.log('Forwarding request with headers:', requestHeaders)

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
    })

    if (!response.ok) {
      const error = await response.json()
      return handleError(error)
    }

    console.log('Edge function response status:', response.status)

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    const responseBody = await response.text()

    console.log('Edge function response:', {
      status: response.status,
      headers: responseHeaders,
      body: responseBody,
    })

    return res.status(response.status).json({
      status: response.status,
      headers: responseHeaders,
      body: responseBody,
    })
  } catch (error: any) {
    console.error('Edge function test error:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    })
    return res.status(500).json({
      error: error.message || 'Failed to test edge function',
    })
  }
}
