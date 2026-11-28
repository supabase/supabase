// Semantic search: embeds the query with gte-small and asks Postgres for the
// caller's most similar items. `match_items` is security invoker, so RLS keeps
// results to the caller's own items.

import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'

import { embed } from '../_shared/embed.ts'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const { query } = await req.json()
    if (typeof query !== 'string' || query.trim() === '') {
      return Response.json({ matches: [] })
    }

    const embedding = await embed(query.slice(0, 500))
    const { data, error } = await ctx.supabase.rpc('match_items', {
      query_embedding: JSON.stringify(embedding),
      match_count: 30,
    })
    if (error) return Response.json({ error: error.message }, { status: 500 })

    // Keep results close to the best match, so a strong hit isn't padded out
    // with loosely related items.
    const matches = (data ?? []) as { item_id: string; similarity: number }[]
    const best = matches[0]?.similarity ?? 0
    return Response.json({ matches: matches.filter((match) => match.similarity >= best - 0.03) })
  }),
}
