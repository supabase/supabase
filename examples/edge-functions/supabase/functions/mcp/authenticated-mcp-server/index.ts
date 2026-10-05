// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { createMcpHandler, McpServer } from '@modelcontextprotocol/server'
import { pipeline } from '@supabase/middleware'
import { withOAuthProtectedResource, withSupabase } from '@supabase/server'
import { z } from 'zod'

import type { Database } from './database.types.ts'

Deno.serve(
  pipeline(
    // 1. OAuth discovery for MCP clients, 2. verify the user's token and scope a client to them
    [withOAuthProtectedResource(), withSupabase<Database>({ auth: 'user' })],
    async (req, { supabase }) => {
      // A fresh server per request: Edge Functions are stateless
      const handler = createMcpHandler(() => {
        const server = new McpServer({ name: 'todos', version: '0.1.0' })

        server.registerTool(
          'list_todos',
          {
            description: 'List the todos of the signed-in user',
            inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(20) }),
            annotations: { readOnlyHint: true },
          },
          async ({ limit }) => {
            // RLS scopes this query to the signed-in user
            const { data, error } = await supabase
              .from('todos')
              .select('id, title, done')
              .order('created_at', { ascending: false })
              .limit(limit)
            if (error) throw new Error(error.message)
            return { content: [{ type: 'text', text: JSON.stringify(data) }] }
          }
        )

        server.registerTool(
          'create_todo',
          {
            description: 'Create a todo for the signed-in user',
            inputSchema: z.object({ title: z.string().min(1).max(200) }),
          },
          async ({ title }) => {
            const { data, error } = await supabase.from('todos').insert({ title }).select().single()
            if (error) throw new Error(error.message)
            return { content: [{ type: 'text', text: JSON.stringify(data) }] }
          }
        )

        return server
      })

      return handler.fetch(req)
    }
  )
)
