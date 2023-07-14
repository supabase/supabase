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

const generateSqlSchema = SchemaBuilder.emptySchema()
  .addString('sql', {
    description: stripIndent`
      The generated SQL.
      - For primary keys, always use "id bigint primary key generated always as identity" (not serial)
      - Prefer creating foreign key references in the create statement
      - Prefer 'text' over 'varchar'
      - Prefer 'timestamp with time zone' over 'date'
      - Use vector(384) data type for any embedding/vector related query
    `,
  })
  .addString('title', {
    description: stripIndent`
      The title of the SQL.
      - Omit words like 'SQL', 'Postgres', or 'Query'
    `,
  })

type GenerateSqlResult = typeof generateSqlSchema.T

const completionFunctions = {
  generateSql: {
    name: 'generateSql',
    description: 'Generates Postgres SQL based on a natural language prompt',
    parameters: generateSqlSchema.schema,
  },
}

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
      name: completionFunctions.generateSql.name,
    },
    functions: [completionFunctions.generateSql],
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
    console.error(`AI SQL generation failed: ${errorResponse.error.message}`)

    return new Response(
      JSON.stringify({
        error: 'There was an unknown error generating the SQL snippet. Please try again.',
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

  const sqlResponseString = firstChoice.message?.function_call?.arguments

  if (!sqlResponseString) {
    console.error(
      `AI SQL generation failed: OpenAI response succeeded, but response format was incorrect`
    )

    return new Response(
      JSON.stringify({
        error: 'There was an unknown error generating the SQL snippet. Please try again.',
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json',
        },
      }
    )
  }

  const generateSqlResult: GenerateSqlResult = JSON.parse(sqlResponseString)

  if (!generateSqlResult.sql) {
    console.error(`AI SQL generation failed: Unable to generate SQL for the given prompt`)

    return new Response(
      JSON.stringify({
        error: 'Unable to generate SQL. Try adding more details to your prompt.',
      }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      }
    )
  }

  return new Response(JSON.stringify(generateSqlResult), {
    headers: {
      'content-type': 'application/json',
    },
  })
}
