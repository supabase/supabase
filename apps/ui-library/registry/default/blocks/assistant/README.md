# AI Assistant Block

An AI-powered chatbot widget with database query capabilities using the Model Context Protocol (MCP).

## Features

- Fixed bottom-right chat widget with minimize/expand controls
- Natural language database queries using AI
- Row Level Security (RLS) enforcement
- Streaming responses with real-time feedback
- Tool execution visualization
- Secure SQL query execution with validation
- Rich AI SDK Elements (Conversation, Messages, Prompt Input, Model Selector, Suggestions, Sources, Reasoning) for a modern assistant UX

## Architecture

The block consists of four main pieces that work together end to end:

1. **Assistant Widget** (`components/assistant-widget.tsx`): React component providing the chat UI, built with AI SDK Elements
2. **Chat Edge Function** (`supabase/functions/chat/`): Supabase Edge Function that streams chat completions, bootstraps the MCP client, and is invoked directly from the browser
3. **Hono MCP Server** (`supabase/functions/mcp-server/`): Supabase Edge Function exposing MCP tools (e.g. `queryDatabase`) via the `mcp-lite` transport
4. **Supabase Client Utilities** (`lib/supabase/`): Server and browser helpers for authenticated Supabase access

## Prerequisites

- Supabase project with authentication enabled
- OpenAI API key (or another MCP-compatible LLM provider)
- Supabase CLI installed
- Docker (for Supabase local dev)
- Node.js and npm/pnpm installed
- Deno 2.x (Supabase Edge Functions runtime)

## Setup Instructions

### 1. Install the Block

```bash
npx shadcn@latest add https://ui.supabase.com/r/assistant
```

### 2. Install UI + AI SDK Elements

The assistant widget depends on both core UI primitives and the AI SDK Element registry entries. Install them (or make sure they already exist in your project) using the shadcn CLI:

```bash
npx shadcn@latest add button input scroll-area \
  @ai-elements/conversation \
  @ai-elements/message \
  @ai-elements/prompt-input \
  @ai-elements/model-selector \
  @ai-elements/reasoning \
  @ai-elements/sources \
  @ai-elements/suggestion
```

Each AI Element ships ready-to-style JSX + Tailwind so you can compose advanced assistant surfaces without rebuilding primitives.

### 3. Set Up Environment Variables

Add the following to your `.env.local`:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Chat Edge Function (used by the browser)
NEXT_PUBLIC_ASSISTANT_CHAT_URL=https://your-project.supabase.co/functions/v1/chat

# MCP Server URL (consumed by the edge functions)
MCP_SERVER_URL=https://your-project.supabase.co/functions/v1/mcp-server
```

### 4. Build and Deploy the Hono MCP Server

Supabase Edge Functions route every request to `/<function-name>/*`, so the MCP server needs the "two Hono apps" pattern outlined in the [Supabase mcp-lite guide](https://supabase.com/docs/guides/functions/examples/mcp-server-mcp-lite):

1. **Scaffold (optional):** `npm create mcp-lite@latest` and choose the **Supabase Edge Functions (MCP server)** template to bootstrap `supabase/functions/mcp-server`.
2. **Import map:** Ensure `supabase/functions/mcp-server/deno.json` includes the dependencies the block uses:

```jsonc
{
  "compilerOptions": {
    "lib": ["deno.window", "deno.ns"],
    "strict": true
  },
  "imports": {
    "hono": "npm:hono@^4.6.14",
    "mcp-lite": "npm:mcp-lite@0.8.2",
    "zod": "npm:zod@^4.1.12",
    "@supabase/supabase-js": "npm:@supabase/supabase-js@^2.48.0"
  }
}
```

3. **Hono entrypoint:** Update `supabase/functions/mcp-server/index.ts` to mount the MCP transport behind `/mcp-server/mcp`:

```ts
import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const mcp = new McpServer({
  name: "supabase-assistant-mcp-server",
  version: "1.0.0",
  schemaAdapter: (schema) => z.toJSONSchema(schema as z.ZodType),
});

// ...define queryDatabase and other tools that create an authenticated Supabase client

const transport = new StreamableHttpTransport();
const httpHandler = transport.bind(mcp);

const mcpApp = new Hono();
mcpApp.get("/", (c) =>
  c.json({
    message: "MCP Server on Supabase Edge Functions",
    endpoints: { mcp: "/mcp", health: "/health" },
  })
);
mcpApp.get("/health", (c) => c.json({ status: "ok" }));
mcpApp.all("/mcp", (c) => httpHandler(c.req.raw));

const app = new Hono();
app.route("/mcp-server", mcpApp);

Deno.serve((req) => app.fetch(req));
```

This structure keeps Supabase's root handler (`/mcp-server`) separate from your MCP protocol endpoints while still serving the `StreamableHttpTransport`.

4. **Serve locally:**

```bash
supabase start
supabase functions serve --no-verify-jwt mcp-server
```

Your MCP endpoint will be available at `http://localhost:54321/functions/v1/mcp-server/mcp`.

5. **Deploy globally:**

```bash
supabase functions deploy --no-verify-jwt mcp-server
```

### 5. Build and Deploy the Chat Edge Function

The chat edge function (located at `supabase/functions/chat/`) replaces the `/api/chat` Next.js route and is what the browser calls directly.

1. Confirm the provided `deno.json` contains the AI + MCP dependencies required by the block.
2. Run `supabase start` if you haven't already.
3. Serve **both** edge functions in separate terminals so the MCP server and chat handler run side by side:

```bash
supabase functions serve --env-file .env.local --no-verify-jwt mcp-server
supabase functions serve --env-file .env.local --no-verify-jwt chat
```

4. For local development, set `NEXT_PUBLIC_ASSISTANT_CHAT_URL=http://127.0.0.1:54321/functions/v1/chat`. In production, point it to `https://<project>.supabase.co/functions/v1/chat`.
5. Ensure `MCP_SERVER_URL` is available to the chat function (either via the Supabase dashboard or an `.env` file passed to `supabase functions serve`) so it can reach the MCP server endpoint.

### 6. Add the Widget to Your App

```tsx
import { AssistantWidget } from "@/components/assistant-widget";

export default function Layout({ children }) {
  return (
    <div>
      {children}
      <AssistantWidget />
    </div>
  );
}
```

## Local Development & Testing

- Start Supabase locally: `supabase start`
- Serve and iterate on the MCP function: `supabase functions serve --no-verify-jwt mcp-server`
- Run the chat edge function alongside it: `supabase functions serve --no-verify-jwt chat`
- Test with Claude Code: `claude mcp add my-mcp-server -t http http://localhost:54321/functions/v1/mcp-server/mcp`
- Inspect traffic using the MCP inspector: `npx @modelcontextprotocol/inspector`
- When everything looks good, deploy via `supabase functions deploy --no-verify-jwt mcp-server`

## Widget UI with AI SDK Elements

The block ships with AI SDK Element primitives (Conversation, Message, PromptInput, ModelSelector, etc.) located under `components/ai-elements`. Combine them to build an opinionated assistant surface, like the following demo:

```tsx
"use client";

import {
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
} from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { MessageResponse } from "@/components/ai-elements/message";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import type { ToolUIPart } from "ai";
import { CheckIcon, GlobeIcon, MicIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { useCallback, useState } from "react";
import { toast } from "sonner";

// ...rest of the Example component from the block's source (see components/assistant-widget.tsx)
```

The complete example (available in this block) demonstrates:

- Branching messages with sources, reasoning traces, and MCP tool output
- Scrollable conversation history with streaming responses
- Prompt composer with attachments, microphone toggle, and model selector
- Reusable suggestions to quickly seed the assistant

Use the snippet as a starting point for your own assistant surface or trim it down for a lighter footprint.

## Usage

### For End Users

1. Click the chat icon in the bottom-right corner to open the assistant
2. Type natural language queries about your data
3. The AI will translate your questions into SQL and execute them via the `queryDatabase` MCP tool
4. Results are displayed in the chat interface with tool execution feedback
5. Minimize or close the widget as needed

### Example Queries

- "Show me all my tasks"
- "How many orders did I place last month?"
- "List my recent transactions"
- "What's the total revenue from my sales?"

## Security Considerations

### Query Builder Approach

The MCP server uses Supabase's query builder for safe data access:

- Uses the `queryDatabase` tool with structured parameters (table, filters, orderBy, limit)
- No raw SQL injection risks
- Queries execute with the authenticated user's context
- All operations go through Supabase's security layer

### Row Level Security (RLS)

All queries respect Supabase RLS policies:

- The authenticated user's token is passed to the MCP server
- Queries run with user context
- Users can only access data allowed by RLS policies

### Authentication

- Local development uses `--no-verify-jwt` for speed; production deployments should enforce authentication per the [MCP authorization spec](https://modelcontextprotocol.io/spec)
- Never expose production data without adding proper auth and auditing

#### MCP middleware helpers

`mcp-lite` ships with Hono-style middleware so you can enforce authentication, logging, and rate limiting *before* a tool executes. This keeps your auth logic centralized instead of duplicating it inside each tool handler:

```ts
// Logging
mcp.use(async ({ req }, next) => {
  const start = Date.now();
  await next();
  console.log(`${req.method} took ${Date.now() - start}ms`);
});

// Authentication
mcp.use(async (ctx, next) => {
  const token = ctx.req.header("Authorization");
  if (!token) throw new Error("Unauthorized");

  const user = await validateToken(token);
  ctx.state.user = user;
  await next();
});

// Rate limiting (example)
mcp.use(async (ctx, next) => {
  const userId = ctx.state.user?.id;
  if (await isRateLimited(userId)) {
    throw new Error("Rate limit exceeded");
  }
  await next();
});
```

Inside your tools you can then rely on `ctx.state.user` (or whatever you set) rather than re-validating headers manually. See the [`mcp-lite` middleware docs](https://github.com/modelcontextprotocol/mcp-lite#middleware) for more patterns.

### Best Practices

1. **Enable RLS on all tables:** Ensure all tables have RLS enabled
2. **Create appropriate policies:** Define policies that match your security requirements
3. **Monitor edge function logs:** Check logs for suspicious queries or errors
4. **Rate limiting:** Consider adding rate limiting to prevent abuse
5. **Query complexity:** Set statement timeouts in Postgres to prevent long-running queries
6. **Validate tool inputs:** Sanitize and validate every argument received by MCP tools

## Customization

### Change the AI Model

Edit `supabase/functions/chat/index.ts`:

```ts
const result = await streamText({
  model: openai("gpt-4o"), // Change to another model (OpenAI, Anthropic, Google, etc.)
  // ... rest of config
});
```

### Customize the System Prompt

Edit the `system` parameter in `supabase/functions/chat/index.ts` to change the assistant's behavior.

### Style the Widget

AI SDK Elements are standard React components, so you can:

- Override Tailwind classes
- Reorder or remove sections (e.g., hide the model selector)
- Inject custom suggestion lists or streaming loaders

### Add More MCP Tools

Extend the MCP server with additional tools in `supabase/functions/mcp-server/index.ts` following the same Hono pattern:

```ts
mcp.tool("myCustomTool", {
  description: "Description of what this tool does",
  inputSchema: z.object({
    param1: z.string(),
    param2: z.number().optional(),
  }),
  handler: async (args, { req }) => {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Tool implementation
    return {
      content: [{ type: "text", text: "Result" }],
    };
  },
});
```

## Troubleshooting

### "Unauthorized" Error

- Ensure the user is authenticated before using the widget
- Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set correctly
- Verify the Authorization header is forwarded to the MCP server

### "Query execution failed"

- Verify the table exists and is accessible
- Check that RLS policies allow the user to access the data
- Verify the column names in filters are correct
- Check edge function logs: `supabase functions logs mcp-server`

### "Function not found" or 404

- Verify the chat function is deployed at `/functions/v1/chat` and `NEXT_PUBLIC_ASSISTANT_CHAT_URL` points to it
- Make sure the Hono app is mounted at `/mcp-server`
- Confirm you are calling `/functions/v1/mcp-server/mcp`
- Restart `supabase functions serve` after changing import maps
