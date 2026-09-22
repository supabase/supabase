import { HfInference } from 'npm:@huggingface/inference@^4'
import { withSupabase } from 'npm:@supabase/server@^1'

import { Database } from './types.ts'

console.log('Hello from `huggingface-image-captioning` function!')

const hf = new HfInference(Deno.env.get('HUGGINGFACE_ACCESS_TOKEN'))

type SoRecord = Database['storage']['Tables']['objects']['Row']
interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: SoRecord
  schema: 'public'
  old_record: null | SoRecord
}

// Deploy with verify_jwt = false.
export default {
  fetch: withSupabase<Database>({ auth: 'secret' }, async (req, ctx) => {
    const payload: WebhookPayload = await req.json()
    const soRecord = payload.record

    // Construct image url from storage
    const { data, error } = await ctx.supabaseAdmin.storage
      .from(soRecord.bucket_id!)
      .createSignedUrl(soRecord.path_tokens!.join('/'), 60)
    if (error) throw error
    const { signedUrl } = data

    // Run image captioning with Huggingface
    const imgDesc = await hf.imageToText({
      data: await (await fetch(signedUrl)).blob(),
      model: 'nlpconnect/vit-gpt2-image-captioning',
    })

    // Store image caption in Database table
    await ctx.supabaseAdmin
      .from('image_caption')
      .insert({ id: soRecord.id!, caption: imgDesc.generated_text })
      .throwOnError()

    return Response.json({ status: 'ok' })
  }),
}
