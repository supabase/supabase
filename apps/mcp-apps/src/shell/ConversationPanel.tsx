import {
  resolveQueryWindow,
  type ExplorerPanel,
  type HomePanel,
  type IssuesPanel,
  type LogSettings,
  type LogsPanel,
  type NotebooksPanel,
  type PanelBootstrap,
  type QueryPanel,
  type RowPanel as RowLaunch,
} from '@supabase/mcp-server-supabase/apps'
import { useLayoutEffect, useRef, useState } from 'react'
import type { ExplorerHandle, ExplorerState } from 'surfaces/explorer'
import { LogsView } from 'surfaces/logs'
import { IssuesList, NotebooksList } from 'surfaces/project'
import { QueryEditor, type QueryEditorHandle } from 'surfaces/query'
import { RowPanel, type RowPanelHandle } from 'surfaces/row'

import { useApp } from '../host/app-context'
import { explorerWorkspace } from '../host/explorer-tools'
import { askAgentFor } from '../host/project-prompts'
import { useLogs, useNotebooks, useProjectActions, useProjectOverview } from '../host/use-app-data'
import { QueryBlock } from '../query/query-block'
import { DatabaseExplorer } from './DatabaseExplorer'
import { ProjectHomeScreen } from './ProjectHomeScreen'

/** A single focused view launched by the agent. Workspace navigation belongs to the sidebar. */
export function ConversationPanel({ initial }: { initial: PanelBootstrap }) {
  const launch = initial.panel!
  if (launch.view === 'row')
    return <RowConversationPanel key={launch.id} initial={initial} launch={launch} />
  if (launch.view === 'explorer')
    return <ExplorerConversationPanel key={launch.id} initial={initial} launch={launch} />
  if (launch.view === 'home' || launch.view === 'issues' || launch.view === 'notebooks')
    return <OverviewConversationPanel key={launch.id} initial={initial} launch={launch} />
  return <QueryOrLogsPanel key={launch.id} initial={initial} launch={launch} />
}

/** A project's home, or one of its sections on its own: issues or notebooks. */
function OverviewConversationPanel({
  initial,
  launch,
}: {
  initial: PanelBootstrap
  launch: HomePanel | IssuesPanel | NotebooksPanel
}) {
  const { agent: host, workspace } = useApp()
  const project = initial.projects.find((item) => item.id === launch.project_id)!
  const [refreshRevision, setRefreshRevision] = useState(0)

  useLayoutEffect(() => {
    // Project identity only; the overview stays in the app.
    const snapshot = {
      project_id: project.id,
      project_name: project.name,
      server: initial.server,
      capabilities: initial.capabilities,
      surface: 'conversation_panel',
      view: launch.view,
      available_actions: ['read_workspace', 'refresh_view'],
    }
    host.context?.publish(snapshot)
    const openElsewhere = (): never => {
      throw new Error(
        `This panel shows the project ${launch.view}. Use open_sql_panel, open_logs_panel or open_explorer_panel for other views.`
      )
    }
    return workspace?.bind({
      read: () => snapshot,
      openQuery: openElsewhere,
      openTable: openElsewhere,
      editQuery: openElsewhere,
      setQueryDisplay: openElsewhere,
      configureLogs: openElsewhere,
      refresh() {
        setRefreshRevision((value) => value + 1)
        return { project_id: project.id, status: 'refresh_requested', customSqlExecuted: false }
      },
    })
  })

  if (launch.view === 'home')
    return (
      <main
        aria-label={`${project.name} home`}
        className="flex h-full min-h-0 flex-col bg-background"
      >
        <ProjectHomeScreen project={project} context={initial} refreshRevision={refreshRevision} />
      </main>
    )
  return (
    <main
      aria-label={`${project.name} ${launch.view}`}
      className="h-full min-h-0 overflow-auto bg-background p-4"
    >
      {launch.view === 'issues' && (
        <IssuesPanelBody
          project={project}
          initial={initial}
          refreshRevision={refreshRevision}
          onRefresh={() => setRefreshRevision((value) => value + 1)}
        />
      )}
      {launch.view === 'notebooks' && (
        <NotebooksPanelBody
          project={project}
          initial={initial}
          refreshRevision={refreshRevision}
          onRefresh={() => setRefreshRevision((value) => value + 1)}
        />
      )}
    </main>
  )
}

/** Loads the project's advisors for the issues view; Home loads its own overview. */
function IssuesPanelBody({
  project,
  initial,
  refreshRevision,
  onRefresh,
}: {
  project: PanelBootstrap['projects'][number]
  initial: PanelBootstrap
  refreshRevision: number
  onRefresh: () => void
}) {
  const { agent: host } = useApp()
  const overview = useProjectOverview(project, refreshRevision)
  return (
    <IssuesList
      project={project}
      issues={overview.value}
      onRefresh={onRefresh}
      onAsk={askAgentFor(host.ask, initial)}
    />
  )
}

/** Loads the project's saved notebooks for the notebooks view. */
function NotebooksPanelBody({
  project,
  initial,
  refreshRevision,
  onRefresh,
}: {
  project: PanelBootstrap['projects'][number]
  initial: PanelBootstrap
  refreshRevision: number
  onRefresh: () => void
}) {
  const { agent: host } = useApp()
  const notebooks = useNotebooks(project, refreshRevision)
  return (
    <NotebooksList
      project={project}
      notebooks={notebooks.value}
      onRefresh={onRefresh}
      onAsk={askAgentFor(host.ask, initial)}
    />
  )
}

/** A project's database Explorer: browse tables and write SQL beside the conversation. */
function ExplorerConversationPanel({
  initial,
  launch,
}: {
  initial: PanelBootstrap
  launch: ExplorerPanel
}) {
  const { agent: host, workspace } = useApp()
  const project = initial.projects.find((item) => item.id === launch.project_id)!
  const [state, setState] = useState<ExplorerState>({
    view: 'none',
    activeId: null,
    query: { isOpen: false, isDirty: false, source: 'database' },
  })
  const [refreshRevision, setRefreshRevision] = useState(0)
  const explorer = useRef<ExplorerHandle | null>(null)

  useLayoutEffect(() => {
    // Navigation metadata only. SQL is read on demand; rows never leave the app.
    const snapshot = {
      project_id: project.id,
      project_name: project.name,
      server: initial.server,
      capabilities: initial.capabilities,
      surface: 'conversation_panel',
      view: 'explorer',
      showing: state.view,
      schema: state.entity?.schema ?? launch.schema ?? 'public',
      table: state.entity?.name ?? null,
      dirty: state.query.isDirty,
      available_actions: [
        'read_workspace',
        'open_query',
        'set_query_draft',
        'set_query_display',
        'open_table',
        'refresh_view',
      ],
    }
    host.context?.publish(snapshot)
    return workspace?.bind(
      explorerWorkspace({
        project,
        capabilities: initial.capabilities,
        explorer: () => explorer.current,
        state,
        snapshot,
        onRefreshNavigation: () => setRefreshRevision((value) => value + 1),
      })
    )
  })

  return (
    <main
      aria-label={`${project.name} database`}
      className="flex h-full min-h-0 flex-col bg-background"
    >
      <DatabaseExplorer
        ref={explorer}
        project={project}
        context={initial}
        initialSchema={launch.schema}
        initialTable={launch.table}
        refreshRevision={refreshRevision}
        onStateChange={setState}
      />
    </main>
  )
}

/** A row editor; the agent can read its row-free snapshot and refresh it. */
function RowConversationPanel({ initial, launch }: { initial: PanelBootstrap; launch: RowLaunch }) {
  const { workspace, agent } = useApp()
  const actions = useProjectActions(launch.project_id)
  const panel = useRef<RowPanelHandle>(null)
  useLayoutEffect(() => {
    const openElsewhere = (): never => {
      throw new Error(
        'This panel edits a single row. Use open_sql_panel, open_logs_panel or open_explorer_panel for other views.'
      )
    }
    return workspace?.bind({
      read: () => ({
        ...(panel.current?.read() ?? {}),
        available_actions: ['read_workspace', 'refresh_view'],
      }),
      openQuery: openElsewhere,
      openTable: openElsewhere,
      editQuery: openElsewhere,
      setQueryDisplay: openElsewhere,
      configureLogs: openElsewhere,
      refresh() {
        panel.current?.refresh()
        return {
          project_id: launch.project_id,
          status: 'refresh_requested',
          customSqlExecuted: false,
        }
      },
    })
  })
  return (
    <RowPanel
      ref={panel}
      initial={initial}
      launch={launch}
      onReload={actions.onReloadRow}
      onSave={actions.saveRow}
      onSnapshotChange={(snapshot) => agent.context?.publish({ ...snapshot })}
    />
  )
}

function QueryOrLogsPanel({
  initial,
  launch,
}: {
  initial: PanelBootstrap
  launch: QueryPanel | LogsPanel
}) {
  const { agent: host, workspace, SqlEditor } = useApp()
  const project = initial.projects.find((item) => item.id === launch.project_id)!
  const isInline = launch.view === 'query' && launch.surface === 'inline'
  const [logWindow] = useState(() =>
    launch.view === 'query' ? resolveQueryWindow(launch) : undefined
  )
  const editor = useRef<QueryEditorHandle>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [refreshRevision, setRefreshRevision] = useState(0)
  const [logSettings, setLogSettings] = useState<LogSettings>(
    launch.view === 'logs' ? launch.settings : { minutes: 60, search: '' }
  )
  const logs = useLogs(project, logSettings, refreshRevision, launch.view === 'logs')
  const actions = useProjectActions(project.id)

  useLayoutEffect(() => {
    const snapshot = {
      project_id: project.id,
      project_name: project.name,
      server: initial.server,
      capabilities: initial.capabilities,
      surface: isInline ? 'query_block' : 'conversation_panel',
      view: launch.view,
      active_tab: launch.id,
      source: launch.view === 'query' ? (launch.source ?? 'database') : null,
      ...(logWindow ? { logWindow } : {}),
      dirty: isDirty,
      available_actions: [
        'read_workspace',
        'refresh_view',
        ...(launch.view === 'query'
          ? ['set_query_draft', 'set_query_display']
          : ['configure_logs']),
      ],
      ...(launch.view === 'logs' ? { logs: logSettings } : {}),
    }
    host.context?.publish(snapshot)
    const checkProject = (id: string) => {
      if (id !== project.id)
        throw new Error('This panel belongs to a different project. Read the workspace again.')
    }
    const openElsewhere = (): never => {
      throw new Error(
        'This panel contains a single view. Use open_sql_panel or open_logs_panel for a separate panel, or open_explorer_panel to browse the database. To revise this query, read_workspace and use set_query_draft.'
      )
    }
    const queryEditor = (tabId: string) => {
      if (launch.view !== 'query' || tabId !== launch.id || !editor.current)
        throw new Error('This query is not open in this panel. Read the workspace again.')
      return editor.current
    }
    return workspace?.bind({
      read: () => ({ ...snapshot, query: editor.current?.read() ?? null }),
      openQuery: openElsewhere,
      openTable: openElsewhere,
      editQuery(args) {
        checkProject(args.project_id)
        const result = queryEditor(args.tab_id).update(args.sql, args.expected_revision)
        return { project_id: project.id, tab_id: launch.id, ...result, executed: false }
      },
      setQueryDisplay(args) {
        checkProject(args.project_id)
        const result = queryEditor(args.tab_id).setDisplay(
          args.display,
          args.expected_display_revision
        )
        return { project_id: project.id, tab_id: launch.id, ...result, executed: false }
      },
      configureLogs(args) {
        checkProject(args.project_id)
        if (launch.view !== 'logs') return openElsewhere()
        if (!initial.capabilities.logs) throw new Error('Logs are unavailable on this connection.')
        const next = {
          minutes: args.minutes,
          search: args.search,
          source: args.source ?? logSettings.source,
          level: args.level ?? logSettings.level,
        }
        setLogSettings(next)
        return { project_id: project.id, view: 'logs', ...next }
      },
      refresh() {
        if (launch.view === 'logs') setRefreshRevision((value) => value + 1)
        return {
          project_id: project.id,
          status: 'refresh_requested',
          tableRefreshed: editor.current?.refresh() ?? false,
          customSqlExecuted: false,
        }
      },
    })
  })

  const label = `${project.name} ${launch.view === 'logs' ? 'logs' : 'SQL'}`

  if (launch.view === 'logs')
    return (
      <main className="flex h-full flex-col bg-background" aria-label={label}>
        <LogsView
          project={project}
          enabled={!!initial.capabilities.logs}
          settings={logSettings}
          onSettingsChange={setLogSettings}
          logs={logs.value}
          onRefresh={() => setRefreshRevision((value) => value + 1)}
          selectionSharing={host.context}
          onAsk={askAgentFor(host.ask, initial)}
          agentName={host.agentName}
        />
      </main>
    )

  const Editor = isInline ? QueryBlock : QueryEditor
  return (
    <main
      className={isInline ? 'bg-background' : 'flex h-full flex-col bg-background'}
      aria-label={label}
    >
      <Editor
        ref={editor}
        onRun={actions.onRun}
        onSaveRow={initial.capabilities.readOnly ? undefined : actions.saveRow}
        SqlEditor={SqlEditor}
        readOnly={initial.capabilities.readOnly}
        title={launch.title}
        onExpand={host.expand}
        source={launch.source}
        logWindow={logWindow}
        initialSql={launch.sql}
        initialResult={launch.result}
        initialDisplay={launch.display}
        onDirtyChange={setIsDirty}
      />
    </main>
  )
}
