import { StreamingTextResponse } from 'ai'
import { generateV2 } from 'ai-commands/edge'
import { createOpenAiClient } from 'ai-commands/src/openai'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export default async function handler(req: NextRequest) {
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

async function handlePost(request: NextRequest) {
  const { openai, model, error } = createOpenAiClient()

  if (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const body = await (request.json() as Promise<{
    messages: { content: string; role: 'user' | 'assistant' }[]
    existingSql?: string
    entityDefinitions: string[]
  }>)

  const { messages, existingSql, entityDefinitions } = body

  try {
    const stream = await generateV2(openai, model, messages, existingSql, entityDefinitions)
    return new StreamingTextResponse(stream)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`AI SQL generation-v2 failed: ${error.message}`)
    } else {
      console.error(`AI SQL generation-v2 failed: ${error}`)
    }

    return new Response(
      JSON.stringify({
        error: 'There was an error processing your request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
