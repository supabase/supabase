import { StreamingTextResponse } from 'ai'
import { chatRlsPolicy } from 'ai-commands/edge'
import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'edge'

const openAiKey = process.env.OPENAI_API_KEY

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

async function handlePost(request: NextRequest) {
  const openai = new OpenAI({ apiKey: openAiKey })

  const body = await (request.json() as Promise<{
    messages: { content: string; role: 'user' | 'assistant' }[]
    entityDefinitions: string[]
    policyDefinition: string
  }>)

  const { messages, entityDefinitions, policyDefinition } = body

  try {
    const stream = await chatRlsPolicy(openai, messages, entityDefinitions, policyDefinition)
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
