import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'

import { resolveTemplateJsonRelativePaths } from './template-json.ts'

type ItemRow = {
  slug: string
  type: 'oauth' | 'template'
  registry_item_url: string | null
}

const templateRoutePattern = new URLPattern({ pathname: '/templates/:slug' })

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey =
  Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  })
}

console.log('Function "templates" up and running!')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse(
      {
        error: 'Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY/SUPABASE_ANON_KEY',
      },
      500
    )
  }

  const url = new URL(req.url)
  const matchingPath = templateRoutePattern.exec(url)
  const slug = matchingPath?.pathname.groups.slug?.trim() ?? null

  if (!slug) {
    return jsonResponse({ error: 'Missing slug in route. Expected /templates/:slug' }, 400)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: item, error } = await supabase
    .from('items')
    .select('slug,type,registry_item_url')
    .eq('slug', slug)
    .maybeSingle<ItemRow>()

  if (error) {
    return jsonResponse({ error: `Failed to query item: ${error.message}` }, 500)
  }

  if (!item) {
    return jsonResponse({ error: 'Item not found or not visible to anonymous role' }, 404)
  }

  if (item.type !== 'template') {
    return jsonResponse({ error: 'Item is not a template' }, 400)
  }

  if (!item.registry_item_url) {
    return jsonResponse({ error: 'Template item is missing template_url (registry_item_url)' }, 400)
  }

  let upstream: Response
  try {
    upstream = await fetch(item.registry_item_url, {
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown fetch error'
    return jsonResponse({ error: `Failed to fetch template JSON: ${message}` }, 502)
  }

  if (!upstream.ok) {
    return jsonResponse(
      { error: `Failed to fetch template JSON: upstream status ${upstream.status}` },
      502
    )
  }

  try {
    const data = await upstream.json()
    return jsonResponse(resolveTemplateJsonRelativePaths(data, upstream.url), 200)
  } catch {
    return jsonResponse({ error: 'Template URL did not return valid JSON' }, 502)
  }
})