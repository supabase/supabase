import { stripIndent } from 'common-tags'
import { NextRequest } from 'next/server'
import type {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
} from 'openai'

export const config = {
  runtime: 'experimental-edge',
}

const openAiKey = process.env.OPENAI_KEY

export default async function handler(req: NextRequest) {
  const { prompt } = await req.json()

  const model = 'gpt-3.5-turbo-0613'
  const maxCompletionTokenCount = 1024

  const completionMessages: ChatCompletionRequestMessage[] = [
    {
      role: 'user',
      content: stripIndent`
        Natural language prompt:
        ${prompt}
      `,
    },
  ]

  const completionOptions: CreateChatCompletionRequest = {
    model,
    messages: completionMessages,
    max_tokens: maxCompletionTokenCount,
    temperature: 0,
    function_call: {
      name: 'generateSql',
    },
    functions: [
      {
        name: 'generateSql',
        description: 'Generates Postgres SQL based on a natural language prompt',
        parameters: {
          type: 'object',
          properties: {
            sql: {
              type: 'string',
              description: stripIndent`
                The generated SQL.
                - For primary keys, prefer "id" and always use "bigint primary key generated always as identity"
              `,
            },
            title: {
              type: 'string',
              description: stripIndent`
              The title of the SQL.
              - Omit words like 'SQL', 'Postgres', or 'query'
            `,
            },
          },
          required: ['sql', 'title'],
        },
      },
    ],
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

  const result: CreateChatCompletionResponse = await response.json()

  console.log(result)

  const [firstChoice] = result.choices

  const sqlResponseString = firstChoice.message?.function_call?.arguments

  const sqlResponse = sqlResponseString ? JSON.parse(sqlResponseString) : undefined

  return new Response(JSON.stringify(sqlResponse), {
    headers: {
      'content-type': 'application/json',
    },
  })
}
