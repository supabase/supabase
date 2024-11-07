import { StreamingTextResponse } from 'ai'
import { chatCron } from 'ai-commands/edge'
import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { ContextLengthError } from 'ai-commands'
import { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  runtime: 'edge',
  /* To avoid OpenAI errors, restrict to the Vercel Edge Function regions that
  overlap with the OpenAI API regions.

  Reference for Vercel regions: https://vercel.com/docs/edge-network/regions#region-list
  Reference for OpenAI regions: https://help.openai.com/en/articles/5347006-openai-api-supported-countries-and-territories
  */
  regions: [
    'arn1',
    'bom1',
    'cdg1',
    'cle1',
    'cpt1',
    'dub1',
    'fra1',
    'gru1',
    'hnd1',
    'iad1',
    'icn1',
    'kix1',
    'lhr1',
    'pdx1',
    'sfo1',
    'sin1',
    'syd1',
  ],
}

const openAiKey = process.env.OPENAI_API_KEY
const openai = new OpenAI({ apiKey: openAiKey })

export default async function handler(req: NextRequest) {
  if (!openAiKey) {
    return new Response(
      JSON.stringify({
        error: 'No OPENAI_API_KEY set. Create this environment variable to use AI features.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req)
    default:
      return new Response(
        JSON.stringify({ data: null, error: { message: `Method ${method} Not Allowed` } }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json', Allow: 'POST' },
        }
      )
  }
}

export async function handlePost(req: NextRequest) {
  const body = await req.json()
  const { prompt } = body
  console.log('prompt', prompt)
  try {
    const result = await chatCron(openai, prompt)
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    if (error instanceof Error) {
      console.error(`AI cron generation failed: ${error.message}`)

      if (error instanceof ContextLengthError) {
        return new Response(
          JSON.stringify({
            error:
              'Your cron prompt is too large for Supabase AI to ingest. Try splitting it into smaller prompts.',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    } else {
      console.log(`Unknown error: ${error}`)
    }

    return new Response(
      JSON.stringify({
        error: 'There was an unknown error generating the cron syntax. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

// async function handlePost(request: NextRequest) {
//   const openai = new OpenAI({ apiKey: openAiKey })

//   const body = await (request.json() as Promise<{
//     messages: { content: string; role: 'user' | 'assistant' }[]
//   }>)

//   const { messages } = body

//   try {
//     const stream = await chatCron(openai, messages)
//     return new StreamingTextResponse(stream)
//   } catch (error) {
//     console.error(error)

//     return new Response(
//       JSON.stringify({
//         error: 'There was an error processing your request',
//       }),
//       {
//         status: 500,
//         headers: { 'Content-Type': 'application/json' },
//       }
//     )
//   }
// }
