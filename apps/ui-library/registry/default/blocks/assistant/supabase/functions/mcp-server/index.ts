import { Hono } from 'hono'
import { McpServer, StreamableHttpTransport } from 'mcp-lite'
import { z } from 'zod'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// We create two Hono instances:
// 1. `app` is the root handler for the Supabase Edge Function (must match the function name, e.g. /mcp-server)
// 2. `mcpApp` handles the MCP protocol and health endpoints, mounted under the function route
// This pattern is required because Supabase Edge Functions route all requests to /<function-name>/*

const mcp = new McpServer({
  name: 'supabase-assistant-mcp-server',
  version: '1.0.0',
  schemaAdapter: (schema: unknown) => z.toJSONSchema(schema as z.ZodType),
})

// Auth Header Management
// StreamableHttpTransport doesn't expose HTTP request headers to the MCP context (ctx.request.headers is undefined).
// We use a module-level variable to pass the auth header from the Hono handler to MCP middleware.
// This is safe because Supabase Edge Functions process requests sequentially, not concurrently.
// The header is set before processing and cleared in a finally block to prevent leaks.
// Alternative: Use InMemorySessionAdapter with custom session context, but adds unnecessary complexity.
let currentAuthHeader: string | null = null

// Helper function to create authenticated Supabase client
function createAuthenticatedClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  )
}

// Middleware to inject auth header into MCP context state
mcp.use(async (ctx: any, next: any) => {
  // Try to get auth header from ctx.request.headers (doesn't work with StreamableHttpTransport)
  // Fall back to the stored currentAuthHeader set by the Hono handler
  const authHeader = ctx.request?.headers?.get?.('Authorization') || currentAuthHeader

  if (authHeader) {
    // Make auth header available to all tool handlers via ctx.state
    ctx.state.authHeader = authHeader
  }

  await next()
})

mcp.tool('getUserTasks', {
  description: 'Fetch tasks for the authenticated user with optional filtering by due date and title search.',
  inputSchema: z.object({
    due_date: z
      .string()
      .optional()
      .describe('Optional due date filter in YYYY-MM-DD format. Returns tasks with this exact due date.'),
    title_search: z
      .string()
      .optional()
      .describe('Optional title search term. Returns tasks where the title contains this text (case-insensitive).'),
  }),
  handler: async ({ due_date, title_search }: { due_date?: string; title_search?: string }, ctx: any) => {
    const authHeader = ctx.state?.authHeader

    if (!authHeader) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Authentication required to fetch tasks.',
          },
        ],
        isError: true,
      }
    }

    try {
      const supabase = createAuthenticatedClient(authHeader)

      let query = supabase
        .from('tasks')
        .select('id, created_at, title, assignee_id, due_at')
        .order('due_at', { ascending: true, nullsFirst: false })

      // Apply due_date filter if provided
      if (due_date) {
        query = query.eq('due_at', due_date)
      }

      // Apply title_search filter if provided
      if (title_search) {
        query = query.ilike('title', `%${title_search}%`)
      }

      const { data, error } = await query

      if (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error fetching tasks: ${error.message}`,
            },
          ],
          isError: true,
        }
      }

      const taskCount = data?.length || 0
      const tasksText = data && taskCount > 0
        ? data.map((task) => {
            const dueDate = task.due_at ? `Due: ${task.due_at}` : 'No due date'
            return `- [${task.id}] ${task.title || 'Untitled'} (${dueDate})`
          }).join('\n')
        : 'No tasks found.'

      return {
        content: [
          {
            type: 'text',
            text: `Found ${taskCount} task(s):\n\n${tasksText}`,
          },
        ],
      }
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      }
    }
  },
})

mcp.tool('createTask', {
  description: 'Create a task for the authenticated user. Optionally provide a due date (YYYY-MM-DD).',
  inputSchema: z.object({
    title: z
      .string()
      .min(1, 'Title must not be empty')
      .describe('Task title to display in the list.'),
    due_date: z
      .string()
      .optional()
      .describe('Optional due date in YYYY-MM-DD format.'),
  }),
  handler: async ({ title, due_date }: { title: string; due_date?: string }, ctx: any) => {
    const authHeader = ctx.state?.authHeader

    if (!authHeader) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: Authentication required to create tasks.',
          },
        ],
        isError: true,
      }
    }

    try {
      const supabase = createAuthenticatedClient(authHeader)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        return {
          content: [
            {
              type: 'text',
              text: `Error retrieving authenticated user: ${userError?.message ?? 'Not found'}`,
            },
          ],
          isError: true,
        }
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title,
          due_at: due_date ?? null,
          assignee_id: user.id,
        })
        .select('id, title, due_at, assignee_id')
        .single()

      if (error || !data) {
        return {
          content: [
            {
              type: 'text',
              text: `Error creating task: ${error?.message ?? 'Unknown error'}`,
            },
          ],
          isError: true,
        }
      }

      const dueDateText = data.due_at ? `Due ${data.due_at}` : 'No due date set'

      return {
        content: [
          {
            type: 'text',
            text: `Created task [${data.id}] "${data.title}" for user ${data.assignee_id}. ${dueDateText}.`,
          },
        ],
      }
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      }
    }
  },
})

const transport = new StreamableHttpTransport()
const httpHandler = transport.bind(mcp)

const app = new Hono()
const mcpApp = new Hono()

// Handle OPTIONS requests for CORS
mcpApp.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  await next()
})

mcpApp.get('/', (c) => {
  return c.json({
    message: 'MCP Server on Supabase Edge Functions',
    endpoints: {
      mcp: '/mcp',
      health: '/health',
    },
  })
})

mcpApp.get('/health', (c) => {
  return c.json({
    message: 'Service is up and running',
  })
})

// Handle both POST (for regular MCP requests) and GET (for SSE connections)
const handleMcpRequest = async (c: any) => {
  // Validate Authorization header at the Hono level
  // (StreamableHttpTransport doesn't expose HTTP headers to MCP context)
  const authHeader = c.req.header('Authorization')

  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  // Store auth header so MCP middleware can inject it into ctx.state for tool handlers
  currentAuthHeader = authHeader

  try {
    const response = await httpHandler(c.req.raw)
    return response
  } finally {
    // Clean up auth header after request completes to prevent leaks
    currentAuthHeader = null
  }
}

mcpApp.post('/mcp', handleMcpRequest)
mcpApp.get('/mcp', handleMcpRequest)

// Mount the MCP app at /mcp-server (matches the function name)
app.route('/mcp-server', mcpApp)

export default app
