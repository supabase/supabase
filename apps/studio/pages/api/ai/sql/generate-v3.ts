import { openai } from '@ai-sdk/openai'
import pgMeta from '@supabase/pg-meta'
import { generateText, streamText, tool, type Tool, type ToolExecutionOptions } from 'ai'
import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { createSupabaseMCPClient } from './supabase-mcp'
import crypto from 'crypto'

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
  const { messages, projectRef, connectionString, includeSchemaMetadata, schema, table } = req.body

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

  let mcpClient
  try {
    mcpClient = await createSupabaseMCPClient(accessToken)
    const mcpTools = await mcpClient.tools()

    // --- Wrap execute_sql to add manual ID to top-level result --- START
    const originalExecuteSqlTool = mcpTools.execute_sql as Tool<any, any> | undefined
    let wrappedExecuteSqlTool: Tool<any, any> | undefined = undefined

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

          console.log(`execute_sql wrapper: Added manualToolCallId ${manualToolCallId} to result.`)
          return originalResult
        },
      })
    } else {
      console.warn('execute_sql tool not found in mcpTools.')
    }
    // --- Wrap execute_sql --- END

    // --- Define Client-Side Tools --- START
    const displayBlock = tool({
      description:
        'Displays results (table or chart) in the UI by referencing a previous execute_sql call using its manual ID.',
      parameters: z.object({
        manualToolCallId: z
          .string()
          .describe('The manual ID from the corresponding execute_sql result.'),
        sql: z.string().describe('The original SQL query that was executed.'),
        label: z
          .string()
          .describe(
            'The title or label for this query block (e.g., "Users Over Time", "Create Users Table").'
          ),
        view: z.enum(['table', 'chart']).describe('Display mode: table or chart.'),
        xAxis: z.string().optional().describe('Key for the x-axis (required if type is chart).'),
        yAxis: z.string().optional().describe('Key for the y-axis (required if type is chart).'),
      }),
      execute: async (args) => {
        console.log('Dummy execute for displayBlock called with args:', args)
        return { status: 'Tool call sent to client for rendering.' }
      },
    })

    const renderWriteQuery = tool({
      description:
        'Renders SQL for write operations (INSERT, UPDATE, DELETE) or DDL (CREATE, ALTER, DROP) for the user to run manually. Use this for all non-SELECT queries.',
      parameters: z.object({
        sql: z.string().describe('The SQL query to render.'),
        label: z
          .string()
          .describe(
            'The title or label for this query block (e.g., "Insert New User", "Alter Orders Table").'
          ),
      }),
      execute: async (args) => {
        console.log('Dummy execute for displayBlock called with args:', args)
        return { status: 'Tool call sent to client for rendering.' }
      },
    })

    const renderEdgeFunction = tool({
      description: 'Renders the code for a Supabase Edge Function for the user to deploy manually.',
      parameters: z.object({
        name: z
          .string()
          .describe('The URL-friendly name of the Edge Function (e.g., "my-function").'),
        code: z.string().describe('The TypeScript code for the Edge Function.'),
      }),
      execute: async (args) => {
        console.log('Dummy execute for displayBlock called with args:', args)
        return { status: 'Tool call sent to client for rendering.' }
      },
    })
    // --- Define Client-Side Tools --- END

    console.log('MCP Tools available: ', Object.keys(mcpTools).join(', '))

    const allTools = {
      ...mcpTools,
      ...(wrappedExecuteSqlTool && { execute_sql: wrappedExecuteSqlTool }),
      displayBlock,
      renderWriteQuery,
      renderEdgeFunction,
    }

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
            ...(cookie && { cookie }),
            ...(authorization && { Authorization: authorization }),
          }
        )
      : { result: [] }

    const systemPrompt = `
      The current project is ${projectRef}.
      You are a Supabase Postgres expert connected via the Supabase Management Control Plane (MCP). Your goal is to generate SQL or Edge Function code based on user requests, using specific tools for rendering.
  
      # Core Principles:
      - Use MCP tools like \`list_tables\` and \`list_extensions\` to gather information.
      - **Tool Usage Strategy**:
          - For **SELECT** queries: Explain your plan, call \`execute_sql\` with the query. After receiving the results, explain the findings briefly in text. Then, call \`displayBlock\` using the \`manualToolCallId\`, \`sql\`, and a descriptive \`label\` to display the full results. **Choose 'chart'** if the data is suitable for visualization (e.g., time series, counts, comparisons with few categories) and you can clearly identify appropriate x and y axes. **Otherwise, default to 'table'** for detailed data, complex results, or if a clear chart type isn't obvious. Ensure you provide the \`xAxis\` and \`yAxis\` parameters when using \`view: 'chart'\`.
          - For **ALL WRITE/DDL** queries (INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, etc.): Explain your plan and the purpose of the SQL. If multiple, separate queries are needed (e.g., creating a table and then related RLS policies), explain the first query, call \`renderWriteQuery\` for it with the \`sql\` and a descriptive \`label\`, then explain the second query, call \`renderWriteQuery\` for it with its \`sql\` and \`label\`, and so on. Use one tool call per distinct query. (These always use a table view implicitly).
          - For **Edge Functions**: Explain your plan and the function's purpose, then use the \`renderEdgeFunction\` tool with the name and Typescript code to propose it to the user.
      - **DO NOT** use \`apply_migration\` or \`deploy_edge_function\` directly.
      - **UI Rendering & Explanation**: The frontend uses the \`displayBlock\`, \`renderWriteQuery\`, and \`renderEdgeFunction\` tools to show generated content or data to the user. Your text responses should clearly explain *what* you are doing, *why*, and briefly summarize the outcome (e.g., "I found 5 matching users", "I've generated the SQL to create the table"). **Do not** include the full SQL results, complete SQL code blocks, or entire Edge Function code in your text response; use the appropriate rendering tools for that purpose.
  
      # Debugging SQL:
      - Use MCP information tools (\`list_tables\`, etc.) to understand the schema.
      - If debugging a SELECT query: Explain the issue, provide the corrected SQL to \`execute_sql\`, and then call \`displayBlock\` with the new results.
      - If debugging a WRITE/DDL query: Explain the issue and provide the corrected SQL using \`renderWriteQuery\`.
  
      # SQL Style:
          - Generated SQL must be valid Postgres SQL.
          - Always use double apostrophes for escaped single quotes (e.g., 'Night''s watch').
          - Always use semicolons at the end of SQL statements.
          - Use \`vector(384)\` for embedding/vector related queries.
          - Prefer \`text\` over \`varchar\`.
          - Prefer \`timestamp with time zone\` over \`date\`.
  
      # Best Practices & Object Generation:
      - Follow previous best practices for Auth schema, indexes, etc.
      - Use \`renderWriteQuery\` for generating Tables, Views, Extensions, RLS Policies, Functions, following the guidelines mentioned previously (RLS, security invoker, private schema for foreign tables/materialized views, etc.). Explain the generated SQL's purpose in your text response.
  
      # General Instructions:
      - **Understand Context**: Use \`list_tables\`, \`list_extensions\` first.
      - **Available Schemas**: ${schemas}
      - **Current Focus**: ${schema !== undefined && includeSchemaMetadata ? `User is looking at schema: ${schema}.` : ''} ${table !== undefined && includeSchemaMetadata ? `User is looking at table: ${table}.` : ''}
      `

    const result = await streamText({
      model: openai('gpt-4.1-mini'),
      maxSteps: 10,
      system: systemPrompt,
      messages,
      tools: allTools,
    })

    result.pipeDataStreamToResponse(res)
  } catch (error: any) {
    console.log('error', error)
    return res.status(500).json({ message: error.message })
  }
}
