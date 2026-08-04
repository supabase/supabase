/**
 * PROTOTYPE — Notebook view.
 *
 * An ordered list of cells. Array position is both display order and execution
 * order — there is no separate ordering field. Query cells are a thin binding
 * around the shared QueryCell component (PR N8's shape).
 *
 * Width is deliberately mixed: query cells run the full width because results
 * and charts want the room, while markdown stays at a readable measure.
 */

import { Play, Settings } from 'lucide-react'
import { useEffect, useRef } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import type {
  CellResultState,
  NotebookCell,
  NotebookContent,
  QueryCellModel,
  RunMode,
} from '../ExplorerPrototype.types'
import { RESOURCE_ICON } from '../ExplorerResources'
import { QueryCell } from '../QueryCell'
import { TabToolbar } from '../TabToolbar'
import { resolveEffectiveRowLimit, resolveEffectiveRunMode } from '../useExplorerPrototypeState'
import { MarkdownCellView } from './MarkdownCellView'
import { NotebookCellShell } from './NotebookCellShell'

const ROW_LIMITS = [50, 100, 500, 1000]

/** Prose measure for markdown cells; query cells ignore this and fill the width. */
const PROSE_WIDTH = 'mx-auto w-full max-w-3xl'

interface NotebookViewProps {
  title: string
  notebook: NotebookContent
  results: Record<string, CellResultState>
  onCellChange: (cellId: string, cell: NotebookCell) => void
  onAddCell: (type: 'query' | 'markdown', afterCellId?: string) => void
  onRemoveCell: (cellId: string) => void
  onMoveCell: (cellId: string, direction: -1 | 1) => void
  onSettingsChange: (settings: NotebookContent['settings']) => void
  onRunCell: (cell: QueryCellModel, rowLimit: number) => void
  onRunAll: () => void
}

export const NotebookView = ({
  title,
  notebook,
  results,
  onCellChange,
  onAddCell,
  onRemoveCell,
  onMoveCell,
  onSettingsChange,
  onRunCell,
  onRunAll,
}: NotebookViewProps) => {
  const hasAutoRun = useRef(false)

  // `on_open` runs the notebook once when it is opened. Write-detected cells
  // halt the sequence — that rule lives in the state module, shared with the Assistant.
  useEffect(() => {
    if (hasAutoRun.current) return
    if (notebook.settings.run_mode !== 'on_open') return
    hasAutoRun.current = true
    onRunAll()
  }, [notebook.settings.run_mode, onRunAll])

  return (
    <div className="flex h-full flex-col">
      <TabToolbar
        icon={RESOURCE_ICON.notebook}
        title={title}
        actions={
          <>
            <Button variant="default" size="tiny" icon={<Play size={14} />} onClick={onRunAll}>
              Run all
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="text"
                  size="tiny"
                  className="w-7 px-0"
                  aria-label="Notebook settings"
                  icon={<Settings size={14} />}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Run mode</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={notebook.settings.run_mode}
                  onValueChange={(value) =>
                    onSettingsChange({ ...notebook.settings, run_mode: value as RunMode })
                  }
                >
                  <DropdownMenuRadioItem value="manual">Manual</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="on_open">On open</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Default row limit</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={String(notebook.settings.default_row_limit)}
                  onValueChange={(value) =>
                    onSettingsChange({ ...notebook.settings, default_row_limit: Number(value) })
                  }
                >
                  {ROW_LIMITS.map((limit) => (
                    <DropdownMenuRadioItem key={limit} value={String(limit)}>
                      {limit} rows
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2 p-4">
          {notebook.cells.map((cell, index) => (
            <NotebookCellShell
              key={cell.id}
              isFirst={index === 0}
              isLast={index === notebook.cells.length - 1}
              contained={cell.type === 'markdown'}
              onMoveUp={() => onMoveCell(cell.id, -1)}
              onMoveDown={() => onMoveCell(cell.id, 1)}
              onRemove={() => onRemoveCell(cell.id)}
              onAddCell={(type) => onAddCell(type, cell.id)}
            >
              {cell.type === 'markdown' ? (
                <MarkdownCellView cell={cell} onChange={(next) => onCellChange(cell.id, next)} />
              ) : (
                <QueryCell
                  value={cell}
                  result={results[cell.id] ?? { status: 'idle' }}
                  rowLimit={resolveEffectiveRowLimit(cell, notebook.settings)}
                  footerSlot={
                    resolveEffectiveRunMode(cell, notebook.settings) === 'on_open' ? (
                      <p className="border-t px-3 py-1 text-xs text-foreground-lighter">
                        Runs automatically when the notebook opens
                      </p>
                    ) : undefined
                  }
                  onChange={(next) => onCellChange(cell.id, next)}
                  onRun={() => onRunCell(cell, resolveEffectiveRowLimit(cell, notebook.settings))}
                />
              )}
            </NotebookCellShell>
          ))}

          {notebook.cells.length === 0 && (
            <div
              className={`flex flex-col items-center gap-2 rounded-md border border-dashed py-10 ${PROSE_WIDTH}`}
            >
              <p className="text-sm">This notebook is empty</p>
              <p className="text-xs text-foreground-light">
                Add a query cell to run SQL against your database or logs.
              </p>
              <div className="mt-2 flex gap-2">
                <Button variant="default" size="tiny" onClick={() => onAddCell('query')}>
                  Add query cell
                </Button>
                <Button variant="default" size="tiny" onClick={() => onAddCell('markdown')}>
                  Add markdown cell
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
