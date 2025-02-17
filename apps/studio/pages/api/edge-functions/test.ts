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
    const constructedHeaders = await constructHeaders(incomingHeaders)

    // Convert Headers object to plain object
    const headers: Record<string, string> = {}
    if (constructedHeaders instanceof Headers) {
      constructedHeaders.forEach((value, key) => {
        headers[key] = value
      })
    } else {
      Object.entries(constructedHeaders).forEach(([key, value]) => {
        if (typeof value === 'string') headers[key] = value
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

    const requestHeaders: Record<string, string> = {
      ...headers,
      'Content-Type': 'application/json',
      ...sanitizedCustomHeaders,
    }

    // Use the test authorization header if provided, otherwise use the default authorization
    if (sanitizedCustomHeaders['x-test-authorization']) {
      requestHeaders['Authorization'] = sanitizedCustomHeaders['x-test-authorization']
      // Remove the x-test-authorization header as we've moved it to Authorization
      delete requestHeaders['x-test-authorization']
      console.log('Using test authorization header')
    }

    console.log('Forwarding request with headers:', requestHeaders)

    // The URL already includes query parameters from the frontend
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(body) : undefined,
    })

    // Handle non-JSON responses
    let responseBody: string
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      // If JSON, parse and stringify to ensure it's valid JSON
      const jsonBody = await response.json()
      responseBody = JSON.stringify(jsonBody)
    } else {
      // For non-JSON responses, get raw text
      responseBody = await response.text()
    }

    if (!response.ok) {
      // Try to parse error response if it's JSON
      try {
        const errorBody = JSON.parse(responseBody)
        return handleError(errorBody)
      } catch {
        // If not JSON, return the raw error
        return res.status(response.status).json({
          error: { message: responseBody || 'Edge function returned an error' },
        })
      }
    }

    console.log('Edge function response status:', response.status)

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

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
      error: { message: error.message || 'Failed to test edge function' },
    })
  }
}
