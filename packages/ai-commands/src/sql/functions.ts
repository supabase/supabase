import { SchemaBuilder } from '@serafin/schema-builder'
import { codeBlock, stripIndent } from 'common-tags'
import { jsonrepair } from 'jsonrepair'
import type OpenAI from 'openai'

import { ContextLengthError, EmptyResponseError, EmptySqlError } from '../errors'

const debugSqlSchema = SchemaBuilder.emptySchema()
  .addString('solution', {
    description: 'A short suggested solution for the error (as concise as possible).',
  })
  .addString('sql', {
    description:
      'The SQL rewritten to apply the solution. Includes all the original logic, but modified to fix the issue.',
  })

const generateTitleSchema = SchemaBuilder.emptySchema()
  .addString('title', {
    description: stripIndent`
      The generated title for the SQL snippet (short and concise).
      - Omit these words: 'SQL', 'Postgres', 'Query', 'Database'
    `,
  })
  .addString('description', {
    description: stripIndent`
      The generated description for the SQL snippet.
    `,
  })

// Reference auto-generated types for each JSON schema
export type DebugSqlResult = typeof debugSqlSchema.T
export type GenerateTitleResult = typeof generateTitleSchema.T

// Combine the completion functions
const completionFunctions = {
  debugSql: {
    name: 'debugSql',
    description: stripIndent`
      Debugs a Postgres SQL error. Returns the fixed SQL and a solution explaining it.
      - Create extensions if they are missing (only for valid extensions)
      - Suggest creating tables if they are missing
      - Include all of the original SQL
      - For primary keys, always use "id bigint primary key generated always as identity" (not serial)
      - When creating tables, always add foreign key references inline
      - Prefer 'text' over 'varchar'
      - Prefer 'timestamp with time zone' over 'date'
      - Use vector(384) data type for any embedding/vector related query
      - Always use double apostrophe in SQL strings (eg. 'Night''s watch')
      - Always use semicolons
    `,
    parameters: debugSqlSchema.schema as Record<string, unknown>,
  },
  generateTitle: {
    name: 'generateTitle',
    description: stripIndent`
      Generates a short title and summarized description for a Postgres SQL snippet.

      The description should describe why this table was created (eg. "Table to track todos")
    `,
    parameters: generateTitleSchema.schema as Record<string, unknown>,
  },
} satisfies Record<string, OpenAI.Chat.Completions.ChatCompletionCreateParams.Function>

/**
 * Debugs SQL errors.
 *
 * @returns A suggested SQL fix along with a solution explanation.
 */
export async function debugSql(
  openai: OpenAI,
  errorMessage: string,
  sql: string,
  entityDefinitions?: string[]
) {
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

  try {
    const completionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: completionMessages,
      max_tokens: 2048,
      temperature: 0,
      tool_choice: {
        type: 'function',
        function: {
          name: completionFunctions.debugSql.name,
        },
      },
      tools: [
        {
          type: 'function',
          function: completionFunctions.debugSql,
        },
      ],
      stream: false,
    })

    const [firstChoice] = completionResponse.choices
    const [firstTool] = firstChoice.message?.tool_calls ?? []

    const sqlResponseString = firstTool?.function.arguments

    if (!sqlResponseString) {
      throw new EmptyResponseError()
    }

    const repairedJsonString = jsonrepair(sqlResponseString)

    const result: DebugSqlResult = JSON.parse(repairedJsonString)

    if (!result.sql) {
      throw new EmptySqlError()
    }

    return result
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'context_length_exceeded') {
      throw new ContextLengthError()
    }
    throw error
  }
}

/**
 * Generates a snippet title based on the provided SQL.
 *
 * @returns A title and description for the SQL snippet.
 */
export async function titleSql(openai: OpenAI, sql: string) {
  const completionMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'user',
      content: sql,
    },
  ]

  try {
    const completionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: completionMessages,
      max_tokens: 1024,
      temperature: 0,
      tool_choice: {
        type: 'function',
        function: {
          name: completionFunctions.generateTitle.name,
        },
      },
      tools: [
        {
          type: 'function',
          function: completionFunctions.generateTitle,
        },
      ],
      stream: false,
    })

    const [firstChoice] = completionResponse.choices
    const [firstTool] = firstChoice.message?.tool_calls ?? []

    const sqlResponseString = firstTool?.function.arguments

    if (!sqlResponseString) {
      throw new EmptyResponseError()
    }

    const repairedJsonString = jsonrepair(sqlResponseString)

    const result: GenerateTitleResult = JSON.parse(repairedJsonString)

    return result
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'context_length_exceeded') {
      throw new ContextLengthError()
    }
    throw error
  }
}
