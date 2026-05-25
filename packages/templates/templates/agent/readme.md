## Overview

Build persistent AI agents on Supabase with session history, long-term memory, and a typed tool-calling endpoint. This template adds the schema and Edge Function plumbing for multi-turn sessions, vector-backed memory, and an `agent-tools` handler you can call from chat UIs, background workers, or MCP-style orchestrators.

## What's included

| Asset         | Path                                      | Purpose                                    |
| ------------- | ----------------------------------------- | ------------------------------------------ |
| Schema        | `supabase/schemas/agent.sql`              | Sessions, messages, memory tables, and RLS |
| Edge Function | `supabase/functions/agent-tools/index.ts` | HTTP handler for tool invocation           |

### Sessions and messages

Each session belongs to a user (via `auth.uid()`). Messages are appended in order so you can replay conversation history or stream partial updates from the client.

### Memory and recall

Memory rows can store arbitrary JSON payloads. When combined with **ai-vector-search** or **ai-automatic-embeddings**, embeddings enable similarity search over past context before the model runs.

### Tool endpoint

The `agent-tools` function validates requests, runs registered tools, and returns structured results your agent loop can feed back into the model.

```ts
// Example: call the tool endpoint from your app
const { data, error } = await supabase.functions.invoke('agent-tools', {
  body: { sessionId, tool: 'search_docs', input: { query: 'RLS policies' } },
})
```

## Dependencies

**Required**

- `database` — base Supabase project config
- `api` — REST/GraphQL surface for client access
- `auth` — user-scoped sessions and RLS
- `functions` — Edge Functions runtime

**Optional**

- `ai-vector-search` — pgvector similarity over memory embeddings
- `ai-automatic-embeddings` — keep embeddings in sync via triggers

## Getting started

1. Add this template (and its required dependencies) to your composition.
2. Run `supabase db reset` or apply migrations locally to create agent tables.
3. Deploy Edge Functions: `supabase functions deploy agent-tools`.
4. From your app, create a session row, append messages, and invoke `agent-tools` as tools are selected by your model.

For production, review RLS policies in `agent.sql` and restrict the service role to server-side agent loops only.
