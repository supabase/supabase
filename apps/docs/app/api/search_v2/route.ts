import { supabaseSearchV2 } from '~/scripts/search_v2/client'
import { type NextRequest } from 'next/server'

import { corsHeaders } from './cors'

export const runtime = 'edge'

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()
  const limit = Number(searchParams.get('limit')) || 10

  if (!query) {
    return Response.json({ error: 'Missing q parameter' }, { status: 400, headers: corsHeaders })
  }

  const { data, error } = await supabaseSearchV2().rpc('search_docs', {
    query_text: query,
    match_limit: limit,
  })

  if (error) {
    console.error('Error running docs search v2:', error)
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders })
  }

  return Response.json(data, { headers: corsHeaders })
}
