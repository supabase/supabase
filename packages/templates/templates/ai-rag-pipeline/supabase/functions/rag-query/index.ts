import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import OpenAI from 'jsr:@openai/openai@4'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const EMBEDDING_MODEL = 'text-embedding-3-small'

const requestSchema = z.object({
  query: z.string().min(1),
  matchCount: z.number().int().positive().max(50).optional(),
  source: z.string().optional(),
})

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') })
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('expected POST request', { status: 405 })
  }

  const parseResult = requestSchema.safeParse(await req.json())

  if (!parseResult.success) {
    return new Response(`invalid request body: ${parseResult.error.message}`, { status: 400 })
  }

  const { query, matchCount, source } = parseResult.data

  const embeddingResponse = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  })

  const embedding = embeddingResponse.data[0]?.embedding

  if (!embedding) {
    return Response.json({ error: 'failed to embed query' }, { status: 500 })
  }

  const { data, error } = await supabase.rpc('match_rag_chunks', {
    query_embedding: JSON.stringify(embedding),
    match_count: matchCount ?? 8,
    source_filter: source ?? null,
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ query, matches: data })
})
