import 'https://deno.land/x/xhr@0.3.0/mod.ts'
import { CreateCompletionRequest } from 'https://esm.sh/openai@3.1.0'

Deno.serve(async (req) => {
  const { query } = await req.json()

  const completionConfig: CreateCompletionRequest = {
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
})
