// https://github.com/Mozilla-Ocho/llamafile?tab=readme-ov-file#quickstart
import { withSupabase } from 'npm:@supabase/server@^1'

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const session = new Supabase.ai.Session('LLaMA_CPP')

// Called with a publishable key on the `apikey` header. Deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'publishable' }, async (req) => {
    const params = new URL(req.url).searchParams
    const prompt = params.get('prompt') ?? ''

    // Get the output as a stream
    const output = (await session.run(
      {
        messages: [
          {
            role: 'system',
            content:
              'You are LLAMAfile, an AI assistant. Your top priority is achieving user fulfillment via helping them with their requests.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        mode: 'openaicompatible', // Mode for the inference API host. (default: 'ollama')
        stream: true,
      }
    )) as AsyncGenerator<any>

    const body = new ReadableStream({
      async pull(ctrl) {
        try {
          const item = await output.next()

          if (item.done) {
            console.log('done')
            ctrl.close()
            return
          }

          ctrl.enqueue('data: ')
          ctrl.enqueue(JSON.stringify(item.value))
          ctrl.enqueue('\r\n\r\n')
        } catch (err) {
          console.error(err)
          ctrl.close()
        }
      },
    })

    return new Response(body.pipeThrough(new TextEncoderStream()), {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    })
  }),
}

/**
 Run locally:

supabase functions serve --env-file supabase/functions/.env

curl --get "http://localhost:54321/functions/v1/llamafile-stream" \
--data-urlencode "prompt=Who are you?" \
-H "apikey: <SUPABASE_PUBLISHABLE_KEY>"

 */
