import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { corsHeaders } from './_cors.js'
import type { Database, KbSearchResult } from './_types.js'

let client: SupabaseClient<Database> | undefined
function supabase() {
  client ??= createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
  )
  return client
}

/** Fetches the markdown export of a page (`<href>.md`); null if it can't be loaded. */
async function fetchContent(href: string): Promise<string | null> {
  try {
    const response = await fetch(`${href}.md`)
    if (!response.ok) {
      console.warn(`Failed to fetch kb content from ${href}.md: ${response.status}`)
      return null
    }
    return await response.text()
  } catch (error) {
    console.warn(`Failed to fetch kb content from ${href}.md:`, error)
    return null
  }
}

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()
  const limit = Number(searchParams.get('limit')) || 10
  const includeContent = searchParams.get('content') === 'true'
  if (!query)
    return Response.json({ error: 'Missing q parameter' }, { status: 400, headers: corsHeaders })

  const { data, error } = await supabase().rpc('search_kb', {
    query_text: query,
    match_limit: limit,
  })
  if (error) {
    console.error('Error running kb search:', error)
    return Response.json(
      { error: 'There was an error processing your request' },
      { status: 500, headers: corsHeaders }
    )
  }

  let results: KbSearchResult[] = data.map((row) => ({
    title: row.page_title,
    href: `https://supabase.com/${row.slug.toLowerCase()}`,
    heading: row.heading,
    excerpt: row.excerpt,
    score: row.score,
  }))

  if (includeContent) {
    results = await Promise.all(
      results.map(async (result) => ({ ...result, content: await fetchContent(result.href) }))
    )
  }

  return Response.json(results, {
    headers: {
      ...corsHeaders,
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
    },
  })
}
