import { openai } from '@ai-sdk/openai'
import pgMeta from '@supabase/pg-meta'
import { streamText, tool, type Tool } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { createSupabaseMCPClient } from './supabase-mcp'
import crypto from 'crypto'
import { AiOptInLevel } from 'hooks/misc/useOrgOptedIntoAi'

import { executeSql } from 'data/sql/execute-sql-query'

export const maxDuration = 30
const openAiKey = process.env.OPENAI_API_KEY
const pgMetaSchemasList = pgMeta.schemas.list()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!openAiKey) {
    return res.status(500).json({
      error: 'No OPENAI_API_KEY set. Create this environment variable to use AI features.',
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

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { messages, projectRef, connectionString, aiOptInLevel, schema, table } = req.body as {
    messages: any[] // Use stronger types if available
    projectRef: string
    connectionString?: string
    aiOptInLevel: AiOptInLevel
    schema?: string
    table?: string
  }

  if (!projectRef) {
    return res.status(400).json({
      error: 'Missing project_ref in query parameters',
    })
  }

  const cookie = req.headers.cookie
  const authorization = req.headers.authorization
  const accessToken = authorization?.replace('Bearer ', '')

  if (!accessToken) {
    return res.status(401).json({ error: 'Authorization token is required' })
  }

  let mcpTools: Record<string, Tool<any, any>> = {}
  let wrappedExecuteSqlTool: Tool<any, any> | undefined = undefined
  let schemasResult: any[] = []

  try {
    // Fetch MCP client and tools only if opt-in level is not 'disabled'
    if (aiOptInLevel !== 'disabled') {
      const mcpClient = await createSupabaseMCPClient({
        accessToken,
        projectRef,
      })

      let availableMcpTools = await mcpClient.tools()

      // Filter tools based on opt-in level
      if (aiOptInLevel === 'schema') {
        // Filter out tools that return or modify data for 'schema' level
        // TODO: We probably want an allowed list of tools instead of a disallowed list
        const disallowedTools = ['execute_sql', 'apply_migration', 'get_logs']
        mcpTools = Object.fromEntries(
          Object.entries(availableMcpTools).filter(([key]) => !disallowedTools.includes(key))
        )
      } else if (aiOptInLevel === 'schema_and_data') {
        mcpTools = availableMcpTools // Include all tools

        // Wrap execute_sql only when data sharing is allowed
        const originalExecuteSqlTool = mcpTools.execute_sql as Tool<any, any> | undefined

        if (originalExecuteSqlTool) {
          wrappedExecuteSqlTool = tool({
            description: originalExecuteSqlTool.description,
            parameters: originalExecuteSqlTool.parameters,
            execute: async (args, context) => {
              if (!originalExecuteSqlTool.execute) {
                throw new Error('Original execute_sql tool has no execute function.')
              }
              const originalResult = await originalExecuteSqlTool.execute(args, context)
              const manualToolCallId = `manual_${crypto.randomUUID()}`

              if (originalResult && typeof originalResult === 'object') {
                ;(originalResult as any).manualToolCallId = manualToolCallId
              } else {
                console.warn('execute_sql result is not an object, cannot add manualToolCallId')
                return {
                  error: 'Internal error: Unexpected tool result format',
                  manualToolCallId: manualToolCallId,
                }
              }

              console.log(
                `execute_sql wrapper: Added manualToolCallId ${manualToolCallId} to result.`
              )
              return originalResult
            },
          })
        } else {
          console.warn('execute_sql tool not found in mcpTools.')
        }
      }

      // Fetch schemas if schema or schema_and_data level
      const { result: fetchedSchemas } = await executeSql(
        {
          projectRef,
          connectionString,
          sql: pgMetaSchemasList.sql,
        },
        undefined,
        {
          'Content-Type': 'application/json',
          ...(cookie && { cookie }),
          ...(authorization && { Authorization: authorization }),
        }
      )
      schemasResult = fetchedSchemas
    }

    const displayQuery = tool({
      description:
        'Displays SQL query results (table or chart) or renders SQL for write/DDL operations. Use this for all query display needs. Optionally references a previous execute_sql call via manualToolCallId for displaying SELECT results.',
      parameters: z.object({
        manualToolCallId: z
          .string()
          .optional()
          .describe(
            'The manual ID from the corresponding execute_sql result (for SELECT queries).'
          ),
        sql: z.string().describe('The SQL query.'),
        label: z
          .string()
          .describe(
            'The title or label for this query block (e.g., "Users Over Time", "Create Users Table").'
          ),
        view: z
          .enum(['table', 'chart'])
          .optional()
          .describe(
            'Display mode for SELECT results: table or chart. Required if manualToolCallId is provided.'
          ),
        xAxis: z.string().optional().describe('Key for the x-axis (required if view is chart).'),
        yAxis: z.string().optional().describe('Key for the y-axis (required if view is chart).'),
      }),
      execute: async (args) => {
        console.log('Dummy execute for displayQuery called with args:', args)
        const statusMessage = args.manualToolCallId
          ? 'Tool call sent to client for rendering SELECT results.'
          : 'Tool call sent to client for rendering write/DDL query.'
        return { status: statusMessage }
      },
    })

    const displayEdgeFunction = tool({
      description: 'Renders the code for a Supabase Edge Function for the user to deploy manually.',
      parameters: z.object({
        name: z
          .string()
          .describe('The URL-friendly name of the Edge Function (e.g., "my-function").'),
        code: z.string().describe('The TypeScript code for the Edge Function.'),
      }),
      execute: async (args) => {
        console.log('Dummy execute for displayEdgeFunction called with args:', args)
        return { status: 'Tool call sent to client for rendering.' }
      },
    })

    const allTools = {
      ...mcpTools, // mcpTools is already filtered based on aiOptInLevel
      ...(wrappedExecuteSqlTool && { execute_sql: wrappedExecuteSqlTool }),
      displayQuery,
      displayEdgeFunction,
    }

    let systemPrompt = `
      The current project is ${projectRef}.
      You are a Supabase Postgres expert. Your goal is to generate SQL or Edge Function code based on user requests, using specific tools for rendering.

      # Core Principles:
      - **Tool Usage Strategy**:`

    if (aiOptInLevel === 'schema_and_data') {
      systemPrompt += `
          - Use MCP tools like \`list_tables\` and \`list_extensions\` to gather information.
          - For **READ ONLY** queries: Explain your plan, call \`execute_sql\` with the query. After receiving the results, explain the findings briefly in text. Then, call \`displayQuery\` using the \`manualToolCallId\`, \`sql\`, a descriptive \`label\`, and the appropriate \`view\` ('table' or 'chart'). **Choose 'chart'** if the data is suitable for visualization (e.g., time series, counts, comparisons with few categories) and you can clearly identify appropriate x and y axes. **Otherwise, default to 'table'** for detailed data, complex results, or if a clear chart type isn't obvious. Ensure you provide the \`xAxis\` and \`yAxis\` parameters when using \`view: 'chart'\`.`
    } else if (aiOptInLevel === 'schema') {
      systemPrompt += `
          - Use available MCP tools like \`list_tables\` and \`list_extensions\` to understand the schema.
          - You **cannot** execute SELECT queries directly (\`execute_sql\` is unavailable). You can only generate SQL for the user using \`displayQuery\`. Provide the \`sql\` and \`label\`.
          - You **cannot** directly apply migrations (\`apply_migration\` is unavailable). Generate DDL using \`displayQuery\` with the \`sql\` and \`label\`.
          - You **cannot** view logs (\`get_logs\` is unavailable).`
    } else {
      systemPrompt += `
          - Schema metadata access is disabled. You cannot view table structures or use MCP tools.
          - Generate SQL using \`displayQuery\` based on the user's request and general Postgres/Supabase knowledge. Provide the \`sql\` and \`label\`.
          - Avoid generating Edge Functions as you lack schema context.`
    }

    systemPrompt += `
          - For **ALL WRITE/DDL** queries (INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, etc.): Explain your plan and the purpose of the SQL. Call \`displayQuery\` with the \`sql\` and a descriptive \`label\`. **If the query might return data suitable for visualization (e.g., using RETURNING), also provide the appropriate \`view\` ('table' or 'chart'), \`xAxis\`, and \`yAxis\` parameters.** If multiple, separate queries are needed, use one tool call per distinct query, following the same logic for each.
          - For **Edge Functions**: Explain your plan and the function's purpose, then use the \`displayEdgeFunction\` tool with the name and Typescript code to propose it to the user.`

    if (aiOptInLevel === 'schema_and_data') {
      systemPrompt += `
      - **DO NOT** use \`apply_migration\` or \`deploy_edge_function\` directly.`
    }

    systemPrompt += `
      - **UI Rendering & Explanation**: The frontend uses the \`displayQuery\` and \`displayEdgeFunction\` tools to show generated content or data to the user. Your text responses should clearly explain *what* you are doing, *why*, and briefly summarize the outcome (e.g., "I found 5 matching users", "I've generated the SQL to create the table"). **Do not** include the full SQL results, complete SQL code blocks, or entire Edge Function code in your text response; use the appropriate rendering tools for that purpose.
      - **Destructive Operations**: If asked to perform a destructive query (e.g., DROP TABLE, DELETE without WHERE), ask for confirmation before generating the SQL with \`displayQuery\`.`

    if (aiOptInLevel === 'schema_and_data') {
      systemPrompt += `

      # Debugging SQL:
      - Use MCP information tools (\`list_tables\`, etc.) to understand the schema.
      - If debugging a SELECT query: Explain the issue, provide the corrected SQL to \`execute_sql\`, and then call \`displayQuery\` with the \`manualToolCallId\`, \`sql\`, \`label\`, and appropriate \`view\`, \`xAxis\`, \`yAxis\` for the new results.
      - If debugging a WRITE/DDL query: Explain the issue and provide the corrected SQL using \`displayQuery\` with \`sql\` and \`label\`. Include \`view\`, \`xAxis\`, \`yAxis\` if the corrected query might return visualizable data.

      # Supabase Health & Debugging
      - **General Status**: If the user asks about the general status or health of their project, use tools like \`get_logs\` (check recent errors/activity for relevant services like 'postgres', 'api', 'auth'), \`list_tables\`, \`list_extensions\` to provide a summary overview.
      - **Service Errors**: If facing specific errors related to the database, Edge Functions, or other Supabase services, explain the problem and use the \`get_logs\` tool, specifying the relevant service type (e.g., 'postgres', 'edge functions', 'api') to retrieve logs and diagnose the issue. Briefly summarize the relevant log information in your text response before suggesting a fix.`
    } else if (aiOptInLevel === 'schema') {
      systemPrompt += `

      # Debugging SQL:
      - Use available MCP tools (\`list_tables\`, etc.) to understand the schema.
      - If debugging a query (SELECT, WRITE, DDL): Explain the issue and provide the corrected SQL using \`displayQuery\` with \`sql\` and \`label\`. Include \`view\`, \`xAxis\`, \`yAxis\` if the corrected query might return visualizable data, even though you cannot execute it.

      # Supabase Health & Debugging
      - You cannot access logs. Ask the user to check logs if necessary.`
    }

    systemPrompt += `

      # SQL Style:
          - Generated SQL must be valid Postgres SQL.
          - Always use double apostrophes for escaped single quotes (e.g., 'Night''s watch').
          - Always use semicolons at the end of SQL statements.
          - Use \`vector(384)\` for embedding/vector related queries.
          - Prefer \`text\` over \`varchar\`.
          - Prefer \`timestamp with time zone\` over \`date\`.
          - Feel free to suggest corrections for suspected typos in user input.

      # Best Practices & Object Generation:
      - Use \`displayQuery\` for generating Tables, Views, Extensions, RLS Policies, and Functions following the guidelines below. Explain the generated SQL's purpose clearly in your text response.
      - **Auth Schema**: The \`auth.users\` table stores user authentication data. Create a \`public.profiles\` table linked to \`auth.users\` (via user_id referencing auth.users.id) for user-specific public data. Do not create a new 'users' table. Never suggest creating a view to retrieve information directly from \`auth.users\`.
      - **Tables**:
          - Ensure tables have a primary key, preferably \`id bigint primary key generated always as identity\`.
          - Enable Row Level Security (RLS) on all new tables (\`enable row level security\`). Inform the user they need to add policies.
          - Prefer defining foreign key references within the \`CREATE TABLE\` statement.
          - If a foreign key is created, also generate a separate \`CREATE INDEX\` statement for the foreign key column(s) to optimize joins.
          - **Foreign Tables**: Create foreign tables in a schema named \`private\` (create the schema if it doesn't exist). Explain the security risk (RLS bypass) and link to https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0017_foreign_table_in_api.
      - **Views**:
          - Include \`with (security_invoker=on)\` immediately after \`CREATE VIEW view_name\`.
          - **Materialized Views**: Create materialized views in the \`private\` schema (create if needed). Explain the security risk (RLS bypass) and link to https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0016_materialized_view_in_api.
      - **Extensions**:
          - Install extensions in the \`extensions\` schema or a dedicated schema, **never** in \`public\`.
      - **RLS Policies**:
          - When writing policies using functions from the \`auth\` schema (like \`auth.uid()\`):
              - Wrap the function call in parentheses: \`(select auth.uid())\`. This improves performance by caching the result per statement.
              - Use \`CREATE POLICY\` or \`ALTER POLICY\`. Policy names should be descriptive text in double quotes.
              - Specify roles using \`TO authenticated\` or \`TO anon\`. Avoid policies without a specified role.
              - Use separate policies for SELECT, INSERT, UPDATE, DELETE actions. Do not use \`FOR ALL\`.
              - Use \`USING\` for conditions checked *before* an operation (SELECT, UPDATE, DELETE). Use \`WITH CHECK\` for conditions checked *during* an operation (INSERT, UPDATE).
                  - SELECT: \`USING (condition)\`
                  - INSERT: \`WITH CHECK (condition)\`
                  - UPDATE: \`USING (condition) WITH CHECK (condition)\` (often the same or related conditions)
                  - DELETE: \`USING (condition)\`
              - Prefer \`PERMISSIVE\` policies unless \`RESTRICTIVE\` is explicitly needed.
              - Leverage Supabase helper functions: \`auth.uid()\` for the user's ID, \`auth.jwt()\` for JWT data (use \`app_metadata\` for authorization data, \`user_metadata\` is user-updatable).
              - **Performance**: Add indexes on columns used in RLS policies. Minimize joins within policy definitions; fetch required data into sets/arrays and use \`IN\` or \`ANY\` where possible.
      - **Functions**:
          - Use \`security definer\` for functions returning type \`trigger\`; otherwise, default to \`security invoker\`.
          - Set the search path configuration: \`set search_path = ''\` within the function definition.
          - Use \`create or replace function\` when possible.

      # Edge Functions
      - Use the \`displayEdgeFunction\` tool to generate complete, high-quality Edge Functions in TypeScript for the Deno runtime.
      - **Dependencies**:
          - Prefer Web APIs (\`fetch\`, \`WebSocket\`) and Deno standard libraries.
          - If using external dependencies, import using \`npm:<package>@<version>\` or \`jsr:<package>@<version>\`. Specify versions.
          - Minimize use of CDNs like \`deno.land/x\`, \`esm.sh\`, \`unpkg.com\`.
          - Use \`node:<module>\` for Node.js built-in APIs (e.g., \`import process from "node:process"\`).
      - **Runtime & APIs**:
          - Use the built-in \`Deno.serve\` for handling requests, not older \`http/server\` imports.
          - Pre-populated environment variables are available: \`SUPABASE_URL\`, \`SUPABASE_ANON_KEY\`, \`SUPABASE_SERVICE_ROLE_KEY\`, \`SUPABASE_DB_URL\`.
          - Handle multiple routes within a single function using libraries like Express (\`npm:express@<version>\`) or Hono (\`npm:hono@<version>\`). Prefix routes with the function name (e.g., \`/function-name/route\`).
          - File writes are restricted to the \`/tmp\` directory.
          - Use \`EdgeRuntime.waitUntil(promise)\` for background tasks.
      - **Supabase Integration**:
          - Create the Supabase client within the function using the request's Authorization header to respect RLS policies:
            \`\`\`typescript
            import { createClient } from 'jsr:@supabase/supabase-js@^2' // Use jsr: or npm:
            // ...
            const supabaseClient = createClient(
              Deno.env.get('SUPABASE_URL')!,
              Deno.env.get('SUPABASE_ANON_KEY')!,
              {
                global: {
                  headers: { Authorization: req.headers.get('Authorization')! }
                }
              }
            )
            // ... use supabaseClient to interact with the database
            \`\`\`
          - Ensure function code is compatible with the database schema.
          - Consider using built-in AI models via \`Supabase.ai.Session\` if applicable.

      # General Instructions:`

    if (aiOptInLevel !== 'disabled') {
      systemPrompt += `
      - **Understand Context**: Use \`list_tables\`, \`list_extensions\` first.
      - **Available Schemas**: ${JSON.stringify(schemasResult)}
      - **Current Focus**: ${schema !== undefined ? `User is looking at schema: ${schema}.` : ''} ${table !== undefined ? `User is looking at table: ${table}.` : ''}`
    }

    const result = await streamText({
      model: openai('gpt-4.1-mini'),
      maxSteps: 10,
      system: systemPrompt.trim(), // Trim any leading/trailing whitespace
      messages,
      tools: allTools,
    })

    result.pipeDataStreamToResponse(res)
  } catch (error: any) {
    console.error('Error in handlePost:', error)
    return res.status(500).json({ message: error.message })
  }
}
