import type {
  LogSettings,
  NotebookSummary,
  Project,
  ProjectOverview,
  Row,
} from '@supabase/mcp-server-supabase/apps'
import { useEffect, useState } from 'react'
import { errorMessage, type Loadable } from 'surfaces/common'
import { executeQuery, type RunQuery } from 'surfaces/query'
import type { ReloadRow, SaveRow } from 'surfaces/row'

import { useApp } from './app-context'

/**
 * Loads `load()` whenever `key` changes, ignoring responses that arrive after a
 * newer request. Passing no loader yields `idle`.
 */
export function useLoadable<T>(key: string, load: (() => Promise<T>) | undefined) {
  const [state, setState] = useState<{ key: string; value: Loadable<T> }>()
  const [revision, setRevision] = useState(0)
  const fullKey = `${key}#${revision}`
  const isEnabled = !!load

  useEffect(() => {
    if (!load) return
    let isCurrent = true
    load()
      .then((data) => isCurrent && setState({ key: fullKey, value: { status: 'success', data } }))
      .catch(
        (e: unknown) =>
          isCurrent &&
          setState({ key: fullKey, value: { status: 'error', message: errorMessage(e) } })
      )
    return () => {
      isCurrent = false
    }
    // `load` is recreated each render; `fullKey` decides when to load again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey, isEnabled])

  let value: Loadable<T> = { status: 'idle' }
  if (isEnabled) value = state?.key === fullKey ? state.value : { status: 'loading' }
  return { value, reload: () => setRevision((n) => n + 1) }
}

export function useProjectOverview(project: Project, refreshRevision: number) {
  const { data } = useApp()
  return useLoadable<ProjectOverview>(
    JSON.stringify([project.id, refreshRevision]),
    // Each section reports when it is unavailable, so the overview is always read.
    async () => {
      const overview = await data.getProjectOverview({ project_id: project.id })
      if (overview.projectId !== project.id)
        throw new Error('The overview belongs to another project. Refresh to try again.')
      return overview
    }
  )
}

/** A project's saved notebooks, read through the server's own `list_notebooks`. */
export function useNotebooks(project: Project, refreshRevision: number) {
  const { data } = useApp()
  return useLoadable<NotebookSummary[]>(
    JSON.stringify([project.id, refreshRevision]),
    async () => (await data.listNotebooks({ project_id: project.id })).notebooks
  )
}

/** Loads logs only while `isOpen`, so a hidden Logs tab does not read in the background. */
export function useLogs(
  project: Project,
  settings: LogSettings,
  refreshRevision: number,
  isOpen = true
) {
  const { data, capabilities } = useApp()
  const { minutes, source = 'all', level = 'all' } = settings
  return useLoadable<Row[]>(
    JSON.stringify([project.id, minutes, source, level, refreshRevision]),
    capabilities.logs && isOpen
      ? async () => {
          const result = await data.getLogs({
            project_id: project.id,
            minutes,
            ...(source !== 'all' ? { source } : {}),
            ...(level !== 'all' ? { level } : {}),
          })
          return result.rows
        }
      : undefined
  )
}

/** Query and row actions for one project, carried out over the app's data client. */
export function useProjectActions(projectId: string) {
  const { data } = useApp()
  const onRun: RunQuery = ({ sql, entity, offset, limit, source, logWindow }) =>
    executeQuery(data, projectId, sql, entity, offset, limit, source, logWindow)
  const saveRow: SaveRow = async (change) => {
    const target = { project_id: projectId, schema: change.schema, table: change.table }
    const result =
      change.kind === 'update'
        ? await data.updateRow({
            ...target,
            key: change.key,
            values: change.values,
            previous: change.previous,
          })
        : await data.insertRow({ ...target, values: change.values })
    const row = result.rows[0]?.row
    if (!row) throw new Error('The saved row was not returned. Refresh before editing again.')
    return row
  }
  const onReloadRow: ReloadRow = ({ schema, table, key }) =>
    data.readRow({ project_id: projectId, schema, table, key })
  return { onRun, saveRow, onReloadRow }
}
