// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { withSupabase } from 'npm:@supabase/server@^1'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2'
import { ElevenLabsClient } from 'npm:elevenlabs@^1'
import * as hash from 'npm:object-hash@^3'

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void
}

const client = new ElevenLabsClient({
  apiKey: Deno.env.get('ELEVENLABS_API_KEY'),
})

// Upload audio to Supabase Storage in a background task
async function uploadAudioToStorage(
  supabaseAdmin: SupabaseClient,
  stream: ReadableStream,
  requestHash: string
) {
  const { data, error } = await supabaseAdmin.storage
    .from('audio')
    .upload(`${requestHash}.mp3`, stream, {
      contentType: 'audio/mp3',
    })

  console.log('Storage upload result', { data, error })
}

// Authenticated endpoint, so deploy with verify_jwt = true.
export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    // You can add extra checks here, for example validating the request origin.
    console.log('Request origin', req.headers.get('host'))
    const url = new URL(req.url)
    const params = new URLSearchParams(url.search)
    const text = params.get('text')
    const voiceId = params.get('voiceId') ?? 'JBFqnCBsd6RMkjVDRZzb'

    const requestHash = hash.MD5({ text, voiceId })
    console.log('Request hash', requestHash)

    // Check storage for existing audio file
    const { data } = await ctx.supabaseAdmin.storage
      .from('audio')
      .createSignedUrl(`${requestHash}.mp3`, 60)

    if (data) {
      console.log('Audio file found in storage', data)
      const storageRes = await fetch(data.signedUrl)
      if (storageRes.ok) return storageRes
    }

    if (!text) {
      return Response.json({ error: 'Text parameter is required' }, { status: 400 })
    }

    try {
      console.log('ElevenLabs API call')
      const response = await client.textToSpeech.convertAsStream(voiceId, {
        output_format: 'mp3_44100_128',
        model_id: 'eleven_multilingual_v2',
        text,
      })

      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of response) {
            controller.enqueue(chunk)
          }
          controller.close()
        },
      })

      // Branch stream to Supabase Storage
      const [browserStream, storageStream] = stream.tee()

      // Upload to Supabase Storage in the background
      EdgeRuntime.waitUntil(uploadAudioToStorage(ctx.supabaseAdmin, storageStream, requestHash))

      // Return the streaming response immediately
      return new Response(browserStream, {
        headers: {
          'Content-Type': 'audio/mpeg',
        },
      })
    } catch (error) {
      console.log('error', { error })
      return Response.json({ error: error.message }, { status: 500 })
    }
  }),
}
