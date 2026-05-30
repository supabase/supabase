import { SupabaseClient } from '@supabase/supabase-js'
import { ApplicationError, UserError, clippy } from 'ai-commands/edge'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

import { isFeatureEnabled } from 'common/enabled-features'

export const runtime = 'edge'
/* To avoid OpenAI errors, restrict to the Vercel Edge Function regions that
  overlap with the OpenAI API regions.

  Reference for Vercel regions: https://vercel.com/docs/edge-network/regions#region-list
  Reference for OpenAI regions: https://help.openai.com/en/articles/5347006-openai-api-supported-countries-and-territories
  */
export const preferredRegion = [
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
]

const openAiKey = process.env.OPENAI_API_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export async function POST(req: NextRequest) {
  if (!openAiKey || !supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing environment variables for AI features.' },
      { status: 500 }
    )
  }

  const openai = new OpenAI({ apiKey: openAiKey })
  const supabaseClient = new SupabaseClient(supabaseUrl, supabaseServiceKey)

  try {
    const { messages } = (await req.json()) as {
      messages: { content: string; role: 'user' | 'assistant' }[]
    }

    if (!messages) {
      throw new UserError('Missing messages in request data')
    }

    const useAltSearchIndex = !isFeatureEnabled('search:fullIndex')
    const response = await clippy(openai, supabaseClient, messages, {
      useAltSearchIndex,
    })

    // Proxy the streamed SSE response from OpenAI
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    })
  } catch (error: unknown) {
    console.error(error)
    if (error instanceof UserError) {
      return NextResponse.json({ error: error.message, data: error.data }, { status: 400 })
    } else if (error instanceof ApplicationError) {
      console.error(`${error.message}: ${JSON.stringify(error.data)}`)
    } else {
      console.error(error)
    }

    return NextResponse.json(
      { error: 'There was an error processing your request' },
      { status: 500 }
    )
  }
}
