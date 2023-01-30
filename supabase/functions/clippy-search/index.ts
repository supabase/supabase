import { serve } from 'https://deno.land/std@0.170.0/http/server.ts'
import 'https://deno.land/x/xhr@0.2.1/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.5.0'
import GPT3Tokenizer from 'https://esm.sh/gpt3-tokenizer@1.1.5'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0'

const openAiKey = Deno.env.get('OPENAI_KEY')
const supabaseUrl = Deno.env.get('META_SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('META_SUPABASE_SERVICE_KEY')

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!openAiKey) {
    return new Response(
      JSON.stringify({
        error: 'Missing environment variable OPENAI_KEY',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (!supabaseUrl) {
    return new Response(
      JSON.stringify({
        error: 'Missing environment variable META_SUPABASE_URL',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (!supabaseServiceKey) {
    return new Response(
      JSON.stringify({
        error: 'Missing environment variable META_SUPABASE_SERVICE_KEY',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  const requestData = await req.json()

  if (!requestData) {
    return new Response(
      JSON.stringify({
        error: 'Missing request data',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  const { query } = requestData

  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

  const configuration = new Configuration({ apiKey: openAiKey })
  const openai = new OpenAIApi(configuration)

  // Moderate the content to comply with OpenAI T&C
  const moderationResponse = await openai.createModeration({ input: query })

  const [results] = moderationResponse.data.results

  if (results.flagged) {
    return new Response(
      JSON.stringify({
        error: 'Flagged content',
        flagged: true,
        categories: results.categories,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  const embeddingResponse = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input: query.replaceAll('\n', ' '),
  })

  if (embeddingResponse.status !== 200) {
    console.log(
      `Failed to create embedding for question. OpenAI response status ${embeddingResponse.status}`
    )

    return new Response(
      JSON.stringify({
        error: 'Failed to process questions',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  const [{ embedding }] = embeddingResponse.data.data

  const { error: matchError, data: pageSections } = await supabaseClient.rpc(
    'match_page_sections',
    {
      embedding,
      match_threshold: 0.78,
      match_count: 10,
      min_content_length: 50,
    }
  )

  if (matchError) {
    console.log(matchError.message)
    throw matchError
  }

  const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })
  let tokenCount = 0
  let contextText = ''

  for (let i = 0; i < pageSections.length; i++) {
    const pageSection = pageSections[i]
    const content = pageSection.content
    const encoded = tokenizer.encode(content)
    tokenCount += encoded.text.length

    if (tokenCount >= 1500) {
      break
    }

    contextText += `${content.trim()}\n---\n`
  }

  const prompt = `You are a very enthusiastic Supabase representative who loves to help people! Given the following sections from the Supabase documentation, answer the question using only that information, outputted in markdown format. Include multiline code snippets when available. If you are unsure and the answer is not explicitly written in the documentation, say "Sorry, I don't know how to help with that."

Context sections:
${contextText}

Question: """
${query}
"""

Answer as markdown:
`

  console.log(prompt)

  const completionResponse = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt,
    max_tokens: 512,
  })

  if (completionResponse.status !== 200) {
    throw new Error('Failed to complete')
  }

  // TODO: handle response errors
  const {
    id,
    choices: [{ text: answer }],
  } = completionResponse.data

  console.log(completionResponse.data)

  return new Response(
    JSON.stringify({
      id,
      answer,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
})
