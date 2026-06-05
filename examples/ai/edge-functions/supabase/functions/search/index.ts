import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { withSupabase } from 'npm:@supabase/server@^1'

const model = new Supabase.ai.Session('gte-small')

// Deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'secret' }, async (req, ctx) => {
    const { search } = await req.json()
    if (!search) return new Response('Please provide a search param!')
    // Generate embedding for search term.
    const embedding = await model.run(search, {
      mean_pool: true,
      normalize: true,
    })

    // Query embeddings.
    const { data: result, error } = await ctx.supabaseAdmin
      .rpc('query_embeddings', {
        embedding: JSON.stringify(embedding),
        match_threshold: 0.8,
      })
      .select('content')
      .limit(3)
    if (error) {
      return Response.json(error)
    }

    return Response.json({ search, result })
  }),
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Run `supabase functions serve`
  3. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/search' \
    --header 'apikey: <SUPABASE_SECRET_KEY>' \
    --header 'Content-Type: application/json' \
    --data '{"search":"vehicles"}'

*/
