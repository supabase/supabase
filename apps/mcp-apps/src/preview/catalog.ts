/**
 * How each surface ships to MCP Apps hosts: the tool that opens it, how hosts
 * present it, and the `_meta` a server sends. The gallery shows this above each
 * frame, so it is the reference for porting a surface onto a server.
 *
 * The values match the reference server on supabase/mcp `poc/surfaces`
 * (`src/tools/apps/launch-tools.ts`, `resources.ts` and `index.ts`). That server
 * also registers a thread entrypoint, `open_workspace`, which the north star
 * leaves out: the project workspace belongs to the sidebar app. A server that
 * registers these tools and resources serves the surfaces as built here.
 */
import {
  dataOperations,
  surfaceResourceMeta,
  surfaceResources,
  surfaceToolMeta,
  type SurfaceName,
} from 'surfaces/contract'

/**
 * Where a host shows a component:
 * - `sidebar`: opened by the user from the host, without asking the agent. ChatGPT lists it in
 *   its sidebar and Claude on its Artifacts page, from the tool's global entrypoint. Every
 *   argument is optional, and the tool stays visible to the model: Claude lists an entry point
 *   only for a tool the model can call, so the agent may open it in a conversation too.
 * - `panel`: opened by the agent with a launch tool. Fullscreen in ChatGPT; Claude opens it
 *   in its side panel because the resource prefers fullscreen.
 * - `inline`: rendered in the chat where the tool was called, sized to its content.
 */
export type Presentation = 'sidebar' | 'panel' | 'inline'

export const PRESENTATIONS: Record<Presentation, string> = {
  sidebar: 'Sidebar app',
  panel: 'Conversation panel',
  inline: 'Inline in chat',
}

/**
 * - `entrypoint`: a tool only the user opens from the host (ChatGPT `openai/ui` entrypoints).
 * - `launch`: a model-visible tool whose only job is to show a surface.
 * - `tool-result`: an existing model tool whose own result renders as the view, on every call.
 */
export type ToolKind = 'entrypoint' | 'launch' | 'tool-result'

/** One way a component reaches a host: where it shows, the resource, and the tool that opens it. */
export interface ComponentUse {
  presentation: Presentation
  surface: SurfaceName
  tool: string
  toolKind: ToolKind
  /** The tool's `_meta`, as the reference server lists it in `tools/list`. */
  toolMeta: Record<string, unknown>
}

export interface CatalogFrame {
  title: string
  src: string
  height: number
  /** Sized to its content, without a frame border, as hosts show inline views. */
  isInline?: boolean
}

export interface CatalogEntry {
  id: string
  title: string
  /** What the component shows, in a sentence. */
  description: string
  /** One or more: a component can show in several places, e.g. a panel and inline. */
  uses: ComponentUse[]
  frames: CatalogFrame[]
}

const uri = (surface: SurfaceName) => surfaceResources[surface].uri

/** The resource `_meta` a server returns from `resources/read` for each surface. */
export const resourceMeta = (surface: SurfaceName) => surfaceResourceMeta(surface)

/** The `_meta` of a tool that shows a surface, for Claude and ChatGPT alike. */
const launchMeta = (surface: SurfaceName) => surfaceToolMeta(surface)

const panelUse = (tool: string): ComponentUse => ({
  presentation: 'panel',
  surface: 'panel',
  tool,
  toolKind: 'launch',
  toolMeta: launchMeta('panel'),
})

const panelFrame = (title: string, preview: string, height: number): CatalogFrame => ({
  title,
  src: `/surfaces/panel.html?preview=${preview}`,
  height,
})

const panelEntry = (
  id: string,
  title: string,
  description: string,
  tool: string,
  preview: string,
  height: number
): CatalogEntry => ({
  id,
  title,
  description,
  uses: [panelUse(tool)],
  frames: [panelFrame(title, preview, height)],
})

const cardFrame = (title: string, surface: SurfaceName, preview: string): CatalogFrame => ({
  title,
  src: `/surfaces/${surface}.html?preview=${preview}`,
  height: 120,
  isInline: true,
})

export const CATALOG: CatalogEntry[] = [
  {
    id: 'projects',
    title: 'Projects',
    description:
      'A project list, then a project page that switches between Home, Database and Logs. Composer mentions and deep links open it at a project or table.',
    uses: [
      {
        presentation: 'sidebar',
        surface: 'projects',
        tool: dataOperations.bootstrap.tool,
        toolKind: 'entrypoint',
        // Visible to the model: Claude lists an entry point only for a tool it can call.
        toolMeta: surfaceToolMeta('projects', { entrypoint: 'global' }),
      },
    ],
    frames: [
      { title: 'Project list', src: '/surfaces/projects.html?preview=1', height: 640 },
      {
        title: 'Project page, opened from a deep link to a table',
        src: '/surfaces/projects.html?preview=1&route=%2Fprojects%2Fsales-pipeline%3Fschema%3Dpublic%26table%3Dcompanies',
        height: 640,
      },
    ],
  },
  panelEntry(
    'home',
    'Project Home',
    'Traffic, issues, users and checks for one project.',
    'open_project_home_panel',
    'home',
    640
  ),
  panelEntry(
    'issues',
    'Issues',
    'Security and performance findings the user can send back to chat.',
    'open_issues_panel',
    'issues',
    420
  ),
  panelEntry(
    'notebooks',
    'Notebooks',
    'Saved notebooks the agent can run.',
    'open_notebooks_panel',
    'notebooks',
    420
  ),
  panelEntry(
    'explorer',
    'Explorer',
    'Browse tables and write SQL, optionally starting at a table.',
    'open_explorer_panel',
    'explorer',
    560
  ),
  {
    id: 'query-editor',
    title: 'Query editor',
    description:
      'One query with its SQL and table or chart results. Beside the conversation it is a full editor; inline it collapses the SQL.',
    uses: [
      panelUse('open_sql_panel'),
      {
        presentation: 'inline',
        surface: 'query-block',
        tool: 'show_query_block',
        toolKind: 'launch',
        toolMeta: launchMeta('query-block'),
      },
    ],
    frames: [
      panelFrame('Conversation panel', 'sql', 480),
      {
        title: 'Inline in chat',
        src: '/surfaces/query-block.html?preview=block',
        height: 360,
        isInline: true,
      },
    ],
  },
  panelEntry(
    'logs',
    'Logs',
    'Recent logs the user can select and attach to chat.',
    'open_logs_panel',
    'logs',
    480
  ),
  panelEntry(
    'row',
    'Row editor',
    'One row for the user to review and save.',
    'open_row_panel',
    'row',
    520
  ),
  {
    id: 'project-card',
    title: 'Project card',
    description:
      'A new project or branch, from the moment the agent asks for it: its live setup status, then its connection details.',
    uses: [
      {
        presentation: 'inline',
        surface: 'project-card',
        tool: 'create_project',
        toolKind: 'tool-result',
        toolMeta: launchMeta('project-card'),
      },
      {
        presentation: 'inline',
        surface: 'branch-card',
        tool: 'create_branch',
        toolKind: 'tool-result',
        toolMeta: launchMeta('branch-card'),
      },
    ],
    frames: [
      cardFrame('Project: arguments, then each step until Active', 'project-card', 'starting'),
      cardFrame('Project: Active, with connection details', 'project-card', 'active'),
      cardFrame('Project: waiting on the tool', 'project-card', 'loading'),
      cardFrame('Project: setup failed', 'project-card', 'failed'),
      cardFrame('Project: the tool call failed', 'project-card', 'tool-error'),
      cardFrame('Project: the call was cancelled', 'project-card', 'cancelled'),
      cardFrame('Project: status checks failing, with Retry', 'project-card', 'check-failed'),
      cardFrame('Project: a host that can’t call tools or open links', 'project-card', 'no-tools'),
      cardFrame('Branch: each step until Active', 'branch-card', 'starting'),
      cardFrame('Branch: Active', 'branch-card', 'active'),
      cardFrame('Branch: migrations failed', 'branch-card', 'failed'),
    ],
  },
]

export interface SupportingTool {
  title: string
  description: string
  kind: string
  meta?: Record<string, unknown>
}

/** Tools with no view of their own, which surfaces rely on. */
export const SUPPORTING_TOOLS: SupportingTool[] = [
  {
    title: 'search_project_mentions',
    description: 'Finds projects and tables for @mentions in the ChatGPT composer.',
    kind: 'App-only',
    // Deprecated declaration; the current form is the openai/mentions server capability.
    meta: { ui: { visibility: ['app'] }, 'openai/extensions': { 'mentions/search': {} } },
  },
  {
    title: 'Workspace tools',
    description:
      'read_workspace, open_query, set_query_draft, set_query_display, open_table, configure_logs and refresh_view let the agent drive a mounted Explorer or query editor.',
    kind: 'Registered by the view (Claude only)',
  },
  ...Object.values(dataOperations)
    .filter((operation) => operation.visibility === 'app' && operation.tool.startsWith('app_'))
    .map((operation) => ({
      title: operation.tool,
      description: operation.description,
      kind: 'App-only',
      meta: { ui: { visibility: ['app'] } },
    })),
]
