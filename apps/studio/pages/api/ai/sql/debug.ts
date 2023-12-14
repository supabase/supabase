import { SchemaBuilder } from '@serafin/schema-builder'
import { codeBlock, stripIndent } from 'common-tags'
import { isError } from 'data/utils/error-check'
import { jsonrepair } from 'jsonrepair'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'

const openAiKey = process.env.OPENAI_KEY

const debugSqlSchema = SchemaBuilder.emptySchema()
  .addString('solution', {
    description: 'A short suggested solution for the error (as concise as possible).',
  })
  .addString('sql', {
    description: 'The SQL rewritten to apply the solution. Includes all the original SQL.',
  })

type DebugSqlResult = typeof debugSqlSchema.T

const completionFunctions: Record<
  string,
  OpenAI.Chat.Completions.ChatCompletionCreateParams.Function
> = {
  debugSql: {
    name: 'debugSql',
    description: stripIndent`
      Debugs a Postgres SQL error and modifies the SQL to fix it.
      - Create extensions if they are missing (only for valid extensions)
      - Suggest creating tables if they are missing
      - Include all of the original SQL
      - For primary keys, always use "id bigint primary key generated always as identity" (not serial)
      - When creating tables, always add foreign key references inline
      - Prefer 'text' over 'varchar'
      - Prefer 'timestamp with time zone' over 'date'
      - Use vector(384) data type for any embedding/vector related query
      - Always use double apostrophe in SQL strings (eg. 'Night''s watch')
    `,
    parameters: debugSqlSchema.schema as Record<string, unknown>,
  },
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!openAiKey) {
    return res.status(500).json({
      error: 'No OPENAI_KEY set. Create this environment variable to use AI features.',
    })
  }

  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

export async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const openAI = new OpenAI({ apiKey: openAiKey })
  const {
    body: { errorMessage, sql, entityDefinitions },
  } = req

  const model = 'gpt-3.5-turbo-0613'
  const maxCompletionTokenCount = 2048
  const hasEntityDefinitions = entityDefinitions !== undefined && entityDefinitions.length > 0

  const completionMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

  if (hasEntityDefinitions) {
    completionMessages.push({
      role: 'user',
      content: codeBlock`
        Here is my database schema for reference:
        ${entityDefinitions.join('\n\n')}
      `,
    })
  }

  completionMessages.push(
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
    }
  )

  const completionOptions: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
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

  let completionResponse: OpenAI.Chat.Completions.ChatCompletion
  try {
    completionResponse = await openAI.chat.completions.create(completionOptions)
  } catch (error: any) {
    console.error(`AI SQL debugging failed: ${error.message}`)

    if ('code' in error && error.code === 'context_length_exceeded') {
      if (hasEntityDefinitions) {
        const definitionsLength = entityDefinitions.reduce(
          (sum: number, def: string) => sum + def.length,
          0
        )

        if (definitionsLength > sql.length) {
          return res.status(400).json({
            error:
              'Your database metadata is too large for Supabase AI to ingest. Try disabling database metadata in AI settings.',
          })
        }
      }

      return res.status(400).json({
        error:
          'Your SQL query is too large for Supabase AI to ingest. Try splitting it into smaller queries.',
      })
    }

    return res.status(500).json({
      error: 'There was an unknown error debugging the SQL snippet. Please try again.',
    })
  }

  const [firstChoice] = completionResponse.choices

  const sqlResponseString = firstChoice.message?.function_call?.arguments

  if (!sqlResponseString) {
    console.error(
      `AI SQL debugging failed: OpenAI response succeeded, but response format was incorrect`
    )

    return res.status(500).json({
      error: 'There was an unknown error debugging the SQL snippet. Please try again.',
    })
  }

  try {
    // Attempt to repair broken JSON from OpenAI (eg. multiline strings)
    const repairedJsonString = jsonrepair(sqlResponseString)

    const debugSqlResult: DebugSqlResult = JSON.parse(repairedJsonString)

    if (!debugSqlResult.sql) {
      console.error(`AI SQL debugging failed: Unable to debug SQL for the given error message`)

      return res.status(400).json({
        error: 'Unable to debug SQL',
      })
    }

    return res.json(debugSqlResult)
  } catch (error) {
    console.error(
      `AI SQL editing failed: ${
        isError(error) ? error.message : 'An unknown error occurred'
      }, sqlResponseString: ${sqlResponseString}`
    )

    return res.status(500).json({
      error: 'There was an unknown error editing the SQL snippet. Please try again.',
    })
  }
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrapper
