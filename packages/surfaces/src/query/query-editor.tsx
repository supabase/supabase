import { CodeSquareIcon, RefreshCwIcon, Table2Icon } from 'lucide-react'
import { useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react'
import { Admonition } from 'ui-patterns/Admonition'

import type { LogWindow, QueryDisplay, QuerySource, Row } from '../contract'
import { ExplorerToolbarAction } from '../explorer/explorer-toolbar'
import { QueryEditorFrame } from '../explorer/query-editor-frame'
import { RowEditor, type SaveRow } from '../row/row-editor'
import { QueryChartResults } from './query-chart-results'
import { QueryDisplayState } from './query-display'
import { QueryDraftState } from './query-draft'
import { QueryEditorFooter } from './query-editor-footer'
import { InsertRowButton } from './query-editor-parts'
import { isTableQuery, tableSql, type Entity, type QueryResult, type RunQuery } from './query-model'
import { QueryTableResults } from './query-table-results'
import type { SqlEditorComponent } from './sql-editor'
import { useQueryRun } from './use-query-run'

export interface QueryEditorState {
  sql: string
  source: QuerySource
  logWindow?: LogWindow
  revision: number
  running: boolean
  error: string | null
  hasResults: boolean
  resultsStale: boolean
  columns: string[]
  display: QueryDisplay
  displayRevision: number
}

/** What a workspace shell and agent tools can do with a mounted editor. Never executes custom SQL. */
export interface QueryEditorHandle {
  read(): QueryEditorState
  update(sql: string, revision: number): { revision: number }
  setDisplay(
    display: QueryDisplay,
    expectedRevision: number
  ): { display: QueryDisplay; displayRevision: number }
  /** Reruns an untouched table query. Returns false for custom SQL, which never reruns. */
  refresh(): boolean
}

export interface QueryEditorProps {
  /** Runs SQL for this editor. Agent edits never run until the user clicks Run. */
  onRun: RunQuery
  /** Saves a row edited from the results. Omit to make results read-only. */
  onSaveRow?: SaveRow
  SqlEditor: SqlEditorComponent
  readOnly: boolean
  title: string
  variant?: 'viewport' | 'embedded'
  toolbarActions?: ReactNode
  initialSql: string
  /** Results delivered with a launch, so mounting never runs the query again. */
  initialResult?: QueryResult
  initialDisplay?: QueryDisplay
  source?: QuerySource
  logWindow?: LogWindow
  /**
   * Shows this table's rows instead of a SQL draft. A table tab has no editable SQL and stays a
   * table: Open query copies its SQL into a new query via `onOpenQuery`.
   */
  entity?: Entity
  /** Opens SQL in a new query, e.g. from a table tab. Omit to hide Open query. */
  onOpenQuery?: (query: { title: string; sql: string }) => void
  onDirtyChange: (isDirty: boolean) => void
  ref?: Ref<QueryEditorHandle>
}

const ERROR_SNAPSHOT_LIMIT = 4000

export function QueryEditor({
  onRun,
  onSaveRow,
  SqlEditor,
  readOnly,
  title,
  variant = 'viewport',
  toolbarActions,
  initialSql,
  initialResult,
  initialDisplay,
  source = 'database',
  logWindow,
  entity,
  onOpenQuery,
  onDirtyChange,
  ref,
}: QueryEditorProps) {
  const isEmbedded = variant === 'embedded'
  const isTable = !!entity && source === 'database'

  const [sql, setSql] = useState(initialSql)
  const draft = useRef(new QueryDraftState(initialSql))
  const displayState = useRef(new QueryDisplayState(initialDisplay))
  const [display, setDisplay] = useState(displayState.current.display)
  const [isQueryVisible, setIsQueryVisible] = useState(!isEmbedded || !initialResult)
  const [editing, setEditing] = useState<{ row?: Row }>()
  const [notice, setNotice] = useState('')
  const { result, error, isBusy, elapsedMs, limit, run, isRunning } = useQueryRun({
    onRun,
    entity,
    source,
    logWindow,
    initialResult,
    shouldAutoRun: !initialResult && isTableQuery(initialSql, entity),
    getSql: () => draft.current.sql,
    onStart: () => setNotice(''),
  })

  const isStale = !!result && result.sql !== sql
  // Edit access comes only from the result's own verified metadata, never from the tab's table.
  const table = isStale ? undefined : result?.table
  const canInsert = !!table?.editable && !readOnly && !!onSaveRow
  const canEdit = canInsert && !!table?.primary_keys.length
  const columns =
    result?.table?.columns.map((column) => column.name) ??
    Array.from(new Set(result?.rows.flatMap((row) => Object.keys(row)) ?? []))
  const isRunDisabled = isBusy || !!editing || !sql.trim()

  function changeDisplay(value: QueryDisplay, expectedRevision?: number) {
    const next = displayState.current.change(value, expectedRevision)
    setDisplay(next.display)
    return next
  }

  function handleSqlChange(value: string) {
    draft.current.change(value)
    setSql(value)
    onDirtyChange(value !== initialSql)
  }

  function handleRun() {
    if (!editing) void run()
  }

  function handleSaved() {
    const isInsert = !editing?.row
    setEditing(undefined)
    void run(isInsert ? 0 : (result?.offset ?? 0)).then(() =>
      setNotice(isInsert ? 'Row inserted' : 'Row saved')
    )
  }

  useImperativeHandle(ref, () => ({
    read: () => ({
      sql: draft.current.sql,
      source,
      ...(logWindow ? { logWindow } : {}),
      revision: draft.current.revision,
      running: isRunning(),
      error: error ? error.slice(0, ERROR_SNAPSHOT_LIMIT) : null,
      hasResults: !!result,
      resultsStale: !!result && result.sql !== draft.current.sql,
      columns,
      display: displayState.current.display,
      displayRevision: displayState.current.revision,
    }),
    update(value, expectedRevision) {
      if (isTable) {
        throw new Error(
          'This tab shows a table and has no editable SQL. Open a new query to draft SQL instead.'
        )
      }
      if (editing || isRunning()) {
        throw new Error(
          'Close the row editor and wait for the running query before changing this draft.'
        )
      }
      const next = draft.current.change(value, expectedRevision)
      setSql(next.sql)
      setIsQueryVisible(true)
      onDirtyChange(next.sql !== initialSql)
      return { revision: next.revision }
    },
    setDisplay: changeDisplay,
    refresh() {
      if (editing) throw new Error('Close the row editor before refreshing this table.')
      if (isRunning()) throw new Error('A query is already running.')
      if (!isTableQuery(draft.current.sql, entity)) return false
      void run()
      return true
    },
  }))

  const banners = (
    <>
      {error && (
        <div className="px-3 py-2">
          <Admonition type="warning" title="Failed to run query" description={`Error: ${error}`} />
        </div>
      )}
      {isStale && (
        <p role="status" className="px-3 py-2 text-xs text-foreground-light">
          Showing previous results. Run your query to update them.
        </p>
      )}
      {notice && (
        <p role="status" className="px-3 py-2 text-xs text-foreground-light">
          {notice}
        </p>
      )}
    </>
  )

  return (
    <>
      <QueryEditorFrame
        variant={isEmbedded ? 'embedded' : 'viewport'}
        className={isEmbedded ? undefined : 'h-full'}
        title={title}
        icon={isTable ? <Table2Icon size={16} strokeWidth={2} /> : undefined}
        showQuery={isQueryVisible}
        onShowQueryChange={setIsQueryVisible}
        hasQuery={!isTable}
        editor={({ isSplit }) => (
          <SqlEditor
            value={sql}
            source={source}
            onChange={handleSqlChange}
            onRun={handleRun}
            className={isSplit ? 'h-full' : 'max-h-72'}
          />
        )}
        results={
          <div className="flex min-h-0 flex-1 flex-col overflow-auto">
            {banners}
            {!isTable && display.view === 'chart' && result && (
              <QueryChartResults
                title={title}
                chart={display.chart}
                result={result}
                source={source}
                isBusy={isBusy}
                className={isEmbedded ? 'flex h-72 flex-col' : 'flex min-h-0 flex-1 flex-col'}
              />
            )}
            {(isTable || display.view === 'table' || !result) && (
              <QueryTableResults
                result={result}
                table={table}
                columns={columns}
                isBusy={isBusy}
                canEdit={canEdit}
                canInsert={canInsert}
                source={source}
                onEditRow={(row) => setEditing({ row })}
                className="min-h-0 flex-1 overflow-auto"
              />
            )}
            {table && !canEdit && (
              <p className="border-t px-3 py-1.5 text-xs text-foreground-lighter">
                {readOnly || !table.editable
                  ? 'This table is read-only.'
                  : 'Row editing requires a primary key.'}
              </p>
            )}
          </div>
        }
        footer={
          <QueryEditorFooter
            result={result}
            isBusy={isBusy}
            isStale={isStale}
            elapsedMs={elapsedMs}
            limit={limit}
            source={source}
            logWindow={logWindow}
            onPage={(offset, rowLimit) => void run(offset, rowLimit)}
          />
        }
        // A table's rows always show as a grid; result settings are for SQL.
        display={isTable ? undefined : display}
        displayResult={result}
        onDisplayChange={isTable ? undefined : (value) => changeDisplay(value)}
        toolbarActions={
          <>
            {isTable && (
              <ExplorerToolbarAction
                tooltip="Refresh table"
                icon={<RefreshCwIcon size={16} strokeWidth={2} />}
                disabled={isBusy || !!editing}
                onClick={() => void run(result?.offset ?? 0)}
              />
            )}
            {isTable && onOpenQuery && (
              <ExplorerToolbarAction
                tooltip="Open query"
                icon={<CodeSquareIcon size={16} strokeWidth={2} />}
                onClick={() =>
                  onOpenQuery({ title: `${entity.name} query`, sql: tableSql(entity) })
                }
              />
            )}
            {(isTable || display.view === 'table') && canInsert && (
              <InsertRowButton
                // Separates the text button from the table's icon actions.
                className={isTable ? 'ml-2' : undefined}
                disabled={isBusy}
                onClick={() => setEditing({})}
              />
            )}
            {toolbarActions}
          </>
        }
        run={
          isTable
            ? undefined
            : {
                isExecuting: isBusy,
                isDisabled: isRunDisabled,
                hasSelection: false,
                onRun: () => void run(),
                onRunSelected: () => void run(),
              }
        }
      />
      {editing && table && onSaveRow && (
        <RowEditor
          table={table}
          onSave={onSaveRow}
          row={editing.row}
          close={() => setEditing(undefined)}
          saved={handleSaved}
        />
      )}
    </>
  )
}
