import { useLayoutEffect, useRef, useState } from 'react'
import type { Bootstrap, LogSettings, Project } from 'surfaces/contract'
import { EXPLORER_QUERY_ID, type ExplorerHandle, type ExplorerState } from 'surfaces/explorer'
import { LogsView } from 'surfaces/logs'
import { entityId } from 'surfaces/query'

import { useApp } from '../host/app-context'
import { explorerWorkspace } from '../host/explorer-tools'
import { askAgentFor, projectPageContext } from '../host/project-prompts'
import { useLogs } from '../host/use-app-data'
import { DatabaseExplorer } from './DatabaseExplorer'
import { ProjectHomeScreen } from './ProjectHomeScreen'

export type ProjectView = 'home' | 'database' | 'logs'

const NO_EXPLORER_STATE: ExplorerState = {
  view: 'none',
  activeId: null,
  query: { isOpen: false, isDirty: false, source: 'database' },
}

/**
 * A browsable project in this app: Home, the database Explorer and Logs, one at a time. Views
 * stay mounted once opened so switching keeps their state. It publishes row-free agent
 * context and binds the agent's workspace tools.
 */
export function ProjectExplorer({
  project,
  context,
  view,
  onViewChange,
  initialSchema,
  initialTable,
  refreshRevision,
}: {
  project: Project
  context: Bootstrap
  view: ProjectView
  onViewChange: (view: ProjectView) => void
  initialSchema?: string
  initialTable?: string
  refreshRevision: number
}) {
  const { agent: host, workspace } = useApp()
  const { capabilities } = context
  const [opened, setOpened] = useState<ProjectView[]>([view])
  const isOpen = (name: ProjectView) => name === view || opened.includes(name)
  if (!opened.includes(view)) setOpened((current) => [...current, view])

  const [navigationRevision, setNavigationRevision] = useState(0)
  const [logSettings, setLogSettings] = useState<LogSettings>({ minutes: 60, search: '' })
  const [logsRevision, setLogsRevision] = useState(0)
  const [state, setState] = useState<ExplorerState>(NO_EXPLORER_STATE)
  const explorer = useRef<ExplorerHandle | null>(null)
  // Agent actions that arrive before the Explorer has mounted run once it does.
  const pending = useRef<(() => void)[]>([])
  function handleExplorerRef(handle: ExplorerHandle | null) {
    explorer.current = handle
    if (!handle) return
    const queued = pending.current
    pending.current = []
    queued.forEach((run) => run())
  }
  const logs = useLogs(project, logSettings, refreshRevision + logsRevision, isOpen('logs'))

  // Context contains navigation metadata only. SQL is read on demand or explicitly attached.
  const snapshot = {
    ...projectPageContext(project, context),
    view: view === 'database' ? (state.view === 'none' ? 'database' : state.view) : view,
    schema: state.entity?.schema ?? initialSchema ?? 'public',
    table: state.entity?.name ?? null,
    source: state.view === 'query' ? state.query.source : null,
    dirty: state.query.isDirty,
    ...(view === 'logs' ? { logs: logSettings } : {}),
  }

  useLayoutEffect(() => {
    host.context?.publish(snapshot)
    const tools = explorerWorkspace({
      project,
      capabilities,
      explorer: () => explorer.current,
      state,
      snapshot,
      onRefreshNavigation: () => {
        setNavigationRevision((value) => value + 1)
        if (view === 'logs') setLogsRevision((value) => value + 1)
      },
      configureLogs(args) {
        if (args.project_id !== project.id)
          throw new Error('The selected project changed. Read the workspace again.')
        if (!(capabilities.logQueries ?? capabilities.logs))
          throw new Error('Logs access is not enabled on this connection.')
        setLogSettings({
          minutes: args.minutes,
          search: args.search,
          source: args.source,
          level: args.level,
        })
        onViewChange('logs')
        return { ...args, project_id: project.id, view: 'logs' }
      },
    })
    const checkProject = (id: string) => {
      if (id !== project.id)
        throw new Error('The selected project changed. Read the workspace again.')
    }
    return workspace?.bind({
      ...tools,
      // The Explorer must be showing for the agent's draft or table to be seen.
      openQuery(args) {
        onViewChange('database')
        if (explorer.current) return tools.openQuery(args)
        checkProject(args.project_id)
        pending.current.push(() => tools.openQuery(args))
        return { project_id: project.id, tab_id: EXPLORER_QUERY_ID, revision: 0, executed: false }
      },
      openTable(args) {
        onViewChange('database')
        if (explorer.current) return tools.openTable(args)
        checkProject(args.project_id)
        if (!capabilities.database)
          throw new Error('Database access is not enabled on this connection.')
        pending.current.push(() => tools.openTable(args))
        return {
          project_id: project.id,
          tab_id: entityId({ schema: args.schema, name: args.table }),
          status: 'opened',
          data_status: 'Check read_workspace for load status.',
        }
      },
    })
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto" hidden={view !== 'home'}>
        <ProjectHomeScreen project={project} context={context} refreshRevision={refreshRevision} />
      </div>
      {isOpen('database') && (
        <div className="flex min-h-0 min-w-0 flex-1" hidden={view !== 'database'}>
          <DatabaseExplorer
            ref={handleExplorerRef}
            project={project}
            context={context}
            initialSchema={initialSchema}
            initialTable={initialTable}
            refreshRevision={refreshRevision + navigationRevision}
            onStateChange={setState}
          />
        </div>
      )}
      {isOpen('logs') && (
        <div className="flex min-h-0 flex-1 flex-col" hidden={view !== 'logs'}>
          <LogsView
            project={project}
            enabled={!!capabilities.logs}
            active={view === 'logs'}
            settings={logSettings}
            onSettingsChange={setLogSettings}
            logs={logs.value}
            onRefresh={logs.reload}
            selectionSharing={host.context}
            onAsk={askAgentFor(host.ask, context)}
            agentName={host.agentName}
          />
        </div>
      )}
    </div>
  )
}
