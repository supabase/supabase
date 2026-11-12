# mcp-apps

Supabase surfaces packaged as [MCP Apps](https://github.com/modelcontextprotocol/ext-apps): the project browser, focused SQL/logs/row panels and inline query blocks that open inside Claude, ChatGPT, Codex and other MCP Apps hosts. Parts of the same views render natively in Studio.

## How the pieces fit

| Where                  | What                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/mcp`         | The Supabase MCP server. Owns the wire contracts, published as `@supabase/mcp-server-supabase/apps` (zod schemas for entities, chart display, panel launches, `dataOperations`, workspace tool inputs, resource URIs and the document shell). Registers the launch and app-only data tools and serves one `ui://supabase/*` document per surface. Leaves the tools out for clients whose capabilities say they cannot render MCP Apps. |
| `packages/surfaces`    | Host-agnostic React views built on `ui` with Studio's semantic tokens. Views never fetch or call a host: data comes in as props (`Loadable<T>` for reads), actions go out as callbacks, and the SQL editor is passed in. `surfaces/explorer` is Studio's Explorer query editor chrome, used by both Studio and this app.                                                                                                               |
| `apps/mcp-apps` (here) | The MCP Apps adapter and screens. `src/host` turns an `App` connection into services (tool calls → `DataPort`, messages and model context → `AgentHost`, host theme → Studio tokens). `src/query` is this app's query editor, `src/shell` the screens, `src/entries` one entry per surface. `host/` is a local MCP Apps host for end-to-end testing.                                                                                   |
| `apps/studio`          | Its Explorer `QueryEditor` renders through `QueryEditorFrame` and uses the shared chart.                                                                                                                                                                                                                                                                                                                                               |

`pnpm build` writes one script and one stylesheet per surface to `dist/v1` (fonts and images inlined, no further chunks) plus a `manifest.json` of hashes:

| Files                  | Resource                       | Opened by                                                                                                                                            |
| ---------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projects.{js,css}`    | `ui://supabase/projects-v1`    | `open_projects` (global entrypoint), `open_workspace` (thread entrypoint)                                                                            |
| `panel.{js,css}`       | `ui://supabase/panel-v1`       | `open_sql_panel`, `open_logs_panel`, `open_row_panel`, `open_explorer_panel`, `open_project_home_panel`, `open_issues_panel`, `open_notebooks_panel` |
| `query-block.{js,css}` | `ui://supabase/query-block-v1` | `show_query_block`                                                                                                                                   |

The server renders each document itself (`renderSurfaceDocument`) and either:

- **links** a deployed build (`--apps-url https://…/v1`, production). The resource declares the origin in `_meta.ui.csp.resourceDomains`, so the host lets the view load it. UI fixes ship with a deploy of this app, without a server release.
- **inlines** the files into the document (`--apps-dir dist/v1`, local development, or `--apps-url … --apps-inline` for hosts that block external assets).

### Versioning

`v1` is `SURFACE_VERSION`, and it appears twice: in each resource URI (`ui://supabase/panel-v1`) and in the asset path (`dist/v1/panel.js`). Hosts cache documents by URI, and published tool metadata points at URIs, so both move together.

- Most changes keep the version: UI fixes, new optional fields, new panel views a surface already handles. Deploy them as usual.
- Bump it when older servers, hosts or surfaces would misunderstand the change, such as a removed or renamed field, or a changed meaning.
- When bumping, keep the previous version working for as long as published metadata may point at it: the server keeps registering the old URIs, and the old asset path stays deployed.

Deploying: `vercel.json` builds `dist` and serves `/v1/*` with CORS (views load module scripts from an opaque sandbox origin) and a short cache. Route it under `supabase.com/mcp-apps` the way www routes other zones, then start the server with `--apps-url https://supabase.com/mcp-apps/v1`.

## Develop the views

```sh
pnpm --filter mcp-apps dev
```

Open http://localhost:5174 for a gallery of every surface on fixture data (no host, agent actions disabled). Each frame also opens on its own, e.g. `/surfaces/panel.html?preview=logs`.

```sh
pnpm --filter mcp-apps test
pnpm --filter mcp-apps typecheck
pnpm --filter mcp-apps build          # or build:watch
```

## Test end to end, locally

`pnpm dev:e2e` runs the whole stack on your machine: the surface build in watch mode, the Supabase MCP server's local HTTP server (`:3111`), and a local MCP Apps host (`:5180`) with a chat, tool calls and views rendered through the MCP Apps bridge, much like Claude or ChatGPT. Nothing leaves your machine except calls to the Supabase API and to the model you configure.

1. In the `supabase/mcp` checkout on the matching branch (locally the `../mcp-surfaces` worktree), install and build: `pnpm install && pnpm build`. This repository links that package (see `package.json`) until a release publishes `@supabase/mcp-server-supabase/apps`.
2. Copy `.env.host.example` to `.env.host` and fill it in. With no `HOST_MODEL`, run tools by hand from the composer.
3. Start everything:

   ```sh
   pnpm --filter mcp-apps dev:e2e                     # your Supabase account (SUPABASE_ACCESS_TOKEN)
   pnpm --filter mcp-apps dev:e2e --platform=mock     # a mocked platform with sample projects, no account
   ```

4. Open http://localhost:5180. The header buttons are the server's entrypoints (Supabase, Database workspace). Ask the agent, or use **Run a tool without a model**, which also lists the tools a mounted view registers for the agent (`open_query`, `set_query_draft`…).

What the host does like production hosts:

- Renders each view in an opaque-origin sandboxed frame under the CSP its resource declares, so undeclared asset origins fail here first.
- Lets views call only tools the server marks visible to apps, and gives the model only tools visible to the model.
- Sends tool input and the full result (including `_meta`) to the view, takes `ui/message` as a user message and `ui/update-model-context` into the next model call, and switches display modes on request.
- Applies Claude-like or ChatGPT-like style variables and light or dark themes (approximations, to check that views adopt a host's palette).

Models: `bedrock:<model id>` (your AWS account), `anthropic:<model>`, `openai:<model>`, or `openai-compatible:<model>` with `HOST_MODEL_BASE_URL` for a self-hosted or internal endpoint.

A deployed build can be linked instead of inlined with `--assets-url=https://…/v1`. Views cannot load assets from `localhost`, in this host as in Claude and ChatGPT, so that needs an `https` deployment, e.g. a preview.

## Test in Claude and ChatGPT

Claude and ChatGPT connect to a server from their own infrastructure, so they need a public, authenticated URL. The local server is localhost-only, so test them against the hosted server once it serves MCP Apps, or a staging deployment of it.

## Rules for surfaces

- Views never fetch, import data hooks, routers, stores or host SDKs. Pass data in and take actions out; the screen that renders a view decides how to load and act. In this app, add an operation to `dataOperations` (in the MCP server) rather than calling a tool by name.
- `visibility: ['app']` hides a tool from the model; it is not authorization. The server enforces scope, read-only and write policy on every app tool.
- Row contents travel in `_meta` or app-only tool results, never in model-visible `content`. Documents are cached by URI and must hold no user data.
- Hosts forbid `eval`. Each surface builds to one script with no further chunks, and the build fails if preview fixtures leak in.
