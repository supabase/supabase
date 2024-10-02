import { StreamingTextResponse } from 'ai'
import { chatRlsPolicy } from 'ai-commands/edge'
import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { DatabasePoliciesData } from '../../../../data/database-policies/database-policies-query'

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
    existingPolicies: DatabasePoliciesData
    policyDefinition: string
  }>)

  const { messages, entityDefinitions, existingPolicies, policyDefinition } = body

  try {
    const stream = await chatRlsPolicy(
      openai,
      messages,
      entityDefinitions,
      existingPolicies,
      policyDefinition
    )
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
