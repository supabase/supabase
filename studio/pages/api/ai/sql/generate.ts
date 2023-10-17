import { SchemaBuilder } from '@serafin/schema-builder'
import { codeBlock, stripIndent } from 'common-tags'
import { isError } from 'data/utils/error-check'
import { jsonrepair } from 'jsonrepair'
import apiWrapper from 'lib/api/apiWrapper'
import { NextApiRequest, NextApiResponse } from 'next'
import type {
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
  ErrorResponse,
} from 'openai'

const openAiKey = process.env.OPENAI_KEY

const generateSqlSchema = SchemaBuilder.emptySchema()
  .addString('sql', {
    description: stripIndent`
      The generated SQL (must be valid SQL).
      - For primary keys, always use "id bigint primary key generated always as identity" (not serial)
      - Prefer creating foreign key references in the create statement
      - Prefer 'text' over 'varchar'
      - Prefer 'timestamp with time zone' over 'date'
      - Use vector(384) data type for any embedding/vector related query
      - Always use double apostrophe in SQL strings (eg. 'Night''s watch')
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
  const {
    body: { prompt, entityDefinitions },
  } = req

  const model = 'gpt-3.5-turbo-0613'
  const maxCompletionTokenCount = 1024
  const hasEntityDefinitions = entityDefinitions !== undefined && entityDefinitions.length > 0

  const completionMessages: ChatCompletionRequestMessage[] = []

  if (hasEntityDefinitions) {
    completionMessages.push({
      role: 'user',
      content: codeBlock`
        Here is my database schema for reference:
        ${entityDefinitions.join('\n\n')}
      `,
    })
  }

  completionMessages.push({
    role: 'user',
    content: prompt,
  })

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

    if (
      'code' in errorResponse.error &&
      errorResponse.error.code === 'context_length_exceeded' &&
      hasEntityDefinitions
    ) {
      return res.status(400).json({
        error:
          'Your database metadata is too large for Supabase AI to ingest. Try disabling database metadata in AI settings.',
      })
    }

    return res.status(500).json({
      error: 'There was an unknown error generating the SQL snippet. Please try again.',
    })
  }

  const completionResponse: CreateChatCompletionResponse = await response.json()

  const [firstChoice] = completionResponse.choices

  const sqlResponseString = firstChoice.message?.function_call?.arguments

  if (!sqlResponseString) {
    console.error(
      `AI SQL generation failed: OpenAI response succeeded, but response format was incorrect`
    )

    return res.status(500).json({
      error: 'There was an unknown error generating the SQL snippet. Please try again.',
    })
  }

  try {
    // Attempt to repair broken JSON from OpenAI (eg. multiline strings)
    const repairedJsonString = jsonrepair(sqlResponseString)

    const generateSqlResult: GenerateSqlResult = JSON.parse(repairedJsonString)

    if (!generateSqlResult.sql) {
      console.error(`AI SQL generation failed: Unable to generate SQL for the given prompt`)

      res.status(400).json({
        error: 'Unable to generate SQL. Try adding more details to your prompt.',
      })

      return
    }

    return res.json(generateSqlResult)
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
