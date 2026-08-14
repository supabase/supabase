/**
 * PROTOTYPE — the shared QueryCell component (PR E4).
 *
 * This is the "generic SQL editor" from the design diagram: toolbar, SQL editor,
 * results (table or chart). It is rendered by both surfaces:
 *
 *   - Notebook cell   — editable
 *   - Agent chat block — `readOnly`, still runnable behind approval
 *
 * It is fully controlled. It owns no fetching and no persistence: the caller
 * passes `result` and handles `onRun`, so each surface decides where results
 * live. Surface-specific chrome comes in through the three slots.
 */

import { AlertTriangle, Eye, EyeOff, NotebookText, Play, Sparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { isWriteQuery } from './ExplorerPrototype.mocks'
import type {
  CellResultState,
  CellSource,
  QueryCellModel,
  QueryDisplay,
} from './ExplorerPrototype.types'
import { RESOURCE_ICON } from './ExplorerResources'
import { QueryCellDisplay } from './QueryCellDisplay'
import { QueryCellDisplayConfig } from './QueryCellDisplayConfig'
import { QueryCellSourceMenu } from './QueryCellSourceMenu'
import { TabToolbar } from './TabToolbar'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'

const editorHeight = (sql: string) => {
  const lines = sql.split('\n').length
  return Math.min(Math.max(lines * 19 + 24, 80), 260)
}

export type NotebookTarget = { id: string; title: string }

export interface QueryCellProps {
  value: QueryCellModel
  result: CellResultState
  /** Effective limit, already resolved from cell override + notebook default. */
  rowLimit: number
  /** Turns the cell into a tab surface: no outer frame and results fill the tab. */
  full?: boolean
  /** Initial editor visibility. A user toggle remains local to the query block. */
  defaultSqlVisible?: boolean
  readOnly?: boolean
  /**
   * Below the results — assistant approval, notebook run-mode hints.
   *
   * There is deliberately no header or actions slot: controls that belong to
   * the *surface* rather than the query (reorder, delete, insert) live outside
   * this component, so the cell renders identically everywhere it appears.
  */
  footerSlot?: ReactNode
  /** Saved notebooks that can receive a copy of this query cell. */
  notebookTargets?: NotebookTarget[]
  onAddToNotebook?: (notebookId: string) => void
  onExplain?: () => void
  onChange?: (next: QueryCellModel) => void
  onRun?: () => void
}

export const QueryCell = ({
  value,
  result,
  rowLimit,
  full = false,
  defaultSqlVisible = true,
  readOnly = false,
  footerSlot,
  notebookTargets = [],
  onAddToNotebook,
  onExplain,
  onChange,
  onRun,
}: QueryCellProps) => {
  const [pendingWriteConfirm, setPendingWriteConfirm] = useState(false)
  const [isSqlVisible, setIsSqlVisible] = useState(defaultSqlVisible)

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

  const resultContent =
    result.status === 'idle' ? (
      <div className="flex flex-1 items-center justify-center p-3">
        <p className="text-xs text-foreground-light">Run the query to see results</p>
      </div>
    ) : result.status === 'running' ? (
      <div className="w-full p-3">
        <ShimmeringLoader />
      </div>
    ) : result.status === 'error' ? (
      <div className="w-full px-3.5 py-2">
        <span className="font-mono text-xs text-destructive-600">ERROR: {result.message}</span>
      </div>
    ) : (
      <>
        <QueryCellDisplay
          display={value.display}
          rows={result.rows}
          className={full ? 'min-h-0 max-h-none flex-1' : undefined}
        />
        <p className="border-t px-3 py-1 font-mono text-xs text-foreground-lighter">
          {result.rows.length} rows · limit {result.rowLimitApplied}
        </p>
      </>
    )

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden',
        full
          ? 'h-full min-h-0 border-0 shadow-none'
          : 'rounded-md border bg-muted shadow-xs'
      )}
    >
      <TabToolbar
        icon={RESOURCE_ICON.query}
        title={
          readOnly ? (
            <span className="block truncate text-sm">{value.name}</span>
          ) : (
            // Borderless and ring-less: the toolbar provides the framing.
            <input
              value={value.name}
              aria-label="Cell name"
              onChange={(event) => update({ name: event.target.value })}
              className={cn(
                'w-full truncate rounded-sm border-0 bg-transparent px-0 text-sm shadow-none',
                'outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0',
                'focus-visible:outline-none focus-visible:ring-0 focus:bg-surface-200'
              )}
            />
          )
        }
        actions={
          <>
            {isWrite && <Badge variant="warning">Write</Badge>}
            <QueryCellSourceMenu
              source={value.query.source}
              rowLimit={rowLimit}
              disabled={readOnly}
              onSourceChange={updateSource}
              onRowLimitChange={updateRowLimit}
            />
            {onAddToNotebook && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="text"
                    size="tiny"
                    className="w-7 px-0"
                    aria-label="Add to notebook"
                    disabled={notebookTargets.length === 0}
                    icon={<NotebookText size={14} />}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>Add to notebook</DropdownMenuLabel>
                  {notebookTargets.map((notebook) => (
                    <DropdownMenuItem
                      key={notebook.id}
                      onClick={() => onAddToNotebook(notebook.id)}
                    >
                      {notebook.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {onExplain && (
              <Button
                variant="text"
                size="tiny"
                className="w-7 px-0"
                aria-label="Explain"
                icon={<Sparkles size={14} />}
                onClick={onExplain}
              />
            )}
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
              icon={isSqlVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              aria-label={isSqlVisible ? 'Hide SQL' : 'Show SQL'}
              aria-pressed={isSqlVisible}
              onClick={() => setIsSqlVisible((visible) => !visible)}
            />
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
          </>
        }
      />

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

      {isSqlVisible && (
        /* SQL editor */
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
              // CodeEditor supplies a small first-line view zone; avoid stacking an
              // additional top inset on this compact query-block surface.
              options={{ scrollBeyondLastLine: false, padding: { top: 0, bottom: 10 } }}
            />
          )}
        </div>
      )}

      {/* Always present, so an unrun query still reserves a results surface. */}
      <div
        className={cn('flex min-h-24 w-full flex-col', full && 'min-h-0 flex-1 overflow-hidden')}
      >
        {resultContent}
      </div>

      {footerSlot}
    </div>
  )
}
