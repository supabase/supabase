import OpenAI from 'npm:openai@^6'
import { withSupabase } from 'npm:@supabase/server@^1'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2'

const client = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! })

type StorageFileApi = ReturnType<SupabaseClient['storage']['from']>
type StorageUploadPromise = ReturnType<StorageFileApi['upload']>

class MyBackgroundTaskEvent extends Event {
  readonly taskPromise: StorageUploadPromise

  constructor(taskPromise: StorageUploadPromise) {
    super('myBackgroundTask')
    this.taskPromise = taskPromise
  }
}

globalThis.addEventListener('myBackgroundTask', async (event) => {
  const { data, error } = await (event as MyBackgroundTaskEvent).taskPromise
  console.log({ data, error })
})

// Deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'secret' }, async (req, ctx) => {
    const url = new URL(req.url)
    const params = new URLSearchParams(url.search)
    const text = params.get('text')

    if (!text) {
      return Response.json({ error: 'Text parameter is required' }, { status: 400 })
    }

    try {
      const response = await client.audio.speech.create({
        model: 'tts-1',
        voice: 'nova',
        input: text,
      })

      const stream = response.body
      if (!stream) {
        throw new Error('No stream')
      }

      // Branch stream to Supabase Storage
      const [browserStream, storageStream] = stream.tee()

      // Upload to Supabase Storage
      const storageUploadPromise = ctx.supabaseAdmin.storage
        .from('videos')
        .upload(`audio-stream_${Date.now()}.mp3`, storageStream, {
          contentType: 'audio/mp3',
        })
      const event = new MyBackgroundTaskEvent(storageUploadPromise)
      globalThis.dispatchEvent(event)

      return new Response(browserStream, {
        headers: {
          'Content-Type': 'audio/mp3',
        },
      })
    } catch (error) {
      console.log('error', { error })
      return Response.json({ error: error.message }, { status: 500 })
    }
  }),
}
