# MCP server template

Scaffolds a Model Context Protocol server as a Supabase Edge Function. The function speaks JSON-RPC over HTTP and exposes tools that are declared through a small registry.

## Includes

- `supabase/functions/mcp-server/index.ts` — JSON-RPC entrypoint handling `initialize`, `tools/list`, and `tools/call`
- `supabase/functions/mcp-server/registry.ts` — `registerTool` API and tool typings
- `supabase/functions/mcp-server/tools/` — one file per tool, imported from `tools/index.ts`

## Adding a tool

1. Create a new file under `supabase/functions/mcp-server/tools/`, e.g. `tools/my-tool.ts`.
2. Call `registerTool({ name, description, inputSchema, handler })` at module scope.
3. Import the new file from `tools/index.ts` so it self-registers at boot.

## Dependencies

Requires **database**, **api**, and **functions**.
