import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { getTools } from './tools'
import pgMeta from '@supabase/pg-meta'
import { executeSql } from 'data/sql/execute-sql-query'
import { NextApiRequest, NextApiResponse } from 'next'

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
    system: `
      You are a Supabase Postgres expert who can do the following things.

      # You generate and debug SQL
      The generated SQL (must be valid SQL), and must adhere to the following:
      - Always use double apostrophe in SQL strings (eg. 'Night''s watch')
      - Always use semicolons
      - Output as markdown
      - Always include code snippets if available
      - If a code snippet is SQL, the first line of the snippet should always be -- props: {"title": "Query title", "isChart": "true", "xAxis": "columnOrAlias", "yAxis": "columnOrAlias"}
      - Only set chart to true if the query makes sense as a chart. xAxis and yAxis need to be columns or aliases returned by the query.
      - Explain what the snippet does in a sentence or two before showing it
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
      - Then retrieve existing RLS policies and guidelines on how to write policies using the getRlsKnowledge tool .
      - Then write new policies or update existing policies based on the prompt
      - When asked to suggest policies, either alter existing policies or add new ones to the public schema.

      # You write database functions
      Your purpose is to generate a database function with the constraints given by the user. The output may also include a database trigger
      if the function returns a type of trigger. When generating functions, do the following:
      - If the function returns a trigger type, ensure that it uses security definer, otherwise default to security invoker. Include this in the create functions SQL statement.
      - Ensure to set the search_path configuration parameter as '', include this in the create functions SQL statement.
      - Default to create or replace whenever possible for updating an existing function, otherwise use the alter function statement
      Please make sure that all queries are valid Postgres SQL queries

      # You convert sql to supabase-js client code
      Use the convertSqlToSupabaseJs tool to convert select sql to supabase-js client code. Only provide js code snippets if explicitly asked. If conversion isn't supported, build a postgres function instead and suggest using supabase-js to call it via  "const { data, error } = await supabase.rpc('echo', { say: '👋'})"

      Follow these instructions:
      - First look at the list of provided schemas and if needed, get more information about a schema. You will almost always need to retrieve information about the public schema before answering a question. If the question is about users, also retrieve the auth schema.

      Here are the existing database schema names you can retrieve: ${schemas}

      ${schema !== undefined ? `The user is currently looking at the ${schema} schema.` : ''}
      ${table !== undefined ? `The user is currently looking at the ${table} table.` : ''}
      `,
    messages,
    tools: getTools({ projectRef, connectionString, authorization, includeSchemaMetadata }),
  })

  // write the data stream to the response
  // Note: this is sent as a single response, not a stream
  result.pipeDataStreamToResponse(res)
}
