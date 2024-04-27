import { StreamingTextResponse } from 'ai'
import { chatRlsPolicy } from 'ai-commands/edge'
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
    entityDefinitions: string[]
    policyDefinition: string
  }>)

  const { messages, entityDefinitions, policyDefinition } = body

  try {
    const stream = await chatRlsPolicy(openai, model, messages, entityDefinitions, policyDefinition)
    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error(error)

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
