---
id: 'ai-tools-byo-mcp'
title: 'Deploy MCP servers'
description: 'Build and deploy remote MCP servers on Supabase Edge Functions'
---

Build and deploy [Model Context Protocol](https://modelcontextprotocol.io/specification/2025-11-25) (MCP) servers on Supabase using [Edge Functions](/docs/guides/functions).

<Admonition type="note">

This guide covers MCP servers that do not require authentication. Auth support for MCP on Edge Functions is coming soon.

</Admonition>

## Prerequisites

Before you begin, make sure you have:

- [Docker](https://docs.docker.com/get-docker/) or a compatible runtime installed and running (required for local development)
- [Deno](https://deno.land/) installed (Supabase Edge Functions runtime)
- [Supabase CLI](/docs/guides/local-development) installed and authenticated
- [Node.js 20 or later](https://nodejs.org/) (required by Supabase CLI)

## Deploy your MCP server

### Step 1: Create a new project

Start by creating a new Supabase project:

```bash
mkdir my-mcp-server
cd my-mcp-server
supabase init
```

<Admonition type="note">

After this step, you should have a project directory with a `supabase` folder containing `config.toml` and an empty `functions` directory.

</Admonition>

---

### Step 2: Create the MCP server function

Create a new Edge Function for your MCP server:

```bash
supabase functions new mcp
```

<Admonition type="tip">

This tutorial uses the [official MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) with the `WebStandardStreamableHTTPServerTransport`, but you can use any MCP framework that's compatible with the [Edge Runtime](/docs/guides/functions), such as [mcp-lite](https://github.com/fiberplane/mcp-lite) or [mcp-handler](https://github.com/vercel/mcp-handler).

</Admonition>

Replace the contents of `supabase/functions/mcp/index.ts` with:

```ts name=supabase/functions/mcp/index.ts
// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js'
import { Hono } from 'npm:hono@^4.9.7'
import { z } from 'npm:zod@^4.1.13'

// Create Hono app
const app = new Hono()

// Create your MCP server
const server = new McpServer({
  name: 'mcp',
  version: '0.1.0',
})

// Register a simple addition tool
server.registerTool(
  'add',
  {
    title: 'Addition Tool',
    description: 'Add two numbers together',
    inputSchema: { a: z.number(), b: z.number() },
  },
  ({ a, b }) => ({
    content: [{ type: 'text', text: String(a + b) }],
  })
)

// Handle MCP requests
app.all('*', async (c) => {
  const transport = new WebStandardStreamableHTTPServerTransport()
  await server.connect(transport)
  return transport.handleRequest(c.req.raw)
})

Deno.serve(app.fetch)
```

<Admonition type="note">

After this step, you should have a new file at `supabase/functions/mcp/index.ts`.

</Admonition>

<Admonition type="caution">

Within Edge Functions, paths are prefixed with the function name. If your function is named something other than `mcp`, configure Hono with a base path: `new Hono().basePath('/your-function-name')`.

</Admonition>

---

### Step 3: Test locally

Start the Supabase local development stack:

```bash
supabase start
```

In a separate terminal, serve your function:

```bash
supabase functions serve --no-verify-jwt mcp
```

Your MCP server is now running at:

```
http://localhost:54321/functions/v1/mcp
```

<Admonition type="note">

The `--no-verify-jwt` flag disables JWT verification at the Edge Function layer so your MCP server can accept unauthenticated requests. Authenticated MCP support is coming soon.

</Admonition>

#### Test with curl

You can also test your MCP server directly with curl. Call the `add` tool:

```bash
curl -X POST 'http://localhost:54321/functions/v1/mcp' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "add",
      "arguments": {
        "a": 5,
        "b": 3
      }
    }
  }'
```

<Admonition type="note">

The MCP Streamable HTTP transport requires the `Accept: application/json, text/event-stream` header to indicate the client supports both JSON and Server-Sent Events responses.

</Admonition>

**Expected response:**

The response uses Server-Sent Events (SSE) format:

```
event: message
data: {"result":{"content":[{"type":"text","text":"8"}]},"jsonrpc":"2.0","id":1}
```

#### Test with MCP Inspector

Test your server with the official [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npx -y @modelcontextprotocol/inspector
```

Use the local endpoint `http://localhost:54321/functions/v1/mcp` in the inspector UI to explore available tools and test them interactively.

<Admonition type="note">

After this step, you should have your MCP server running locally and be able to test the `add` tool in the MCP Inspector.

</Admonition>

### Step 4: Deploy to production

When you're ready to deploy, link your project and deploy the function:

```bash
supabase link --project-ref <your-project-ref>
supabase functions deploy --no-verify-jwt mcp
```

Your MCP server will be available at:

```
https://<your-project-ref>.supabase.co/functions/v1/mcp
```

Update your MCP client configuration to use the production URL.

<Admonition type="note">

After this step, you have a fully deployed MCP server accessible from anywhere. You can test it using the MCP Inspector with your production URL.

</Admonition>

## Examples

You can find ready-to-use MCP server implementations here:

- [Simple MCP server](https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/mcp/simple-mcp-server) - Basic unauthenticated example

## Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Supabase Edge Functions](/docs/guides/functions)
- [OAuth 2.1 Server](/docs/guides/auth/oauth-server)
- [MCP Authentication](/docs/guides/auth/oauth-server/mcp-authentication)
- [Building MCP servers with mcp-lite](/docs/guides/functions/examples/mcp-server-mcp-lite) - Alternative lightweight framework
