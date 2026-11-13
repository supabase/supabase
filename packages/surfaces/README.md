# surfaces

Supabase product views that any host can render: the Explorer, query editor, logs, row editor, project list and project home with its sections. Today they render in MCP Apps hosts like Claude and ChatGPT through [`apps/mcp-apps`](../../apps/mcp-apps/README.md); Studio is meant to use them next.

The views are host-agnostic. Nothing here fetches, calls a tool, reads a router or store, or writes a prompt. A host loads data and passes it in, and handles what the view reports back.

## Entry points

| Import                | What                                                                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `surfaces/explorer`   | `Explorer`: a sidebar (schema, search, tables, Run SQL) beside one `QueryEditor` for the selection. Also the Explorer toolbar and query layout pieces it is built from.           |
| `surfaces/query`      | `QueryEditor` for one table or query, the results grid, `QueryResultChart`, and the query, draft and display models.                                                              |
| `surfaces/logs`       | `LogsView`: filters, a log list, a detail panel, and copy, share or send-to-agent for selected rows.                                                                              |
| `surfaces/row`        | `RowPanel` and `RowEditor`: view and edit one table row.                                                                                                                          |
| `surfaces/project`    | `ProjectList`, `ProjectHome`, `ProjectCard` (one project and its live status), and the Home sections that also work on their own: `IssuesList`, `NotebooksList`, `ProjectChecks`. |
| `surfaces/contract`   | What views need from a host: entity and capability schemas, `DataPort`, panel launches, surface resources (zod, browser-safe).                                                    |
| `surfaces/common`     | Shared types and helpers only (`Loadable`, `AgentRequest`, `AskAgent`, `SelectionSharing`, `errorMessage`). Nothing here renders.                                                 |
| `surfaces/codemirror` | A CodeMirror SQL editor, for hosts that do not bring their own.                                                                                                                   |
| `surfaces/test-utils` | Render helpers and fixtures for tests of these views.                                                                                                                             |

Entities and wire shapes (`Project`, `Capabilities`, `ProjectOverview`, `NotebookSummary`, `QueryDisplay`…) come from `surfaces/contract`, which defines what the views need from a host: entity schemas, `DataPort` and its `dataOperations`, panel launches and surface resources. Hosts implement it; the views own it. supabase/mcp `poc/surfaces` is a reference MCP server that implements it.

## How a view is shaped

**Data in, as props.** Reads are a `Loadable<T>`:

```ts
type Loadable<T> =
  | { status: 'idle' } // the host will not load it, e.g. the connection lacks the feature
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }
```

A view renders every state: loading, a failure (warning `Admonition` with Retry), empty, and data. A section that failed is shown as unavailable, never as empty.

**Actions out, as callbacks.** `onRefresh`, `onRunQuery`, `onSaveRow`, `onOpenProject` and so on. Omit a callback and the view hides or disables that action. `capabilities` (read-only, database, logs…) decide the rest; hosts enforce the real rules.

**Agent asks, as structured requests.** A view never words a prompt. It calls `onAsk` with an `AgentRequest`:

| `type`             | Sent from                      |
| ------------------ | ------------------------------ |
| `project-check`    | A check in `ProjectChecks`     |
| `review-finding`   | Review on an `IssuesList` row  |
| `investigate-logs` | Send in the `LogsView` details |
| `run-notebook`     | Run on a `NotebooksList` row   |

The host decides what each one means for its agent: `apps/mcp-apps` turns them into a chat message (`src/host/project-prompts.ts`), and a host without an agent simply omits `onAsk`. Add a new `type` to `AgentRequest` rather than passing text. Selections the user shares without starting a turn go through `SelectionSharing`.

**Host-controlled pieces, injected.** The SQL editor is a prop (`SqlEditor: SqlEditorComponent`), so each host brings its own. `apps/mcp-apps` uses `surfaces/codemirror`; Studio would pass its Monaco editor.

**Agent-driven state, through a handle.** Views an agent can drive expose a ref: `ExplorerHandle` (`openTable`, `openQuery`, `editor`), `QueryEditorHandle` (`read`, `update`, `setDisplay`, `refresh`) and `RowPanelHandle`. The host binds its agent tools to these. Agent SQL opens as a draft and never runs on its own; `openQuery` throws rather than replace a user's unsaved edits.

## Composable by default

If a section adds value on its own, it is its own component and an agent should be able to render it wherever it helps. `ProjectHome` is a composition of `IssuesList`, `NotebooksList` and `ProjectChecks` (plus its header, stats and activity chart), and each of those renders alone in a conversation panel too. Each section owns its own loading, empty, error and "sent" states, so it works the same in either place.

The Explorer has no tabs: hosts like ChatGPT and Claude already have their own. It is a sidebar and one editor. Table views show rows only (no SQL editor, no result settings) with Refresh, Open query and Insert row; one SQL draft is kept while the user browses tables.

## Rules

- Never fetch, import data hooks, routers, stores or host SDKs, or call `window.parent`.
- Never write prompt text; emit an `AgentRequest`.
- Build from `ui` and `ui-patterns` (`Button`, `Admonition`, `EmptyStatePresentational`, `Badge`, `Dialog`…). Do not add local copies of design-system components; add to `packages/ui` if something is missing.
- Semantic Tailwind tokens only. Views must adopt the host's palette, so no hard-coded colors.
- Size to the container (`@container` queries), not the viewport: a view may be a full page, a side panel or an inline block.
- Keep dependencies small. Every surface ships as one script to the MCP Apps hosts.

## Develop and test

See a view on sample data:

- **Design system**: `pnpm dev:design-system`, then **Surfaces** in the sidebar (http://localhost:3003). Each view has a page with live demos in `apps/design-system/registry/default/example/surfaces-*.tsx`, sharing `surfaces-sample-data.ts`.
- **In an MCP Apps shell**: `pnpm --filter mcp-apps dev` for a gallery of every surface, then `pnpm --filter mcp-apps dev:e2e --platform=mock` to drive it from a local agent host. See the [mcp-apps README](../../apps/mcp-apps/README.md).

```sh
pnpm --filter surfaces test
pnpm --filter surfaces typecheck
```

Tests use Vitest and Testing Library (`renderWithTooltip`, `testCapabilities`, `TestSqlEditor` and `testTable` from `surfaces/test-utils`). Test what a user can do and see in each `Loadable` state, and that actions report the right callback or `AgentRequest`.

### Add a view

1. Add the component to the closest entry point (or a new one in `package.json` `exports`), taking data as `Loadable` props and reporting actions through callbacks.
2. Cover its states in a test next to it.
3. Add a design-system page and demo for it.
4. To show it in agent hosts, render it in `apps/mcp-apps` and add it to the gallery catalog (see "Add a view an agent can open" in that README).
