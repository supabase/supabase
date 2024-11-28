import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextApiRequest, NextApiResponse } from 'next'
import { getTools } from '../sql/tools'
import { executeSql } from 'data/sql/execute-sql-query'
import pgMeta from '@supabase/pg-meta'
import { SQL_SYSTEM_PROMPT } from 'data/ai/constants'

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

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ data: null, error: { message: `Method ${req.method} Not Allowed` } }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json', Allow: 'POST' },
      }
    )
  }

  try {
    const { completionMetadata, projectRef, connectionString, includeSchemaMetadata } = req.body
    const { textBeforeCursor, textAfterCursor, language, prompt, selection } = completionMetadata

    if (!projectRef) {
      return res.status(400).json({
        error: 'Missing project_ref in request body',
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
      tools: getTools({ projectRef, connectionString, authorization, includeSchemaMetadata }),
      system: `${SQL_SYSTEM_PROMPT}

      Follow these instructions:
      - First look at the list of provided schemas and if needed, get more information about a schema. You will almost always need to retrieve information about the public schema before answering a question. If the question is about users, also retrieve the auth schema.

      Here are the existing database schema names you can retrieve: ${schemas}.`,
      messages: [
        {
          role: 'user',
          content: `I have selected pgsql code for you to change. 
            before selection: ${textBeforeCursor}
            selection: ${selection}
            after selection: ${textAfterCursor}
            I want you to change only the selection text based on the prompt: ${prompt}
            Dont wrap in markdown code snippets.
            You support changing multiple lines or single lines or even single words.
            Insert the new text inbetween the before and after text and ensure you aren't duplicating SELECT, FROM, WHERE, GROUP BY, ORDER BY, LIMIT or OFFSET keywords when looking at the complete sql statement.
            If before and after are empty, the new text must work as a complete sql statement. 
            Only return the new selection text and nothing else. 
            `,
        },
      ],
    })

    // Use pipeDataStreamToResponse instead of toDataStreamResponse
    return result.pipeDataStreamToResponse(res)
  } catch (error) {
    console.error('Completion error:', error)
    return res.status(500).json({
      error: 'Failed to generate completion',
    })
  }
}
