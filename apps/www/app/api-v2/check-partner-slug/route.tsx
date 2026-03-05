import { createClient } from '@supabase/supabase-js'
import type { SlugCheckResponse } from '~/data/partners/partnerApplication.utils'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
}

export async function OPTIONS() {
  return new Response('ok', { headers: corsHeaders })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Slug parameter is required' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return new Response(
      JSON.stringify({ available: false, error: 'Invalid slug format' } as SlugCheckResponse & {
        error: string
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_MISC_USE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_MISC_USE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    const { data, error } = await supabase
      .from('partners')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      console.error('Error checking slug:', error)
      return new Response(JSON.stringify({ error: 'Error checking slug availability' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const response: SlugCheckResponse = {
      available: data === null,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error checking slug:', error)
    return new Response(JSON.stringify({ error: 'Error checking slug availability' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}
