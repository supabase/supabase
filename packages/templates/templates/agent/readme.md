# Agent template

Build persistent AI agents on Supabase with a streaming chat endpoint, session history, long-term memory, and MCP tool access. The generated `agent-chat` Edge Function uses the AI SDK to stream model responses back to clients while persisting user and assistant messages in Postgres.

The agent can call tools from connected MCP servers. If you also add the **mcp-server** template, the agent can use that local Edge Function MCP server as one of its tool sources.

## What's included

| Asset         | Path                                      | Purpose                                      |
| ------------- | ----------------------------------------- | -------------------------------------------- |
| Schema        | `supabase/schemas/agent.sql`              | Sessions, messages, memory, MCP servers, RLS |
| Edge Function | `supabase/functions/agent-chat/index.ts`  | Streaming AI SDK chat endpoint               |

### Sessions and messages

Each session belongs to a user. `agent-chat` creates a session when `sessionId` is omitted, appends the user message, streams the model response, then persists the assistant response.

### Memory and recall

Memory rows can store arbitrary JSON payloads. When combined with **ai-vector-search** or **ai-automatic-embeddings**, embeddings enable similarity search over past context before the model runs.

### MCP tools

`agent-chat` discovers tools from MCP servers and exposes them to the AI SDK model call. By default, it attempts to connect to the local `mcp-server` Edge Function at:

```text
${SUPABASE_URL}/functions/v1/mcp-server
```

You can also add rows to `public.agent_mcp_servers`:

```sql
insert into public.agent_mcp_servers (name, url)
values ('project', 'https://<project-ref>.supabase.co/functions/v1/mcp-server');
```

or pass request-scoped MCP servers:

```ts
const response = await fetch(`${supabaseUrl}/functions/v1/agent-chat`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sessionId,
    message: 'List the public tables in my project',
    mcpServers: [
      {
        name: 'project',
        url: `${supabaseUrl}/functions/v1/mcp-server`,
      },
    ],
  }),
})
```

Tool names are namespaced as `<server>_<tool>`, so a `list_tables` tool from the local MCP server is exposed to the model as `project_list_tables`.

## Dependencies

**Required**

- `database` — base Supabase project config
- `api` — REST/GraphQL surface for client access
- `auth` — user-scoped sessions and RLS
- `functions` — Edge Functions runtime

**Optional**

- `ai-vector-search` — pgvector similarity over memory embeddings
- `ai-automatic-embeddings` — keep embeddings in sync via triggers
- `mcp-server` — local Edge Function MCP server the agent can call for project tools

## Getting started

1. Add this template (and its required dependencies) to your composition.
2. Run `supabase db reset` or apply migrations locally to create agent tables.
3. Set model provider secrets, for example `supabase secrets set OPENAI_API_KEY=...`.
4. Deploy Edge Functions: `supabase functions deploy agent-chat`.
5. From your app, POST `{ message, sessionId? }` to `agent-chat` and read the streamed text response.

For production, review RLS policies in `agent.sql`, restrict service-role usage to server-side agent loops, and avoid storing long-lived third-party MCP secrets directly in `agent_mcp_servers.headers`.
