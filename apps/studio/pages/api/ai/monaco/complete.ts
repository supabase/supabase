import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'
import { getTools } from '../sql/tools'
import { executeSql } from 'data/sql/execute-sql-query'
import pgMeta from '@supabase/pg-meta'

export const maxDuration = 30
const openAiKey = process.env.OPENAI_API_KEY
const pgMetaSchemasList = pgMeta.schemas.list()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!openAiKey) {
    return res.status(500).json({
      completion: null,
      error: 'No OPENAI_API_KEY set. Create this environment variable to use AI features.',
    })
  }

  console.log('complete req.body', req.body)

  if (req.method !== 'POST') {
    return res.status(405).json({
      completion: null,
      error: `Method ${req.method} Not Allowed`,
    })
  }

  try {
    const { completionMetadata, projectRef, connectionString, includeSchemaMetadata } = req.body
    const { textBeforeCursor, textAfterCursor, language, prompt, selection } = completionMetadata

    if (!projectRef) {
      return res.status(400).json({
        completion: null,
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

    console.log(`before selection: ${textBeforeCursor}
            selection: ${selection}
            after selection: ${textAfterCursor}`)

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      maxSteps: 5,
      tools: getTools({ projectRef, connectionString, authorization, includeSchemaMetadata }),
      system: `You are a Supabase Postgres expert who can do the following things.

      # You generate and debug SQL
      The generated SQL (must be valid SQL), and must adhere to the following:
      - Always use double apostrophe in SQL strings (eg. 'Night''s watch')
      - Always use semicolons
      - Use vector(384) data type for any embedding/vector related query
      - When debugging, retrieve sql schema details to ensure sql is correct

      When generating tables, do the following:
      - For primary keys, always use "id bigint primary key generated always as identity" (not serial)
      - Prefer creating foreign key references in the create statement
      - Prefer 'text' over 'varchar'
      - Prefer 'timestamp with time zone' over 'date'

      Feel free to suggest corrections for suspected typos.

      # You write row level security policies.

      Your purpose is to generate a policy with the constraints given by the user.
      - First, use getSchema to retrieve more information about a schema or schemas that will contain policies, usually the public schema.
      
      # You write database functions
      Your purpose is to generate a database function with the constraints given by the user. The output may also include a database trigger
      if the function returns a type of trigger. When generating functions, do the following:
      - If the function returns a trigger type, ensure that it uses security definer, otherwise default to security invoker. Include this in the create functions SQL statement.
      - Ensure to set the search_path configuration parameter as '', include this in the create functions SQL statement.
      - Default to create or replace whenever possible for updating an existing function, otherwise use the alter function statement
      Please make sure that all queries are valid Postgres SQL queries

      Follow these instructions:
      - First look at the list of provided schemas and if needed, get more information about a schema. You will almost always need to retrieve information about the public schema before answering a question. If the question is about users, also retrieve the auth schema.

      Here are the existing database schema names you can retrieve: ${schemas}.`,
      messages: [
        {
          role: 'user',
          content: `I have the following ${language} code:
            before: ${textBeforeCursor}
            selection: ${selection}
            after: ${textAfterCursor}
            Make changes to the selected text: ${prompt}
            Only return edits to the selection and nothing else. Dont wrap in markdown code snippets. The new text must work as a complete sql statement when inserted inbetween the before and after text. If before and after are empty, the new text must work as a complete sql statement. `,
        },
      ],
    })

    return res.status(200).json({ completion: text })
  } catch (error) {
    console.error('Completion error:', error)
    return res.status(500).json({
      completion: null,
      error: 'Failed to generate completion',
    })
  }
}
