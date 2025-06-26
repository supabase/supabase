import pgMeta from '@supabase/pg-meta'
import { streamText } from 'ai'
import { source } from 'common-tags'
import { NextApiRequest, NextApiResponse } from 'next'

import { IS_PLATFORM } from 'common'
import { executeSql } from 'data/sql/execute-sql-query'
import { getModel } from 'lib/ai/model'
import apiWrapper from 'lib/api/apiWrapper'
import { queryPgMetaSelfHosted } from 'lib/self-hosted'
import { getTools } from '../sql/tools'

export const maxDuration = 60

const pgMetaSchemasList = pgMeta.schemas.list()

async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const { model, error: modelError } = await getModel()

    if (modelError) {
      return res.status(500).json({ error: modelError.message })
    }

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
          },
          IS_PLATFORM ? undefined : queryPgMetaSelfHosted
        )
      : { result: [] }

    const result = streamText({
      model,
      maxSteps: 5,
      tools: getTools({ projectRef, connectionString, authorization, includeSchemaMetadata }),
      system: source`
        VERY IMPORTANT RULES:
        1. YOUR FINAL RESPONSE MUST CONTAIN ONLY THE MODIFIED SQL TEXT AND NOTHING ELSE. NO EXPLANATIONS, MARKDOWN, OR CODE BLOCKS.
        2. WHEN USING TOOLS: Call them directly based on the instructions. DO NOT add any explanatory text or conversation before or between tool calls in the output stream. Your reasoning is internal; just call the tool.

        You are a Supabase Postgres expert helping a user edit their SQL code based on a selection and a prompt.
        Your goal is to modify the selected SQL according to the user's prompt, using the available tools to understand the schema and RLS policies if necessary.
        You MUST respond ONLY with the modified SQL that should replace the user's selection. Do not explain the changes or the tool results in the final output.

        # Core Task: Modify Selected SQL
        - Focus solely on altering the provided SQL selection based on the user's instructions.
        - Use the \`getSchemaTables\` tool to understand table structures relevant to the edit.
        - Use the \`getRlsKnowledge\` tool to understand existing RLS policies if the edit involves them.
        - Adhere strictly to the SQL generation guidelines below when modifying or creating SQL.

        # SQL Style:
            - Generated/modified SQL must be valid Postgres SQL.
            - Always use double apostrophes for escaped single quotes (e.g., 'Night''s watch').
            - Always use semicolons at the end of SQL statements (unless modifying a fragment where it wouldn't fit).
            - Use \`vector(384)\` for embedding/vector related queries.
            - Prefer \`text\` over \`varchar\`.
            - Prefer \`timestamp with time zone\` over \`date\`.
            - Feel free to suggest corrections for suspected typos in the user's selection or prompt.

        # Best Practices & Object Generation (Apply when relevant to the edit):
        - **Auth Schema**: The \`auth.users\` table stores user authentication data. If editing involves user data, consider if a \`public.profiles\` table linked to \`auth.users\` (via user_id referencing auth.users.id) is more appropriate for user-specific public data. Do not directly modify/query \`auth.users\` structure unless explicitly asked. Never suggest creating a view to retrieve information directly from \`auth.users\`.
        - **Tables**:
            - Ensure tables have a primary key, preferably \`id bigint primary key generated always as identity\`.
            - Ensure Row Level Security (RLS) is enabled on tables (\`enable row level security\`). If creating a table snippet, mention the need for policies.
            - Prefer defining foreign key references within the \`CREATE TABLE\` statement if adding one.
            - If adding a foreign key, consider suggesting a separate \`CREATE INDEX\` statement for the foreign key column(s) to optimize joins.
            - **Foreign Tables**: If the edit involves foreign tables, they should ideally be in a schema named \`private\`. Mention the security risk (RLS bypass) and link: https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0017_foreign_table_in_api.
        - **Views**:
            - Include \`with (security_invoker=on)\` immediately after \`CREATE VIEW view_name\` if creating/modifying a view definition.
            - **Materialized Views**: If the edit involves materialized views, they should ideally be in the \`private\` schema. Mention the security risk (RLS bypass) and link: https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0016_materialized_view_in_api.
        - **Extensions**:
            - Extensions should be installed in the \`extensions\` schema or a dedicated schema, **never** in \`public\`.
        - **RLS Policies**:
            - When modifying policies using functions from the \`auth\` schema (like \`auth.uid()\`):
                - Wrap the function call in parentheses: \`(select auth.uid())\`.
                - Use \`CREATE POLICY\` or \`ALTER POLICY\`. Policy names should be descriptive text in double quotes.
                - Specify roles using \`TO authenticated\` or \`TO anon\`.
                - Use separate policies for SELECT, INSERT, UPDATE, DELETE actions. Do not use \`FOR ALL\`.
                - Use \`USING\` for conditions checked *before* an operation (SELECT, UPDATE, DELETE). Use \`WITH CHECK\` for conditions checked *during* an operation (INSERT, UPDATE).
                    - SELECT: \`USING (condition)\`
                    - INSERT: \`WITH CHECK (condition)\`
                    - UPDATE: \`USING (condition) WITH CHECK (condition)\`
                    - DELETE: \`USING (condition)\`
                - Prefer \`PERMISSIVE\` policies unless \`RESTRICTIVE\` is explicitly needed.
                - Leverage Supabase helper functions: \`auth.uid()\`, \`auth.jwt()\` (\`app_metadata\` for authz, \`user_metadata\` is user-updatable).
                - **Performance**: Indexes on columns used in RLS policies are crucial. Minimize joins within policy definitions.
        - **Functions**:
            - Use \`security definer\` for functions returning type \`trigger\`; otherwise, default to \`security invoker\`.
            - Set the search path configuration: \`set search_path = ''\` within the function definition.
            - Use \`create or replace function\` when possible if modifying a function signature.

        # Tool Usage:
        - Before generating the final SQL modification:
          - Use \`getSchemaTables\` if you need to retrieve information about tables in relevant schemas (usually \`public\`, potentially \`auth\` if user-related).
          - Use \`getRlsKnowledge\` if you need to retrieve existing RLS policies and guidelines if the edit concerns policies.
        - The available database schema names are: ${schemas}

        # Response Format:
        - Your response MUST be ONLY the modified SQL text intended to replace the user's selection.
        - Do NOT include explanations, markdown formatting, or code blocks. NO MATTER WHAT.
        - Ensure the modified text integrates naturally with the surrounding code provided (\`textBeforeCursor\` and \`textAfterCursor\`).
        - Avoid duplicating SQL keywords already present in the surrounding context.
        - If there is no surrounding context, ensure your response is a complete, valid SQL statement.

        REMEMBER: ONLY OUTPUT THE SQL MODIFICATION.
      `,
      messages: [
        {
          role: 'user',
          content: source`
            You are helping me edit some pgsql code.
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
            
            Modify the selected text now:
          `,
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

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper
