import * as Sentry from '@sentry/nextjs'
import { type NextRequest } from 'next/server'

import { corsHeaders } from '../cors'
import { _handleEmbeddingsSearchRequest } from './route.utils'

export const runtime = 'edge'

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const response = await _handleEmbeddingsSearchRequest(request)
    Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value))
    return response
  } catch (error) {
    console.error('Error handling docs embeddings search request:', error)
    Sentry.captureException(error, { tags: { route: 'search-embeddings' } })
    return Response.json(
      { error: 'There was an error processing your request' },
      { status: 500, headers: corsHeaders }
    )
  }
}
