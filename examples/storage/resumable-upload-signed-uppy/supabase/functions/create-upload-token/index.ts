import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js'

Deno.serve(async (req) => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const { filename } = await req.json()
    if (!filename) {
      return new Response('Missing filename', { status: 400 })
    }

    const { data, error } = await supabase.storage.from('uploads').createSignedUploadUrl(filename)

    if (error) {
      return new Response(error.message, { status: 500 })
    }

    return new Response(JSON.stringify({ token: data.token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response((error as Error).message, { status: 500 })
  }
})
