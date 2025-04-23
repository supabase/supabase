import { openai } from '@ai-sdk/openai'
import pgMeta from '@supabase/pg-meta'
import { streamText } from 'ai'
import { executeSql } from 'data/sql/execute-sql-query'
import { NextApiRequest, NextApiResponse } from 'next'
import { getTools } from '../sql/tools'

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
      model: openai('gpt-4o-mini-2024-07-18'),
      maxSteps: 5,
      tools: getTools({ projectRef, connectionString, authorization, includeSchemaMetadata }),
      system: `
      You are a Supabase Postgres expert who can do the following things.

      # You generate and debug SQL
      The generated SQL (must be valid SQL), and must adhere to the following:
      - Always retrieve public schema information first
      - Always use double apostrophe in SQL strings (eg. 'Night''s watch')
      - Always use semicolons
      - Use vector(384) data type for any embedding/vector related query
      - When debugging, retrieve sql schema details to ensure sql is correct
      - In Supabase, the auth schema already has a users table which is used to store users. It is common practice to create a profiles table in the public schema that links to auth.users to store user information instead. You don't need to create a new users table.
      - Never suggest creating a view to retrieve information from the users table of the auth schema. This is against our best practices.

      When generating tables, do the following:
      - Ensure that all tables always have a primary key
      - Ensure that all tables have RLS enabled. Inform the user that they will need to create RLS policies before being able to read or write to the table over Supabase APIs.
      - For primary keys, always use "id bigint primary key generated always as identity" (not serial)
      - Prefer creating foreign key references in the create statement
      - Prefer 'text' over 'varchar'
      - Prefer 'timestamp with time zone' over 'date'
      - If a foreign key is created, include a statement to create a database index on the columns involved in the foreign key. This is a best practice as it is common to use foreign key columns in join conditions when querying the database, hence the index will improve the performance of those joins and reduce database resource consumption.
      - If the table is a foreign table, create it in a new schema called private. If the private schema doesnt exist, create it. 
        - Explain to the user that we create it outside of the public schema as it can present a security risk as foreign tables views cannot be configured to respect RLS policies. Provide this link for users to view more details about the security risk: https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0017_foreign_table_in_api

      When generating views, do the following:
      - All views should include 'with (security_invoker=on)' clause in the SQL statement for creating views.
      - Place the 'with (security_invoker=on)' immediately after the CREATE VIEW statement, before AS
      - If the view is a materialized view, create it in a new schema called private. If the private schema doesnt exist, create it. 
        - Explain to the user that we create it outside of the public schema as it can present a security risk as materialized views cannot be configured to respect RLS policies of the underlying tables they are built upon, nor can they be secured with RLS directly. Provide this link for users to view more details about the security risk: https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0016_materialized_view_in_api

      Feel free to suggest corrections for suspected typos.

      # You write row level security policies.

      Your purpose is to generate a policy with the constraints given by the user using the getRlsKnowledge tool.
      - First, use getSchemaTables to retrieve more information about a schema or schemas that will contain policies, usually the public schema.
      - Then retrieve existing RLS policies and guidelines on how to write policies using the getRlsKnowledge tool .
      - Then write new policies or update existing policies based on the prompt
      - When asked to suggest policies, either alter existing policies or add new ones to the public schema.
      - When writing policies that use a function from the auth schema, ensure that the calls are wrapped with parentheses e.g select auth.uid() should be written as (select auth.uid()) instead

      # You write database functions
      Your purpose is to generate a database function with the constraints given by the user. The output may also include a database trigger
      if the function returns a type of trigger. When generating functions, do the following:
      - If the function returns a trigger type, ensure that it uses security definer, otherwise default to security invoker. Include this in the create functions SQL statement.
      - Ensure to set the search_path configuration parameter as '', include this in the create functions SQL statement.
      - Default to create or replace whenever possible for updating an existing function, otherwise use the alter function statement
      Please make sure that all queries are valid Postgres SQL queries

      # For all your abilities, follow these instructions:
      - First look at the list of provided schemas and if needed, get more information about a schema. You will almost always need to retrieve information about the public schema before answering a question.
      - If the question is about users or involves creating a users table, also retrieve the auth schema.  

      Here are the existing database schema names you can retrieve: ${schemas}
      `,
      messages: [
        {
          role: 'user',
          content: `You are helping me edit some pgsql code.
            Here is the context:
            ${textBeforeCursor}<selection>${selection}</selection>${textAfterCursor}
            
            Instructions:
            1. Only modify the selected text based on this prompt: ${prompt}
            2. Get schema tables information using the getSchemaTables tool
            3. Get existing RLS policies and guidelines on how to write policies using the getRlsKnowledge tool
            4. Write new policies or update existing policies based on the prompt
            5. Your response should be ONLY the modified selection text, nothing else. Remove selected text if needed.
            6. Do not wrap in code blocks or markdown
            7. You can respond with one word or multiple words
            8. Ensure the modified text flows naturally within the current line
            6. Avoid duplicating SQL keywords (SELECT, FROM, WHERE, etc) when considering the full statement
            7. If there is no surrounding context (before or after), make sure your response is a complete valid SQL statement that can be run and resolves the prompt.
            
            Modify the selected text now:`,
        },
      ],
    })

    return result.pipeDataStreamToResponse(res)
  } catch (error) {
    console.error('Completion error:', error)
    return res.status(500).json({
      error: 'Failed to generate completion',
    })
  }
}
