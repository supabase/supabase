import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { getTools } from './tools'
import pgMeta from '@supabase/pg-meta'
import { executeSql } from 'data/sql/execute-sql-query'
import { NextApiRequest, NextApiResponse } from 'next'
import { MARKDOWN_SYSTEM_PROMPT } from 'data/ai/constants'

export const maxDuration = 30
const openAiKey = process.env.OPENAI_API_KEY
const pgMetaSchemasList = pgMeta.schemas.list()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      return handlePost(req, res)
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

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { messages, projectRef, connectionString, includeSchemaMetadata, schema, table } = req.body

  if (!projectRef) {
    return res.status(400).json({
      error: 'Missing project_ref in query parameters',
    })
  }

  const authorization = req.headers.authorization

  const { result: schemas } = includeSchemaMetadata
    ? await executeSql(
        {
          projectRef,
          connectionString,
          sql: pgMetaSchemasList.sql,
        },
        undefined,
        {
          'Content-Type': 'application/json',
          ...(authorization && { Authorization: authorization }),
        }
      )
    : { result: [] }

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    maxSteps: 5,
    system: `${MARKDOWN_SYSTEM_PROMPT}

      Here are the existing database schema names you can retrieve: ${schemas}

      ${schema !== undefined && includeSchemaMetadata ? `The user is currently looking at the ${schema} schema.` : ''}
      ${table !== undefined && includeSchemaMetadata ? `The user is currently looking at the ${table} table.` : ''}
      `,
    messages,
    tools: getTools({ projectRef, connectionString, authorization, includeSchemaMetadata }),
  })

  // write the data stream to the response
  // Note: this is sent as a single response, not a stream
  result.pipeDataStreamToResponse(res)
}
