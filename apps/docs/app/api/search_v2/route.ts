import * as Sentry from '@sentry/nextjs'
import { createSupabaseClient, SEARCH_FUNCTION } from '~/scripts/search_v2/supabase'
import { type NextRequest } from 'next/server'

import { fetchMarkdown, resolveDocsBaseUrl } from './content'
import { corsHeaders } from './cors'

export const runtime = 'edge'

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const limit = Number(searchParams.get('limit')) || 10
    const includeContent = searchParams.get('content') === 'true'

    if (!query) {
      return Response.json({ error: 'Missing q parameter' }, { status: 400, headers: corsHeaders })
    }

    const { data, error } = await createSupabaseClient().rpc(SEARCH_FUNCTION, {
      query_text: query,
      match_limit: limit,
    })

    if (error) {
      console.error('Error running docs search v2:', error)
      Sentry.captureException(new Error(error.message), {
        tags: { route: 'search_v2' },
        extra: { query, limit, error },
      })
      return Response.json({ error: error.message }, { status: 500, headers: corsHeaders })
    }

    if (!includeContent) {
      return Response.json(data, { headers: corsHeaders })
    }

    // Attach each page's markdown export; null when it has none or can't be loaded.
    const baseUrl = resolveDocsBaseUrl(request.url)
    const results = await Promise.all(
      (data as { slug: string }[]).map(async (row) => ({
        ...row,
        content: await fetchMarkdown(baseUrl, row.slug),
      }))
    )
    return Response.json(results, { headers: corsHeaders })
  } catch (error) {
    console.error('Error handling docs search v2 request:', error)
    Sentry.captureException(error, { tags: { route: 'search_v2' } })
    return Response.json(
      { error: 'There was an error processing your request' },
      { status: 500, headers: corsHeaders }
    )
  }
}
