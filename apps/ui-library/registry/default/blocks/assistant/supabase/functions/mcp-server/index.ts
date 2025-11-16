// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
//
// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";
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

// Temporary placeholder tool while wiring up the rest of the MCP server.
mcp.tool("queryDatabase", {
  description:
    "Example placeholder tool that just echoes a string back to the caller.",
  inputSchema: z.object({
    message: z
      .string()
      .default("Hello from the Supabase MCP server!")
      .describe("Optional message you would like the tool to return"),
  }),
  handler: async ({ message }: { message: string }) => {
    return {
      content: [
        {
          type: "text",
          text: `Example tool response: ${message}`,
        },
      ],
    };
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
