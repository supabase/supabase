// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
//
// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// We create two Hono instances:
// 1. `app` is the root handler for the Supabase Edge Function (must match the function name, e.g. /mcp-server)
// 2. `mcpApp` handles the MCP protocol and health endpoints, mounted under the function route
// This pattern is required because Supabase Edge Functions route all requests to /<function-name>/*

const mcp = new McpServer({
  name: "supabase-assistant-mcp-server",
  version: "1.0.0",
  schemaAdapter: (schema: unknown) => z.toJSONSchema(schema as z.ZodType),
});

// Define the queryDatabase tool
mcp.tool("queryDatabase", {
  description:
    "Query a table in the Supabase database with Row Level Security (RLS) applied. Use this to fetch data from tables with optional filters and options.",
  inputSchema: z.object({
    table: z
      .string()
      .describe("The name of the table to query"),
    columns: z
      .string()
      .optional()
      .describe("Columns to select (comma-separated). Defaults to '*' for all columns."),
    filters: z
      .array(
        z.object({
          column: z.string().describe("The column to filter on"),
          operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "in", "is"]).describe("The filter operator"),
          value: z.any().describe("The value to filter by"),
        })
      )
      .optional()
      .describe("Array of filter conditions to apply"),
    limit: z
      .number()
      .optional()
      .describe("Maximum number of rows to return"),
    orderBy: z
      .object({
        column: z.string().describe("Column to order by"),
        ascending: z.boolean().optional().describe("Sort order (default: true)"),
      })
      .optional()
      .describe("Ordering options"),
    explanation: z
      .string()
      .optional()
      .describe("Optional explanation of what the query does"),
  }),
  handler: async (
    args: {
      table: string;
      columns?: string;
      filters?: Array<{ column: string; operator: string; value: any }>;
      limit?: number;
      orderBy?: { column: string; ascending?: boolean };
      explanation?: string;
    },
    { req }: { req: Request }
  ) => {
    try {
      // Create authenticated Supabase client with user context
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
          global: {
            headers: { Authorization: req.headers.get("Authorization")! },
          },
        }
      );

      // Verify user is authenticated
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Unauthorized: Missing authentication token",
              }),
            },
          ],
        };
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: authError } =
        await supabaseClient.auth.getUser(token);

      if (authError || !userData?.user) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: "Unauthorized: Invalid authentication token",
              }),
            },
          ],
        };
      }

      // Build the query using Supabase query builder
      let query = supabaseClient.from(args.table).select(args.columns || "*");

      // Apply filters if provided
      if (args.filters && args.filters.length > 0) {
        for (const filter of args.filters) {
          switch (filter.operator) {
            case "eq":
              query = query.eq(filter.column, filter.value);
              break;
            case "neq":
              query = query.neq(filter.column, filter.value);
              break;
            case "gt":
              query = query.gt(filter.column, filter.value);
              break;
            case "gte":
              query = query.gte(filter.column, filter.value);
              break;
            case "lt":
              query = query.lt(filter.column, filter.value);
              break;
            case "lte":
              query = query.lte(filter.column, filter.value);
              break;
            case "like":
              query = query.like(filter.column, filter.value);
              break;
            case "ilike":
              query = query.ilike(filter.column, filter.value);
              break;
            case "in":
              query = query.in(filter.column, filter.value);
              break;
            case "is":
              query = query.is(filter.column, filter.value);
              break;
          }
        }
      }

      // Apply ordering if provided
      if (args.orderBy) {
        query = query.order(args.orderBy.column, {
          ascending: args.orderBy.ascending ?? true,
        });
      }

      // Apply limit if provided
      if (args.limit) {
        query = query.limit(args.limit);
      }

      // Execute the query
      const { data, error } = await query;

      if (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Query execution failed: ${error.message}`,
                table: args.table,
                explanation: args.explanation,
              }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              table: args.table,
              explanation: args.explanation,
              results: data,
              rowCount: Array.isArray(data) ? data.length : 0,
              user: userData.user.email,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Unexpected error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            }),
          },
        ],
      };
    }
  },
});

const transport = new StreamableHttpTransport();
const httpHandler = transport.bind(mcp);

const app = new Hono();
const mcpApp = new Hono();

mcpApp.get("/", (c) => {
  return c.json({
    message: "MCP Server on Supabase Edge Functions",
    endpoints: {
      mcp: "/mcp",
      health: "/health",
    },
  });
});

mcpApp.get("/health", (c) => {
  return c.json({
    message: "Service is up and running",
  });
});

mcpApp.all("/mcp", async (c) => {
  const response = await httpHandler(c.req.raw);
  return response;
});

// Mount the MCP app at /mcp-server (matches the function name)
app.route("/mcp-server", mcpApp);

export default app;

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/mcp-server/mcp' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"jsonrpc":"2.0","method":"tools/list","id":1}'

  3. Test the health endpoint:

  curl 'http://127.0.0.1:54321/functions/v1/mcp-server/health'

*/
