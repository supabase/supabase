import { SupabaseClient } from '@supabase/supabase-js'
import { ApplicationError, UserError, clippy } from 'ai-commands/edge'
import { NextRequest } from 'next/server'
import OpenAI from 'openai'

const openAiKey = process.env.OPENAI_API_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export async function POST(req: NextRequest) {
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

  if (!supabaseUrl) {
    return new Response(
      JSON.stringify({
        error:
          'No NEXT_PUBLIC_SUPABASE_URL set. Create this environment variable to use AI features.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  if (!supabaseServiceKey) {
    return new Response(
      JSON.stringify({
        error:
          'No NEXT_PUBLIC_SUPABASE_ANON_KEY set. Create this environment variable to use AI features.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  return handlePost(req)
}

async function handlePost(request: NextRequest) {
  const openai = new OpenAI({ apiKey: openAiKey })

  const body = await (request.json() as Promise<{
    messages: { content: string; role: 'user' | 'assistant' }[]
  }>)

  const { messages } = body

  if (!messages) {
    throw new UserError('Missing messages in request data')
  }

  const supabaseClient = new SupabaseClient(supabaseUrl, supabaseServiceKey)

  try {
    const response = await clippy(openai, supabaseClient, messages)

    // Proxy the streamed SSE response from OpenAI
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    })
  } catch (error: unknown) {
    console.error(error)
    if (error instanceof UserError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          data: error.data,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    } else if (error instanceof ApplicationError) {
      // Print out application errors with their additional data
      console.error(`${error.message}: ${JSON.stringify(error.data)}`)
    } else {
      // Print out unexpected errors as is to help with debugging
      console.error(error)
    }

    // TODO: include more response info in debug environments
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
