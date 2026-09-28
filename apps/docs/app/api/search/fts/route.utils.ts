import * as Sentry from '@sentry/nextjs'
import { supabase } from '~/lib/supabase'
import { isFeatureEnabled } from 'common/enabled-features'
import { type NextRequest } from 'next/server'

export async function _handleFtsSearchRequest(request: NextRequest) {
  const { query } = await request.json()

  if (!query || typeof query !== 'string') {
    return Response.json({ error: 'Missing query in request data' }, { status: 400 })
  }

  const useAlternateSearchIndex = !isFeatureEnabled('search:fullIndex')
  const searchFunction = useAlternateSearchIndex ? 'docs_search_fts_nimbus' : 'docs_search_fts'

  const { data, error } = await supabase().rpc(searchFunction, { query: query.trim() })

  if (error) {
    console.error('Error running docs full-text search:', error)
    Sentry.captureException(new Error(error.message), {
      tags: { route: 'search-fts' },
      extra: { query, searchFunction, error },
    })
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
