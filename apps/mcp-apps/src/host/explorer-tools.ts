import { resolveQueryWindow, type Capabilities, type Project } from 'surfaces/contract'
import { EXPLORER_QUERY_ID, type ExplorerHandle, type ExplorerState } from 'surfaces/explorer'
import { entityId } from 'surfaces/query'

import type { WorkspaceAdapter } from './workspace-tools'

type Row = Record<string, unknown>

/**
 * Binds the agent's workspace tools to a mounted Explorer: read it, draft SQL, change a
 * draft's display, open a table and refresh. Nothing here runs custom SQL.
 */
export function explorerWorkspace({
  project,
  capabilities,
  explorer,
  state,
  snapshot,
  onRefreshNavigation,
  configureLogs,
}: {
  project: Project
  capabilities: Capabilities
  explorer: () => ExplorerHandle | null
  state: ExplorerState
  /** Row-free context the host already publishes, returned with every read. */
  snapshot: Row
  onRefreshNavigation: () => void
  /** Omit when logs open elsewhere, e.g. in a panel. */
  configureLogs?: WorkspaceAdapter['configureLogs']
}): WorkspaceAdapter {
  const checkProject = (id: string) => {
    if (id !== project.id)
      throw new Error(
        'The selected project changed. Open the intended project and read the workspace again.'
      )
  }
  const checkSource = (source: string) => {
    const isEnabled =
      source === 'logs' ? (capabilities.logQueries ?? !!capabilities.logs) : capabilities.database
    if (!isEnabled)
      throw new Error(
        `${source === 'logs' ? 'Logs' : 'Database'} access is not enabled on this connection.`
      )
  }
  const view = () => {
    const handle = explorer()
    if (!handle) throw new Error('Open the database explorer first.')
    return handle
  }
  const editorFor = (id: string) => {
    const editor = view().editor(id)
    if (!editor) throw new Error('That query or table is not open. Read the workspace again.')
    return editor
  }

  return {
    read: () => ({
      ...snapshot,
      active_tab: state.activeId,
      tabs: [
        ...(state.query.isOpen
          ? [
              {
                tab_id: EXPLORER_QUERY_ID,
                kind: 'query',
                source: state.query.source,
                dirty: state.query.isDirty,
              },
            ]
          : []),
        ...(state.entity
          ? [{ tab_id: entityId(state.entity), kind: 'table', ...state.entity, dirty: false }]
          : []),
      ],
      query: explorer()?.editor(EXPLORER_QUERY_ID)?.read() ?? null,
    }),
    openQuery(args) {
      checkProject(args.project_id)
      checkSource(args.source)
      const id = view().openQuery({
        title: args.title,
        sql: args.sql,
        source: args.source,
        logWindow: resolveQueryWindow(args),
        display: args.display,
      })
      return { project_id: project.id, tab_id: id, revision: 0, executed: false }
    },
    editQuery(args) {
      checkProject(args.project_id)
      const result = editorFor(args.tab_id).update(args.sql, args.expected_revision)
      return { project_id: project.id, tab_id: args.tab_id, ...result, executed: false }
    },
    setQueryDisplay(args) {
      checkProject(args.project_id)
      const result = editorFor(args.tab_id).setDisplay(args.display, args.expected_display_revision)
      return { project_id: project.id, tab_id: args.tab_id, ...result, executed: false }
    },
    openTable(args) {
      checkProject(args.project_id)
      checkSource('database')
      const id = view().openTable({ schema: args.schema, name: args.table })
      return {
        project_id: project.id,
        tab_id: id,
        status: 'opened',
        data_status: 'Check read_workspace for load status.',
      }
    },
    configureLogs(args) {
      if (!configureLogs)
        throw new Error('Logs are not part of this panel. Use open_logs_panel to show logs.')
      return configureLogs(args)
    },
    refresh() {
      const tableRefreshed =
        (state.activeId && state.view === 'table'
          ? explorer()?.editor(state.activeId)?.refresh()
          : false) ?? false
      onRefreshNavigation()
      return {
        project_id: project.id,
        status: 'refresh_requested',
        tableRefreshed,
        customSqlExecuted: false,
      }
    },
  }
}
