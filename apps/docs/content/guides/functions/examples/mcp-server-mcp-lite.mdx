---
id: 'examples-mcp-server-mcp-lite'
title: 'Building an MCP Server with mcp-lite'
description: 'Build and deploy a Model Context Protocol (MCP) server on Supabase Edge Functions using mcp-lite.'
---

The [Model Context Protocol](https://modelcontextprotocol.io/introduction) (MCP) enables Large Language Models (LLMs) to interact with external tools and data sources. With `mcp-lite`, you can build lightweight MCP servers that run on Supabase Edge Functions, giving your AI assistants the ability to execute custom tools at the edge.

This guide shows you how to scaffold, develop, and deploy an MCP server using mcp-lite on Supabase Edge Functions.

## What is mcp-lite?

[mcp-lite](https://github.com/fiberplane/mcp-lite) is a lightweight, zero-dependency TypeScript framework for building MCP servers. It works everywhere the Fetch API is available, including Node, Bun, Cloudflare Workers, Deno, and Supabase Edge Functions.

## Why Supabase Edge Functions + mcp-lite?

This combination offers several advantages:

- **Zero cold starts**: Edge Functions stay warm for fast responses
- **Global distribution**: Deploy once and run everywhere
- **Direct database access**: Connect directly to your Supabase Postgres
- **Minimal footprint**: mcp-lite has zero runtime dependencies
- **Full type safety**: TypeScript support in Deno
- **Simple deployment**: One command to production

## Prerequisites

You need:

- [Docker](https://docs.docker.com/get-docker/) (to run Supabase locally)
- [Deno](https://deno.land/) (Supabase Edge Functions runtime)
- [Supabase CLI](/docs/guides/cli/getting-started)

## Create a new MCP server

Starting with `create-mcp-lite@0.3.0`, you can scaffold a complete MCP server that runs on Supabase Edge Functions:

```bash
npm create mcp-lite@latest
```

When prompted, select **Supabase Edge Functions (MCP server)** from the template options.

The template creates a focused structure for Edge Functions development:

```
my-mcp-server/
├── supabase/
│   ├── config.toml                    # Minimal Supabase config (Edge Functions only)
│   └── functions/
│       └── mcp-server/
│           ├── index.ts               # MCP server implementation
│           └── deno.json              # Deno imports and configuration
├── package.json
└── tsconfig.json
```

## Understanding the project structure

### Minimal config.toml

The template includes a minimal `config.toml` that runs only Edge Functions - no database, storage, or Studio UI. This keeps your local setup lightweight:

```toml
# Minimal config for running only Edge Functions (no DB, storage, or studio)
project_id = "starter-mcp-supabase"

[api]
enabled = true
port = 54321

[edge_runtime]
enabled = true
policy = "per_worker"
deno_version = 2
```

You can always add more services as needed.

### Two Hono apps pattern

The template uses a specific pattern required by Supabase Edge Functions:

```ts
// Root handler - matches the function name
const app = new Hono()

// MCP protocol handler
const mcpApp = new Hono()

mcpApp.get('/', (c) => {
  return c.json({
    message: 'MCP Server on Supabase Edge Functions',
    endpoints: {
      mcp: '/mcp',
      health: '/health',
    },
  })
})

mcpApp.all('/mcp', async (c) => {
  const response = await httpHandler(c.req.raw)
  return response
})

// Mount at /mcp-server (the function name)
app.route('/mcp-server', mcpApp)
```

This is required because Supabase routes all requests to `/<function-name>/*`. The outer `app` handles the function-level routing, while `mcpApp` handles your actual MCP endpoints.

### Deno import maps

The template uses Deno's import maps in `deno.json` to manage dependencies:

```json
{
  "compilerOptions": {
    "lib": ["deno.window", "deno.ns"],
    "strict": true
  },
  "imports": {
    "hono": "npm:hono@^4.6.14",
    "mcp-lite": "npm:mcp-lite@0.8.2",
    "zod": "npm:zod@^4.1.12"
  }
}
```

This gives you npm package access while staying in the Deno ecosystem.

## Local development

### Start Supabase

Navigate to your project directory and start Supabase services:

```bash
supabase start
```

### Serve your function

In a separate terminal, serve your MCP function locally:

```bash
supabase functions serve --no-verify-jwt mcp-server
```

Or use the npm script (which runs the same command):

```bash
npm run dev
```

Your MCP server is available at:

```
http://localhost:54321/functions/v1/mcp-server/mcp
```

### Testing your server

Test the MCP server by adding it to your Claude Code, Claude Desktop, Cursor, or your preferred MCP client.

Using Claude Code:

```bash
claude mcp add my-mcp-server -t http http://localhost:54321/functions/v1/mcp-server/mcp
```

You can also test it using the MCP inspector:

```bash
npx @modelcontextprotocol/inspector
```

Then add the MCP endpoint URL in the inspector UI.

## How it works

The MCP server setup is straightforward:

```ts
import { McpServer, StreamableHttpTransport } from 'mcp-lite'
import { z } from 'zod'

// Create MCP server instance
const mcp = new McpServer({
  name: 'starter-mcp-supabase-server',
  version: '1.0.0',
  schemaAdapter: (schema) => z.toJSONSchema(schema as z.ZodType),
})

// Define a tool
mcp.tool('sum', {
  description: 'Adds two numbers together',
  inputSchema: z.object({
    a: z.number(),
    b: z.number(),
  }),
  handler: (args: { a: number; b: number }) => ({
    content: [{ type: 'text', text: String(args.a + args.b) }],
  }),
})

// Bind to HTTP transport
const transport = new StreamableHttpTransport()
const httpHandler = transport.bind(mcp)
```

## Adding more tools

Extend your MCP server by adding tools directly to the `mcp` instance. Here's an example of adding a database search tool:

```ts
mcp.tool('searchDatabase', {
  description: 'Search your Supabase database',
  inputSchema: z.object({
    table: z.string(),
    query: z.string(),
  }),
  handler: async (args) => {
    // Access Supabase client here
    // const { data } = await supabase.from(args.table).select('*')
    return {
      content: [{ type: 'text', text: `Searching ${args.table}...` }],
    }
  },
})
```

You can add tools that:

- Query your Supabase database
- Access Supabase Storage for file operations
- Call external APIs
- Process data with custom logic
- Integrate with other Supabase features

## Deploy to production

When ready, deploy to Supabase's global edge network:

```bash
supabase functions deploy --no-verify-jwt mcp-server
```

Or use the npm script:

```bash
npm run deploy
```

Your MCP server will be live at:

```
https://your-project-ref.supabase.co/functions/v1/mcp-server/mcp
```

## Authentication considerations

<Admonition type="caution">

The template uses `--no-verify-jwt` for quick development. This means authentication is not enforced by Supabase's JWT layer.

For production, you should implement authentication at the MCP server level following the [MCP Authorization specification](https://modelcontextprotocol.io/specification/draft/basic/authorization). This gives you control over who can access your MCP tools.

</Admonition>

### Security best practices

When deploying MCP servers:

- **Don't expose sensitive data**: Use the server in development environments with non-production data
- **Implement authentication**: Add proper authentication for production deployments
- **Validate inputs**: Always validate and sanitize tool inputs
- **Limit tool scope**: Only expose tools that are necessary for your use case
- **Monitor usage**: Track tool calls and monitor for unusual activity

For more security guidance, see the [MCP security guide](/guides/getting-started/mcp#security-risks).

## What's next

With your MCP server running on Supabase Edge Functions, you can:

- Connect it to your Supabase database for data-driven tools
- Use Supabase Auth to secure your endpoints
- Access Supabase Storage for file operations
- Deploy to multiple regions automatically
- Scale to handle production traffic
- Integrate with AI assistants like Claude, Cursor, or custom MCP clients

## Resources

- [mcp-lite on GitHub](https://github.com/fiberplane/mcp-lite)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [Supabase Edge Functions Docs](/guides/functions)
- [Deno Runtime Documentation](https://deno.land/)
- [Fiberplane tutorial](https://blog.fiberplane.com/blog/mcp-lite-supabase-edge-functions/)
