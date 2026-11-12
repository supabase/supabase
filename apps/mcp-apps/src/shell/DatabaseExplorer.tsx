import type { Bootstrap, Project } from '@supabase/mcp-server-supabase/apps'
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { Loadable } from 'surfaces/common'
import { Explorer, type ExplorerHandle, type ExplorerState } from 'surfaces/explorer'

import { useApp } from '../host/app-context'
import { useLoadable, useProjectActions } from '../host/use-app-data'

const mapLoad = <T, U>(value: Loadable<T>, map: (data: T) => U): Loadable<U> =>
  value.status === 'success' ? { status: 'success', data: map(value.data) } : value

/**
 * The shared Explorer over this app's MCP data: loads a project's schemas and tables, runs
 * queries and saves rows through the server's app-only tools.
 */
export function DatabaseExplorer({
  project,
  context,
  initialSchema,
  initialTable,
  refreshRevision,
  onStateChange,
  ref,
}: {
  project: Project
  context: Bootstrap
  initialSchema?: string
  initialTable?: string
  /** Bump to reload schemas and tables. */
  refreshRevision: number
  onStateChange?: (state: ExplorerState) => void
  ref?: Ref<ExplorerHandle | null>
}) {
  const { data, SqlEditor } = useApp()
  const actions = useProjectActions(project.id)
  const [schema, setSchema] = useState(initialSchema ?? 'public')
  const [retryRevision, setRetryRevision] = useState(0)
  const explorer = useRef<ExplorerHandle | null>(null)

  const schemas = useLoadable(JSON.stringify([project.id, retryRevision, refreshRevision]), () =>
    data.listSchemas({ project_id: project.id })
  )
  const tables = useLoadable(
    JSON.stringify([project.id, schema, retryRevision, refreshRevision]),
    schema ? () => data.listTables({ project_id: project.id, schemas: [schema] }) : undefined
  )

  // A stable handle for the host; the Explorer's own handle changes as it renders.
  useImperativeHandle(
    ref,
    () => ({
      openTable: (entity) => explorer.current!.openTable(entity),
      openQuery: (query) => explorer.current!.openQuery(query),
      editor: (id) => explorer.current?.editor(id),
    }),
    []
  )

  // Deep links and launches open their table once, after the Explorer mounts.
  useEffect(() => {
    if (initialTable)
      explorer.current?.openTable({ schema: initialSchema ?? 'public', name: initialTable })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Explorer
      ref={explorer}
      capabilities={context.capabilities}
      schema={schema}
      onSchemaChange={setSchema}
      schemas={mapLoad(schemas.value, (result) => result.schemas.map((item) => item.name))}
      tables={mapLoad(tables.value, (result) => result.tables)}
      onRetryNavigation={() => setRetryRevision((value) => value + 1)}
      onRunQuery={actions.onRun}
      onSaveRow={actions.saveRow}
      SqlEditor={SqlEditor}
      onStateChange={onStateChange}
    />
  )
}
