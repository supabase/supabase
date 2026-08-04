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
    const output = await session.run(
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
        stream: false,
      }
    )

    console.log('done')
    return Response.json(output)
  }),
}

/**
 Run locally:

supabase functions serve --env-file supabase/functions/.env

curl --get "http://localhost:54321/functions/v1/llamafile" \
--data-urlencode "prompt=Who are you?" \
-H "apikey: <SUPABASE_PUBLISHABLE_KEY>"

 */
