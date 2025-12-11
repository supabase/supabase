// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPTransport } from "@hono/mcp";
import { Hono } from "hono";
import { z } from "zod";

// Change this to your function name
const functionName = "simple-mcp-server";
const app = new Hono().basePath(`/${functionName}`);

// Create your MCP server
const server = new McpServer({
  name: "simple-mcp-server",
  version: "1.0.0",
});

// Register a simple addition tool
server.registerTool("add", {
  title: "Addition Tool",
  description: "Add two numbers together",
  inputSchema: { a: z.number(), b: z.number() },
}, ({ a, b }) => ({
  content: [{ type: "text", text: String(a + b) }],
}));

// Handle MCP requests
app.all("/mcp", async (c) => {
  const transport = new StreamableHTTPTransport();
  await server.connect(transport);
  return transport.handleRequest(c);
});

Deno.serve(app.fetch);
