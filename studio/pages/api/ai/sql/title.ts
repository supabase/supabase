import { SchemaBuilder } from '@serafin/schema-builder'
import { stripIndent } from 'common-tags'
import { NextRequest } from 'next/server'
import type {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
  ErrorResponse,
} from 'openai'

export const config = {
  runtime: 'experimental-edge',
}

const openAiKey = process.env.OPENAI_KEY

const generateTitleSchema = SchemaBuilder.emptySchema().addString('title', {
  description: stripIndent`
      The generated title for the SQL snippet (short and concise).
      - Omit words like 'SQL', 'Postgres', or 'Query'
    `,
})

type GenerateTitleResult = typeof generateTitleSchema.T

const completionFunctions = {
  generateTitle: {
    name: 'generateTitle',
    description: 'Generates a short title for a Postgres SQL snippet',
    parameters: generateTitleSchema.schema,
  },
}

export default async function handler(req: NextRequest) {
  const { sql } = await req.json()

  const model = 'gpt-3.5-turbo-0613'
  const maxCompletionTokenCount = 1024

  const completionMessages: ChatCompletionRequestMessage[] = [
    {
      role: 'user',
      content: sql,
    },
  ]

  const completionOptions: CreateChatCompletionRequest = {
    model,
    messages: completionMessages,
    max_tokens: maxCompletionTokenCount,
    temperature: 0,
    function_call: {
      name: completionFunctions.generateTitle.name,
    },
    functions: [completionFunctions.generateTitle],
    stream: false,
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(completionOptions),
  })

  if (!response.ok) {
    const errorResponse: ErrorResponse = await response.json()
    console.error(`AI title generation failed: ${errorResponse.error.message}`)

    return new Response(
      JSON.stringify({
        error: 'There was an unknown error generating the snippet title. Please try again.',
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json',
        },
      }
    )
  }

  const completionResponse: CreateChatCompletionResponse = await response.json()

  console.log(completionResponse)

  const [firstChoice] = completionResponse.choices

  const titleResponseString = firstChoice.message?.function_call?.arguments

  if (!titleResponseString) {
    console.error(
      `AI title generation failed: OpenAI response succeeded, but response format was incorrect`
    )

    return new Response(
      JSON.stringify({
        error: 'There was an unknown error generating the snippet title. Please try again.',
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json',
        },
      }
    )
  }

  const generateTitleResult: GenerateTitleResult = JSON.parse(titleResponseString)

  if (!generateTitleResult.title) {
    console.error(`AI title generation failed: Unable to generate title for the given SQL`)

    return new Response(
      JSON.stringify({
        error: 'Unable to generate title',
      }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      }
    )
  }

  return new Response(JSON.stringify(generateTitleResult), {
    headers: {
      'content-type': 'application/json',
    },
  })
}
