/**
 * PROTOTYPE — the shared QueryCell component (PR E4).
 *
 * This is the "generic SQL editor" from the design diagram: toolbar, SQL editor,
 * results (table or chart). It is rendered by all three surfaces:
 *
 *   - Snippet view    — editable, via the snippet adapter
 *   - Notebook cell   — editable
 *   - Agent chat block — `readOnly`, still runnable behind approval
 *
 * It is fully controlled. It owns no fetching and no persistence: the caller
 * passes `result` and handles `onRun`, so each surface decides where results
 * live. Surface-specific chrome comes in through the three slots.
 */

import { AlertTriangle, Play } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Badge, Button, cn } from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { isWriteQuery } from './ExplorerPrototype.mocks'
import type {
  CellResultState,
  CellSource,
  QueryCellModel,
  QueryDisplay,
} from './ExplorerPrototype.types'
import { QueryCellDisplay } from './QueryCellDisplay'
import { QueryCellDisplayConfig } from './QueryCellDisplayConfig'
import { QueryCellSourceMenu } from './QueryCellSourceMenu'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'

const editorHeight = (sql: string) => {
  const lines = sql.split('\n').length
  return Math.min(Math.max(lines * 19 + 24, 80), 260)
}

export interface QueryCellProps {
  value: QueryCellModel
  result: CellResultState
  /** Effective limit, already resolved from cell override + notebook default. */
  rowLimit: number
  readOnly?: boolean
  /**
   * Below the results — assistant approval, notebook run-mode hints.
   *
   * There is deliberately no header or actions slot: controls that belong to
   * the *surface* rather than the query (reorder, delete, insert) live outside
   * this component, so the cell renders identically everywhere it appears.
   */
  footerSlot?: ReactNode
  onChange?: (next: QueryCellModel) => void
  onRun?: () => void
}

export const QueryCell = ({
  value,
  result,
  rowLimit,
  readOnly = false,
  footerSlot,
  onChange,
  onRun,
}: QueryCellProps) => {
  const [pendingWriteConfirm, setPendingWriteConfirm] = useState(false)

  const isWrite = isWriteQuery(value.query.sql)
  const isRunning = result.status === 'running'
  const columns = result.status === 'success' ? Object.keys(result.rows[0] ?? {}) : []

  const update = (next: Partial<QueryCellModel>) => onChange?.({ ...value, ...next })
  const updateSource = (source: CellSource) => update({ query: { ...value.query, source } })
  const updateSql = (sql: string) => update({ query: { ...value.query, sql } })
  const updateDisplay = (display: QueryDisplay) => update({ display })
  const updateRowLimit = (limit: number) =>
    update({ execution: { ...value.execution, row_limit: limit } })

  const handleRun = () => {
    if (isRunning) return
    // Write queries never run without an explicit confirmation, on any surface.
    if (isWrite && !pendingWriteConfirm) {
      setPendingWriteConfirm(true)
      return
    }
    setPendingWriteConfirm(false)
    onRun?.()
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-md border bg-surface-100 shadow-xs">
      {/* Toolbar */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b px-2">
        {readOnly ? (
          <span className="truncate px-1 text-xs font-medium">{value.name}</span>
        ) : (
          // Borderless and ring-less: the cell already has a border, and the
          // input's own default border/focus ring reads as a double outline.
          <input
            value={value.name}
            aria-label="Cell name"
            onChange={(event) => update({ name: event.target.value })}
            className={cn(
              'min-w-0 flex-1 truncate rounded-sm border-0 bg-transparent px-1 text-xs font-medium shadow-none',
              'outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0',
              'focus-visible:outline-none focus-visible:ring-0 focus:bg-surface-200'
            )}
          />
        )}

        {isWrite && (
          <Badge variant="warning" className="shrink-0">
            Write
          </Badge>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <QueryCellSourceMenu
            source={value.query.source}
            rowLimit={rowLimit}
            disabled={readOnly}
            onSourceChange={updateSource}
            onRowLimitChange={updateRowLimit}
          />
          {columns.length > 0 && (
            <QueryCellDisplayConfig
              display={value.display}
              columns={columns}
              onChange={updateDisplay}
            />
          )}
          <Button
            variant="text"
            size="tiny"
            className="w-7 px-0"
            icon={<Play size={14} strokeWidth={1.5} />}
            loading={isRunning}
            disabled={isRunning || !onRun}
            aria-label="Run cell"
            onClick={handleRun}
          />
        </div>
      </div>

      {/* Write confirmation */}
      {pendingWriteConfirm && (
        <div className="flex items-center gap-3 border-b bg-warning-200 px-3 py-2">
          <AlertTriangle size={16} className="shrink-0 text-warning-600" />
          <p className="flex-1 text-xs text-foreground-light">
            This query modifies data and will not run automatically.
          </p>
          <Button variant="default" size="tiny" onClick={() => setPendingWriteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="warning" size="tiny" onClick={handleRun}>
            Run anyway
          </Button>
        </div>
      )}

      {/* SQL editor */}
      <div className="shrink-0 border-b" style={{ height: editorHeight(value.query.sql) }}>
        {readOnly ? (
          <CodeBlock
            hideLineNumbers
            wrapLines={false}
            value={value.query.sql}
            language="sql"
            className={cn(
              'block h-full w-full max-w-none overflow-auto rounded-none! border-0 bg-transparent! px-3.5! py-3! text-foreground',
              '[&>code]:m-0 [&>code>span]:text-foreground'
            )}
          />
        ) : (
          <CodeEditor
            id={value.id}
            language="pgsql"
            value={value.query.sql}
            autofocus={false}
            hideLineNumbers
            onInputChange={(next) => updateSql(next ?? '')}
            actions={{ runQuery: { enabled: true, callback: handleRun } }}
            options={{ scrollBeyondLastLine: false, padding: { top: 10, bottom: 10 } }}
          />
        )}
      </div>

      {/* Results */}
      {result.status === 'running' && (
        <div className="w-full p-3">
          <ShimmeringLoader />
        </div>
      )}
      {result.status === 'error' && (
        <div className="w-full px-3.5 py-2">
          <span className="font-mono text-xs text-destructive-600">ERROR: {result.message}</span>
        </div>
      )}
      {result.status === 'success' && (
        <>
          <QueryCellDisplay display={value.display} rows={result.rows} />
          <p className="border-t px-3 py-1 font-mono text-xs text-foreground-lighter">
            {result.rows.length} rows · limit {result.rowLimitApplied}
          </p>
        </>
      )}

      {footerSlot}
    </div>
  )
}
