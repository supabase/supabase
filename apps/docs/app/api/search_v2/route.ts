import * as Sentry from '@sentry/nextjs'
import { createClient } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

function searchV2Client() {
  return createClient(
    `https://${process.env.SEARCH_V2_SUPABASE_PROJECT_ID}.supabase.co`,
    process.env.SEARCH_V2_SUPABASE_SECRET_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const limit = Number(searchParams.get('limit')) || 10

    if (!query) {
      return Response.json({ error: 'Missing q parameter' }, { status: 400 })
    }

    const { data, error } = await searchV2Client().rpc('search_docs', {
      query_text: query,
      match_limit: limit,
    })

    if (error) {
      console.error('Error running docs search v2:', error)
      Sentry.captureException(new Error(error.message), {
        tags: { route: 'search-v2' },
        extra: { query, limit, error },
      })
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json(data)
  } catch (error) {
    console.error('Error handling docs search v2 request:', error)
    Sentry.captureException(error, { tags: { route: 'search-v2' } })
    return Response.json({ error: 'There was an error processing your request' }, { status: 500 })
  }
}
