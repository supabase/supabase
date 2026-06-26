import { withSupabase } from 'npm:@supabase/server@^1'

// Authenticated endpoint, so deploy with verify_jwt = true.
export default {
  fetch: withSupabase({ auth: 'user' }, async (req) => {
    const { query } = await req.json()

    const completionConfig = {
      model: 'text-davinci-003',
      prompt: query,
      max_tokens: 256,
      temperature: 0,
      stream: true,
    }

    return fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(completionConfig),
    })
  }),
}
