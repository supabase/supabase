import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { withSupabase } from 'npm:@supabase/server@^1'
import { Database } from '../_shared/database.types.ts'

const model = new Supabase.ai.Session('gte-small')

// Called with a secret key on the `apikey` header. Deploy with verify_jwt = false.
export default {
  fetch: withSupabase<Database>({ auth: 'secret' }, async (req, ctx) => {
    const { search } = await req.json()
    if (!search) {
      return Response.json({ error: 'Please provide a search param!' }, { status: 400 })
    }
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
