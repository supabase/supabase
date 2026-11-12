# mcp-apps

Supabase surfaces packaged as [MCP Apps](https://github.com/modelcontextprotocol/ext-apps): the project browser, conversation panels (query editor, logs, row, explorer, project home, issues, notebooks) and inline query blocks that open inside Claude, ChatGPT and other MCP Apps hosts.

The views themselves live in [`packages/surfaces`](../../packages/surfaces/README.md). This app connects them to an MCP Apps host and builds one document per surface for the Supabase MCP server to serve.

## How the pieces fit

| Where                  | What                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `supabase/mcp`         | The Supabase MCP server. Owns the wire contract, published as `@supabase/mcp-server-supabase/apps` (zod schemas for entities, capabilities, panel launches, `dataOperations`, workspace tool inputs, resource URIs and the document shell). Registers the launch and app-only data tools and serves one `ui://supabase/*` document per surface. Leaves the tools out for clients whose capabilities say they cannot render MCP Apps. |
| `packages/surfaces`    | Host-agnostic React views built on `ui` and `ui-patterns`. Data comes in as props, actions go out as callbacks, and agent asks are structured `AgentRequest`s. Nothing there fetches, calls a host or writes a prompt.                                                                                                                                                                                                               |
| `apps/mcp-apps` (here) | The MCP Apps adapter and screens. `src/host` turns an `App` connection into what views need (tool calls → data, `AgentRequest` → chat message, host theme → Studio tokens, agent workspace tools). `src/shell` holds the screens, `src/query` the inline query block, `src/entries` one entry per surface and `src/preview` the gallery fixtures. `host/` is a local MCP Apps host for end-to-end testing.                           |
| `apps/design-system`   | A Surfaces section with live demos of each shared view, on sample data.                                                                                                                                                                                                                                                                                                                                                              |
| `apps/studio`          | Does not use the shared views yet. Moving Studio's Explorer, logs and Home onto them is a follow-up.                                                                                                                                                                                                                                                                                                                                 |

## Surfaces and resources

`pnpm build` writes one script and one stylesheet per surface to `dist/v1` (fonts and images inlined, no further chunks) plus a `manifest.json` of hashes:

| Files                  | Resource                       | Opened by                                                                                                                                            |
| ---------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projects.{js,css}`    | `ui://supabase/projects-v1`    | `open_projects` (global entrypoint), `open_workspace` (thread entrypoint)                                                                            |
| `panel.{js,css}`       | `ui://supabase/panel-v1`       | `open_sql_panel`, `open_logs_panel`, `open_row_panel`, `open_explorer_panel`, `open_project_home_panel`, `open_issues_panel`, `open_notebooks_panel` |
| `query-block.{js,css}` | `ui://supabase/query-block-v1` | `show_query_block`                                                                                                                                   |

The **projects** surface is the full app: a project list, then a project page that switches between Home, Database (the Explorer) and Logs.

The **panel** surface renders one view beside the conversation. The launch tool's result carries the view and its starting state in `_meta['supabase/panel']` (`panelLaunchSchema`), so the model never sees row data:

| `view`      | Launched by               | Renders         | Starts with                                                    |
| ----------- | ------------------------- | --------------- | -------------------------------------------------------------- |
| `query`     | `open_sql_panel`          | `QueryEditor`   | Title, SQL, source (database or logs), log window, display     |
| `logs`      | `open_logs_panel`         | `LogsView`      | Time window, search, level and source filters                  |
| `row`       | `open_row_panel`          | `RowPanel`      | One table row and its primary key                              |
| `explorer`  | `open_explorer_panel`     | `Explorer`      | Optionally a schema and table                                  |
| `home`      | `open_project_home_panel` | `ProjectHome`   | The project                                                    |
| `issues`    | `open_issues_panel`       | `IssuesList`    | The project                                                    |
| `notebooks` | `open_notebooks_panel`    | `NotebooksList` | The project. Registered only when the notebooks feature is on. |

Pick the narrowest panel for the ask: "I want to browse my data" opens the Explorer, "show me all tasks with xyz" opens one query editor with the SQL filled in. Any section that is useful on its own should be renderable on its own, so a new standalone view usually means a new panel `view`, not a new surface.

The **query block** is the same `QueryEditor`, rendered inline in the conversation with collapsible SQL.

### How a view gets data

A view's data needs are named in the server's `dataOperations`: each operation names a tool, its input and its result schema. `src/host/tool-data-port.ts` calls the tool and parses the result with the same schema.

- `visibility: 'app'` operations are app-only tools (`app_get_project_overview`, `app_list_schemas`, `app_read_table`, `app_read_row`, `app_update_row`, `app_insert_row`, `app_get_logs`). They exist only where no model tool fits.
- `visibility: 'shared'` operations reuse the model's own tools (`list_tables`, `list_notebooks`, `execute_sql`, `query_logs`), so views and the agent read data the same way. `result: 'rows'` marks the two that return untrusted query rows.
- On a project-scoped connection the server injects `project_id` into model tools and rejects it when passed. The data port drops it for shared operations on those connections, and refuses a project outside the scope.
- `capabilities` in the bootstrap say what the connection allows (`readOnly`, `database`, `logs`, `logQueries`, `createProject`, `creationMode`, `scopedProjectId`, `openResource`). Views hide or disable actions from these; the server still enforces every rule.

### How a view talks to the agent

- **Asking the agent.** Views emit an `AgentRequest` (`project-check`, `review-finding`, `investigate-logs`, `run-notebook`). `src/host/project-prompts.ts` (`agentRequestMessage`, `askAgentFor`) owns all wording and the model-context JSON, and sends it as a `ui/message`. Studio can handle the same requests its own way, or not offer them.
- **Sharing context.** Selections (for example log rows) go to `ui/update-model-context` through `SelectionSharing`, without starting a turn.
- **Letting the agent drive a view.** A mounted Explorer or query editor registers workspace tools for the agent (`read_workspace`, `open_query`, `set_query_draft`, `set_query_display`, `open_table`, `configure_logs`, `refresh_view`) through `src/host/workspace-tools.ts`. `src/host/explorer-tools.ts` binds them to an `ExplorerHandle`. Agent SQL opens as a draft that never runs on its own and never replaces the user's edits.

### Linked or inlined

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

Open http://localhost:5174 for a gallery of every surface on fixture data (no host, agent actions disabled). Each frame also opens on its own, e.g. `/surfaces/panel.html?preview=logs` (`home`, `issues`, `notebooks`, `explorer`, `sql`, `logs`, `row`). Fixtures live in `src/preview/fixtures.ts`.

For a single shared view in isolation, use the design system instead (`pnpm dev:design-system`, then **Surfaces**).

```sh
pnpm --filter mcp-apps test
pnpm --filter mcp-apps typecheck
pnpm --filter mcp-apps build          # or build:watch
```

### Add a view an agent can open

1. Build the view in `packages/surfaces` (see its README) and add a design-system demo.
2. In `supabase/mcp`: add the panel schema to `panelLaunchSchema`, a launch tool in `src/tools/apps/launch-tools.ts`, and any data it needs to `dataOperations`. Prefer an existing model tool (`visibility: 'shared'`) over a new app tool. Add a test to `src/server.apps.test.ts`.
3. Here: render the view for its `view` in `src/shell/ConversationPanel.tsx`, load its data in `src/host/use-app-data.ts`, word any new `AgentRequest` in `src/host/project-prompts.ts`, and add a fixture to `PREVIEW_PANELS`.
4. Check it in the gallery, then end to end (below).
5. New tool names also need entries in the hosted server's tool auth list before they work in production.

## Test end to end, locally

`pnpm dev:e2e` runs the whole stack on your machine: the surface build in watch mode, the Supabase MCP server's local HTTP server (`:3111`), and a local MCP Apps host (`:5180`) with a chat, tool calls and views rendered through the MCP Apps bridge, much like Claude or ChatGPT. Nothing leaves your machine except calls to the Supabase API and to the model you configure.

1. In the `supabase/mcp` checkout on the matching branch (`poc/surfaces`), install and build: `pnpm install && pnpm build`. This repository links that package by path (see `package.json`) until a release publishes `@supabase/mcp-server-supabase/apps`, so CI cannot install it yet.
2. Copy `.env.host.example` to `.env.host` and fill it in. With no `HOST_MODEL`, run tools by hand from the composer.
3. Start everything:

   ```sh
   pnpm --filter mcp-apps dev:e2e                     # your Supabase account (SUPABASE_ACCESS_TOKEN)
   pnpm --filter mcp-apps dev:e2e --platform=mock     # a mocked platform with sample projects, no account
   ```

4. Open http://localhost:5180. The header buttons are the server's entrypoints (Supabase, Database workspace). Ask the agent, or use **Run a tool without a model**, which also lists the tools a mounted view registers for the agent (`open_query`, `set_query_draft`…). Mock project IDs change on every start, so list projects before opening a panel by hand.

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
- Views never write prompts. They emit an `AgentRequest`; the host words it.
- `visibility: ['app']` hides a tool from the model; it is not authorization. The server enforces scope, read-only and write policy on every app tool.
- Row contents travel in `_meta` or app-only tool results, never in model-visible `content`. Documents are cached by URI and must hold no user data.
- Hosts forbid `eval`. Each surface builds to one script with no further chunks, and the build fails if preview fixtures leak in.
- About 1.9 MB of JS ships per surface today; keep new dependencies out of the views where `ui` already covers them.
