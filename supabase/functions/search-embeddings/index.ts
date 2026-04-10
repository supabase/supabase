import 'https://deno.land/x/xhr@0.2.1/mod.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.56.0'
import { Database } from '../../../packages/common/database-types.ts'
import { ApplicationError, UserError } from '../common/errors.ts'

// 🔒 Load env once
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing required environment variables')
}

// 🚀 Reuse clients (DO NOT create per request)
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  try {
    // ✅ CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // ✅ Only allow POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders,
      })
    }

    // ✅ Safe JSON parsing
    let requestData: any
    try {
      requestData = await req.json()
    } catch {
      throw new UserError('Invalid JSON body')
    }

    const { query, useAlternateSearchIndex = false } = requestData ?? {}

    if (!query || typeof query !== 'string') {
      throw new UserError('Invalid or missing query')
    }

    const sanitizedQuery = query.trim().slice(0, 1000) // prevent abuse

    console.log({ query: sanitizedQuery })

    // ⚡ Parallel calls (moderation + embedding)
    const [moderation, embeddingRes] = await Promise.all([
      openai.moderations.create({ input: sanitizedQuery }),
      openai.embeddings.create({
        model: 'text-embedding-3-small', // ✅ updated model
        input: sanitizedQuery.replace(/\n/g, ' '),
      }),
    ])

    const result = moderation.results[0]

    if (result?.flagged) {
      throw new UserError('Flagged content', {
        flagged: true,
        categories: result.categories,
      })
    }

    const embedding = embeddingRes.data[0]?.embedding

    if (!embedding) {
      throw new ApplicationError('Embedding generation failed')
    }

    const searchFunction = useAlternateSearchIndex
      ? 'docs_search_embeddings_nimbus'
      : 'docs_search_embeddings'

    const { data: pages, error } = await supabase.rpc(searchFunction, {
      embedding,
      match_threshold: 0.78,
    })

    if (error) {
      throw new ApplicationError('Database search failed', error)
    }

    return new Response(JSON.stringify(pages), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return new Response(
        JSON.stringify({
          error: err.message,
          data: err.data ?? null,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.error(err)

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
