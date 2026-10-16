import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database, KbSearchResult } from '../src/lib/search/types'

let client: SupabaseClient<Database> | undefined
function searchClient() {
  client ??= createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
  )
  return client
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()
  const limit = Number(searchParams.get('limit')) || 10
  if (!query) return Response.json({ error: 'Missing q parameter' }, { status: 400 })

  const { data, error } = await searchClient().rpc('search_kb_sections', {
    query_text: query,
    match_limit: limit,
  })
  if (error) {
    console.error('Error running kb search:', error)
    return Response.json({ error: 'There was an error processing your request' }, { status: 500 })
  }

  const results: KbSearchResult[] = data.map((row) => ({
    title: row.page_title,
    href: `https://supabase.com/${row.slug.toLowerCase()}`,
    heading: row.heading,
    excerpt: row.excerpt,
    score: row.score,
  }))

  return Response.json(results, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
  })
}
