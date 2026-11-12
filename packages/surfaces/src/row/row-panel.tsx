import {
  rowPanelSchema,
  type Bootstrap,
  type Row,
  type RowPanel as RowLaunch,
  type Table,
} from '@supabase/mcp-server-supabase/apps'
import { RefreshCwIcon } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
} from 'react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { errorMessage } from '../common'
import { RowEditorForm, type RowEditorFormState, type SaveRow } from './row-editor'
import { rowKey } from './row-values'

/** Row-free metadata about the panel, for agent context and mounted workspace tools. */
export interface RowPanelSnapshot {
  project_id: string
  project_name: string
  server: Bootstrap['server']
  capabilities: Bootstrap['capabilities']
  surface: 'conversation_panel'
  view: 'row'
  active_tab: string
  schema: string
  table: string
  dirty: boolean
  busy: boolean
  read_only: boolean
  available_actions: string[]
}

/** What a host shell binds to its workspace tools. Neither method returns row contents. */
export interface RowPanelHandle {
  read(): RowPanelSnapshot
  /** Reloads the row. Throws while edits or an operation are pending. */
  refresh(): void
}

const REFRESH_BLOCKED =
  'Save or discard row edits and wait for any running operation before refreshing.'

/** Reads a row again by its complete primary key. */
export type ReloadRow = (target: {
  schema: string
  table: string
  key: Row
}) => Promise<{ table: Table; row: Row }>

export function RowPanel({
  initial,
  launch,
  onReload,
  onSave,
  onSnapshotChange,
  ref,
}: {
  initial: Bootstrap
  launch: RowLaunch
  onReload: ReloadRow
  onSave: SaveRow
  /** Called with row-free metadata whenever it changes, e.g. to share as agent context. */
  onSnapshotChange?: (snapshot: RowPanelSnapshot) => void
  ref?: Ref<RowPanelHandle>
}) {
  const project = initial.projects.find((item) => item.id === launch.project_id)
  const projectName = project?.name ?? launch.project_id
  const [record, setRecord] = useState({ table: launch.table, row: launch.row })
  // Remounts the form with a fresh baseline after a save, reset or refresh.
  const [formRevision, setFormRevision] = useState(0)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editorState, setEditorState] = useState<RowEditorFormState>({ dirty: false, busy: false })
  const editorStateRef = useRef(editorState)
  const isRefreshing = useRef(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const handleStateChange = useCallback((next: RowEditorFormState) => {
    editorStateRef.current = next
    setEditorState(next)
  }, [])

  const isReadOnly = initial.capabilities.readOnly || !record.table.editable
  const isRefreshDisabled = isLoading || editorState.busy || editorState.dirty
  const snapshot: RowPanelSnapshot = {
    project_id: launch.project_id,
    project_name: projectName,
    server: initial.server,
    capabilities: initial.capabilities,
    surface: 'conversation_panel',
    view: 'row',
    active_tab: launch.id,
    schema: record.table.schema,
    table: record.table.name,
    dirty: editorState.dirty,
    busy: editorState.busy || isLoading,
    read_only: isReadOnly,
    available_actions: ['read_workspace', 'refresh_view'],
  }

  function refresh() {
    const { dirty, busy } = editorStateRef.current
    if (dirty || busy || isRefreshing.current) throw new Error(REFRESH_BLOCKED)
    isRefreshing.current = true
    setIsLoading(true)
    setError('')
    setNotice('')
    onReload({
      schema: record.table.schema,
      table: record.table.name,
      key: rowKey(record.table, record.row),
    })
      .then((result) => {
        if (!isMounted.current) return
        // The same check as a launch: a refreshed row must still be complete.
        const next = rowPanelSchema.parse({ ...launch, ...result })
        setRecord({ table: next.table, row: next.row })
        setFormRevision((value) => value + 1)
        setNotice('Row refreshed')
      })
      .catch((e: unknown) => {
        if (isMounted.current) setError(errorMessage(e))
      })
      .finally(() => {
        isRefreshing.current = false
        if (isMounted.current) setIsLoading(false)
      })
  }

  useImperativeHandle(ref, () => ({ read: () => snapshot, refresh }))

  // Keeps the host's view of this panel current. Never includes row contents.
  useLayoutEffect(() => {
    onSnapshotChange?.({ ...snapshot })
  })

  if (!project) {
    return (
      <main className="flex h-full flex-col bg-background p-5">
        <Admonition
          type="warning"
          title="Project not available"
          description="This project isn’t available on this connection."
        />
      </main>
    )
  }

  const title = `Edit row in ${record.table.schema}.${record.table.name}`
  return (
    <main
      aria-label={`${projectName} row editor`}
      className="flex h-full min-h-0 flex-col bg-background text-foreground"
    >
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-5">
        <h1 title={title} className="min-w-0 flex-1 truncate text-sm text-foreground">
          {title}
        </h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="text"
              size="tiny"
              aria-label="Refresh row"
              className="w-7 px-0 text-foreground-lighter hover:text-foreground"
              icon={<RefreshCwIcon size={15} />}
              disabled={isRefreshDisabled}
              onClick={() => refresh()}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">Refresh row</TooltipContent>
        </Tooltip>
      </header>
      {notice && (
        <p role="status" className="border-b px-5 py-2 text-xs text-foreground-light">
          {notice}
        </p>
      )}
      {error && (
        <div className="px-5 pt-3">
          <Admonition
            type="warning"
            title="Failed to refresh row"
            description={`Error: ${error}`}
          />
        </div>
      )}
      <RowEditorForm
        key={formRevision}
        table={record.table}
        onSave={onSave}
        row={record.row}
        readOnly={initial.capabilities.readOnly || isLoading}
        onStateChange={handleStateChange}
        cancelLabel="Reset changes"
        close={() => {
          setFormRevision((value) => value + 1)
          setNotice('')
        }}
        saved={(row) => {
          setRecord((current) => ({ ...current, row }))
          setFormRevision((value) => value + 1)
          setNotice('Row saved')
        }}
      />
    </main>
  )
}
