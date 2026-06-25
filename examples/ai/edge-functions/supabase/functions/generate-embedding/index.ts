import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { withSupabase } from 'npm:@supabase/server@^1'

import { Database, Tables } from '../_shared/database.types.ts'

type EmbeddingsRecord = Tables<'embeddings'>
interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: EmbeddingsRecord
  schema: 'public'
  old_record: null | EmbeddingsRecord
}

const model = new Supabase.ai.Session('gte-small')

// Called with a secret key on the `apikey` header. Deploy with verify_jwt = false.
export default {
  fetch: withSupabase<Database>({ auth: 'secret' }, async (req, ctx) => {
    const payload: WebhookPayload = await req.json()
    const { content, id } = payload.record

    // Check if content has changed.
    if (content === payload?.old_record?.content) {
      return Response.json({ status: 'ok - no change' })
    }

    // Generate embedding
    const embedding = await model.run(content, {
      mean_pool: true,
      normalize: true,
    })

    // Store in DB
    const { error } = await ctx.supabaseAdmin
      .from('embeddings')
      .update({
        embedding: JSON.stringify(embedding),
      })
      .eq('id', id)
    if (error) {
      console.warn(error.message)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ status: 'ok - updated' })
  }),
}
