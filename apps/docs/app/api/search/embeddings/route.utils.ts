import * as Sentry from '@sentry/nextjs'
import { isFeatureEnabled } from 'common/enabled-features'
import { type NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

export async function _handleEmbeddingsSearchRequest(request: NextRequest) {
  const { query } = await request.json()

  if (!query || typeof query !== 'string') {
    return Response.json({ error: 'Missing query in request data' }, { status: 400 })
  }

  const useAlternateSearchIndex = !isFeatureEnabled('search:fullIndex')

  const response = await fetch(`${SUPABASE_URL}/functions/v1/search-embeddings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, useAlternateSearchIndex }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Error running docs embeddings search:', data)
    Sentry.captureException(new Error(data?.error ?? 'search-embeddings request failed'), {
      tags: { route: 'search-embeddings' },
      extra: { query, status: response.status, data },
    })
  }

  return Response.json(data, { status: response.status })
}
