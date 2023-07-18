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

const debugSqlSchema = SchemaBuilder.emptySchema()
  .addString('solution', {
    description: 'A short suggested solution for the error (as concise as possible).',
  })
  .addString('sql', {
    description: 'The SQL rewritten to apply the solution. Includes all the original SQL.',
  })

type DebugSqlResult = typeof debugSqlSchema.T

const completionFunctions = {
  debugSql: {
    name: 'debugSql',
    description: 'Debugs a Postgres SQL error and modifies the SQL to fix it',
    parameters: debugSqlSchema.schema,
  },
}

export default async function handler(req: NextRequest) {
  const { errorMessage, sql } = await req.json()

  const model = 'gpt-3.5-turbo-0613'
  const maxCompletionTokenCount = 2048

  const completionMessages: ChatCompletionRequestMessage[] = [
    {
      role: 'user',
      content: stripIndent`
        Here is my current SQL:
        ${sql}
      `,
    },
    {
      role: 'user',
      content: stripIndent`
        Here is the error I am getting:
        ${errorMessage}
      `,
    },
  ]

  const completionOptions: CreateChatCompletionRequest = {
    model,
    messages: completionMessages,
    max_tokens: maxCompletionTokenCount,
    temperature: 0,
    function_call: {
      name: completionFunctions.debugSql.name,
    },
    functions: [completionFunctions.debugSql],
    stream: false,
  }

  console.log({ sql, completionMessages })

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
    console.log({ errorResponse })
    console.error(`AI SQL debugging failed: ${errorResponse.error.message}`)

    return new Response(
      JSON.stringify({
        error: 'There was an unknown error debugging the SQL snippet. Please try again.',
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
      `AI SQL debugging failed: OpenAI response succeeded, but response format was incorrect`
    )

    return new Response(
      JSON.stringify({
        error: 'There was an unknown error debugging the SQL snippet. Please try again.',
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json',
        },
      }
    )
  }

  console.log({ sqlResponseString })

  const debugSqlResult: DebugSqlResult = JSON.parse(sqlResponseString)

  if (!debugSqlResult.sql) {
    console.error(`AI SQL debugging failed: Unable to debug SQL for the given prompt`)

    return new Response(
      JSON.stringify({
        error: 'Unable to debug SQL. Try adding more details to your prompt.',
      }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      }
    )
  }

  return new Response(JSON.stringify(debugSqlResult), {
    headers: {
      'content-type': 'application/json',
    },
  })
}
