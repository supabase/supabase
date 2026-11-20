# mcp-apps

Supabase surfaces packaged as [MCP Apps](https://github.com/modelcontextprotocol/ext-apps): the project browser, conversation panels (query editor, logs, row, explorer, project home, issues, notebooks) and inline query blocks that open inside Claude, ChatGPT and other MCP Apps hosts.

The views themselves live in [`packages/surfaces`](../../packages/surfaces/README.md). This app connects them to an MCP Apps host, builds one document per surface, and holds the gallery: the north star for what Supabase looks like in agent hosts.

Work happens here and in the design system, with no server needed. The server side comes later, one view at a time, on the MCP Apps foundation in [supabase/mcp#551](https://github.com/supabase/mcp/pull/551). Until then, the reference server on supabase/mcp `poc/surfaces` is the record of how each surface is served.

## How the pieces fit

| Where                  | What                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/surfaces`    | Host-agnostic React views built on `ui` and `ui-patterns`. Data comes in as props, actions go out as callbacks, and agent asks are structured `AgentRequest`s. Nothing there fetches, calls a host or writes a prompt. `surfaces/contract` defines what the views need from a host: entities, capabilities, panel launches, `dataOperations`, workspace tool inputs, resource URIs and the document shell.                               |
| `supabase/mcp`         | The Supabase MCP server. `poc/surfaces` is a reference implementation of `surfaces/contract`: launch and app-only data tools and one `ui://supabase/*` document per surface. [#551](https://github.com/supabase/mcp/pull/551) is the foundation views will ship on.                                                                                                                                                                      |
| `apps/mcp-apps` (here) | The MCP Apps adapter and screens. `src/host` turns an `App` connection into what views need (tool calls → data, `AgentRequest` → chat message, host theme → Studio tokens, agent workspace tools). `src/shell` holds the screens, `src/query` the inline query block, `src/entries` one entry per surface and `src/preview` the gallery, its fixtures and its catalog. `host/` is a local MCP Apps host for end-to-end testing (parked). |
| `apps/design-system`   | A Surfaces section with live demos of each shared view, on sample data.                                                                                                                                                                                                                                                                                                                                                                  |
| `apps/studio`          | Does not use the shared views yet. Moving Studio's Explorer, logs and Home onto them is a follow-up.                                                                                                                                                                                                                                                                                                                                     |

## The gallery is the north star

`pnpm --filter mcp-apps dev`, then http://localhost:5174. Every component an agent host can show renders on fixture data, with its properties beside it:

- **Surface**: where hosts show it, one or more of _Sidebar app_ (the user opens it from the host, a ChatGPT global entrypoint), _Conversation panel_ (the agent opens it with a launch tool; Claude uses its side panel) and _Inline in chat_ (in the conversation where the tool ran). The query editor, for example, is both a conversation panel (`open_sql_panel`) and inline (`show_query_block`).
- **Tool** and **Kind**: the tool that opens it, and whether that is an entrypoint, a launch tool or a view on an existing tool's result.
- **Resource**, **Tool meta** and **Resource meta**: the `ui://` resource and the exact `_meta` a server sends, in popovers.

That data lives in `src/preview/catalog.ts`. It matches the reference server, except that the north star drops its thread entrypoint (`open_workspace`): the project workspace belongs to the sidebar app. It is the checklist when porting a component onto #551. Supporting tools without a view (composer mentions, tools a view registers for the agent, app-only data tools) are listed at the end.

## Surfaces and resources

`pnpm build` writes one script and one stylesheet per surface to `dist/v1` (fonts and images inlined, no further chunks) plus a `manifest.json` of hashes:

| Files                   | Resource                        | Opened by                                                                                                                                                                                                 |
| ----------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projects.{js,css}`     | `ui://supabase/projects-v1`     | `open_projects` (global entrypoint, also callable by the model). The reference server also registers `open_workspace` as a thread entrypoint; the north star keeps the workspace in the sidebar app only. |
| `panel.{js,css}`        | `ui://supabase/panel-v1`        | `open_sql_panel`, `open_logs_panel`, `open_row_panel`, `open_explorer_panel`, `open_project_home_panel`, `open_issues_panel`, `open_notebooks_panel`                                                      |
| `query-block.{js,css}`  | `ui://supabase/query-block-v1`  | `show_query_block`                                                                                                                                                                                        |
| `project-card.{js,css}` | `ui://supabase/project-card-v1` | `create_project` (its own call)                                                                                                                                                                           |
| `branch-card.{js,css}`  | `ui://supabase/branch-card-v1`  | `create_branch` (its own call)                                                                                                                                                                            |

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

The **project card** is a tool-result view: it renders a model tool's own call rather than a launch payload. `create_project` points at `project-card` and `create_branch` at `branch-card` (`attachToolResultViews` in the reference server, only for clients that render MCP Apps), and both show the same `ProjectCard`: a branch is a project too, shown under its organization and parent project.

The card follows the whole call, so it mounts with `mountToolCallView` rather than `mountToolView`. It renders straight away, before the host has connected, so the host can size the frame:

1. **Waiting on the tool** (or on the user to confirm it): the card shows the call's arguments, such as the name and region, and skeletons for what only the result has.
2. **Created**: `src/host/use-creation-status.ts` reads the status again every 5 seconds, through `get_project` or `list_branches`, and the badge names the step: Creating, then Checking health for a project, or Running migrations and Deploying functions for a branch. It stops at Active or at a failure, which says which step failed.
3. **Ready**: a collapsed Connection details section appears, with the project URL and a publishable key to copy, read through `get_project_url` and `get_publishable_keys` the first time it opens. If they can't be read it links to the dashboard's Connect dialog instead.

Nothing closes the view. A tool error or a cancelled call shows in the card, a check that fails three times in a row or runs past 10 minutes stops with a Retry beside the badge, and on a host that can't proxy tool calls or open links (`serverTools`, `openLinks` in its capabilities) the card says the status won't update and offers links to copy. A server scoped to one project takes no `project_id`, so the branch card reads through the data port's scoped connection and leaves connection details to the dashboard. Each status is shared with the agent as model context, so the agent knows when the project is ready without polling. The card's connection has data and agent ports but not the bootstrap, and bundles only the card, so each is less than half the size of the other surfaces.

Inline surfaces sit on the host's own surface: the page has no fill, the card is an outline with no fill or shadow, and the body is padded by the host's safe area. Their resources ask for `clipboardWrite` so values can be copied.

### What Claude needs

The surfaces follow [Claude's MCP Apps guides](https://claude.com/docs/connectors/building/mcp-apps/getting-started). Each of these is easy to undo by accident:

- **Display modes come from the contract.** A surface declares `surfaceResources[name].displayModes` to the host (`src/host/connect.ts`). The cards list only `inline`, so Claude shows no expand button above them. Panels and the projects app list only `fullscreen`, so Claude shows a card in the conversation and opens the view in the side panel; their resources also set `preferredDisplayMode: 'fullscreen'` to open it without a click. The query block lists both, and offers its own expand button only where the host offers fullscreen, requested straight from the click.
- **The entry point is visible to the model.** `open_projects` carries `openai/ui.entrypoints` for ChatGPT's sidebar and Claude's Artifacts page. Claude lists it only if `_meta.ui.visibility` includes `model`, every argument is optional, and the title is 60 characters or fewer.
- **The document follows the host's theme from the first paint.** `renderSurfaceDocument` sets `<meta name="color-scheme" content="light dark">`; without it the browser gives the frame an opaque backdrop. Inline surfaces paint no page background.
- **Fonts need a CSP entry.** The host's font CSS loads Anthropic Sans from `https://assets.claude.ai`, so resources list it in `csp.resourceDomains`.
- **Safe areas.** `--host-inset-*` pads every surface: Claude reports an inset beside the conversation in the side panel, and on mobile the chat input lies over a fullscreen view.
- **Messages.** `app.sendMessage` takes text blocks of at most 8,000 characters in all, with no long runs of blank lines or spaces. `src/host/message-limits.ts` tidies them and asks the user to send less rather than cut their selection, and a result with `isError` is reported.
- **Inline cards.** Skeletons while loading, native `title` hints instead of popovers (a host clips a popover at the frame's edge), 44pt tap targets on touch screens, and no scrolling inside the card.
- **App tools** are declared only by surfaces that register them, before `connect()`. They rely on `zod/v4` from zod 3.25 with `@modelcontextprotocol/ext-apps` 1.7; ext-apps 2 needs zod 4.2 or later.
- **Icons.** Claude takes an app icon only as an inline PNG or JPEG of 64 to 128 px under 10 KB, so the server lists a PNG before its SVGs.

Entry points and app tools work only on a remote connector, and entry points only for a custom connector or a Verified directory listing. For a directory listing, add `https://supabase.com` to its allowed link URIs so Open in dashboard skips Claude's confirmation.

### How a view gets data

A view's data needs are named in `dataOperations` in `surfaces/contract`: each operation names the tool a server provides, its input and its result schema. `src/host/tool-data-port.ts` calls the tool and parses the result with the same schema.

- `visibility: 'app'` operations are app-only tools (`app_get_project_overview`, `app_list_schemas`, `app_read_table`, `app_read_row`, `app_update_row`, `app_insert_row`, `app_get_logs`). They exist only where no model tool fits.
- `visibility: 'shared'` operations reuse the model's own tools (`get_project`, `get_organization`, `list_tables`, `list_notebooks`, `execute_sql`, `query_logs`), so views and the agent read data the same way. `result: 'rows'` marks the two that return untrusted query rows.
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

Open http://localhost:5174 for a gallery of every surface on fixture data (no host, agent actions disabled). Each frame also opens on its own, e.g. `/surfaces/panel.html?preview=logs` (`home`, `issues`, `notebooks`, `explorer`, `sql`, `logs`, `row`) or `/surfaces/project-card.html?preview=starting` (`starting`, `active`, `loading`, `failed`, `tool-error`, `cancelled`, `check-failed`, `no-tools`; `branch-card.html` has `starting`, `active`, `loading` and `failed`). Fixtures live in `src/preview/fixtures.ts` and `src/preview/project-card.ts`.

For a single shared view in isolation, use the design system instead (`pnpm dev:design-system`, then **Surfaces**).

```sh
pnpm --filter mcp-apps test
pnpm --filter mcp-apps typecheck
pnpm --filter mcp-apps build          # or build:watch
```

### Add a view an agent can open

Prefer a view on an existing tool's result when the user wants to see that result every time the tool runs, like the project card on `create_project` and `create_branch`. When the agent should choose whether to show something, use a launch tool (`show_*` or `open_*`) instead: a view on a tool renders on every call, including the agent's own lookups.

1. Build the view in `packages/surfaces` (see its README) and add a design-system demo.
2. Here: render it (a panel `view` in `src/shell/ConversationPanel.tsx`, or its own entry mounted with `mountToolView`, or `mountToolCallView` to follow a call from before its result), add any data it needs to `dataOperations` in `surfaces/contract` (prefer an existing model tool, `visibility: 'shared'`), word any new `AgentRequest` in `src/host/project-prompts.ts`, and add fixtures.
3. Add it to `src/preview/catalog.ts` with the tool that opens it and its `_meta`, and check it in the gallery.
4. Server side, when it ships: register the tool and resource on the #551 foundation. New tool names also need entries in the hosted server's tool auth list before they work in production.

## Test end to end, locally (parked)

The gallery and design system are where the views are developed. This runs them against the reference server when you need a real host round trip.

`pnpm dev:e2e` runs the whole stack on your machine: the surface build in watch mode, the Supabase MCP server's local HTTP server (`:3111`), and a local MCP Apps host (`:5180`) with a chat, tool calls and views rendered through the MCP Apps bridge, much like Claude or ChatGPT. Nothing leaves your machine except calls to the Supabase API and to the model you configure.

1. Check out supabase/mcp `poc/surfaces`, then install and build it: `pnpm install && pnpm build`. Set `SUPABASE_MCP_DIR` to its `packages/mcp-server-supabase` (default: a `mcp-surfaces` checkout next to this repository). Nothing here depends on that package; the script only runs its CLI.
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

- Views never fetch, import data hooks, routers, stores or host SDKs. Pass data in and take actions out; the screen that renders a view decides how to load and act. In this app, add an operation to `dataOperations` in `surfaces/contract` rather than calling a tool by name.
- Views never write prompts. They emit an `AgentRequest`; the host words it.
- `visibility: ['app']` hides a tool from the model; it is not authorization. The server enforces scope, read-only and write policy on every app tool.
- Row contents travel in `_meta` or app-only tool results, never in model-visible `content`. Documents are cached by URI and must hold no user data.
- Hosts forbid `eval`. Each surface builds to one script with no further chunks, and the build fails if preview fixtures leak in.
- About 1.9 MB of JS ships per surface today; keep new dependencies out of the views where `ui` already covers them.
