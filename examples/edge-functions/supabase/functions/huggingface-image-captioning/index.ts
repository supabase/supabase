import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'
import { createClient } from '@supabase/supabase-js'
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

serve(async (req) => {
  const payload: WebhookPayload = await req.json()
  const soRecord = payload.record
  const supabaseAdminClient = createClient<Database>(
    // Supabase API URL - env var exported by default when deployed.
    Deno.env.get('SUPABASE_URL') ?? '',
    // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Construct image url from storage
  const { data, error } = await supabaseAdminClient.storage
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
  await supabaseAdminClient
    .from('image_caption')
    .insert({ id: soRecord.id!, caption: imgDesc.generated_text })
    .throwOnError()

  return new Response('ok')
})
