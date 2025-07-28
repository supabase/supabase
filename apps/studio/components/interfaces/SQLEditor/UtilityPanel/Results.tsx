import { Clipboard, Expand } from 'lucide-react'
import { useState } from 'react'
import DataGrid, { CalculatedColumn } from 'react-data-grid'

import { handleCopyCell } from 'components/grid/SupabaseGrid.utils'
import {
  cn,
  ContextMenu_Shadcn_,
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuTrigger_Shadcn_,
  copyToClipboard,
} from 'ui'
import { CellDetailPanel } from './CellDetailPanel'

function formatClipboardValue(value: any) {
  if (value === null) return ''
  if (typeof value == 'object' || Array.isArray(value)) {
    return JSON.stringify(value)
  }
  return value
}

const Results = ({ rows }: { rows: readonly any[] }) => {
  const [expandCell, setExpandCell] = useState(false)
  const [cellPosition, setCellPosition] = useState<{ column: any; row: any; rowIdx: number }>()

  const formatter = (column: any, row: any) => {
    const cellValue = row[column]

    return (
      <ContextMenu_Shadcn_ modal={false}>
        <ContextMenuTrigger_Shadcn_ asChild>
          <div
            className={cn(
              'flex items-center h-full font-mono text-xs w-full whitespace-pre',
              cellValue === null && 'text-foreground-lighter'
            )}
          >
            {cellValue === null
              ? 'NULL'
              : typeof cellValue === 'string'
                ? cellValue
                : JSON.stringify(cellValue)}
          </div>
        </ContextMenuTrigger_Shadcn_>
        <ContextMenuContent_Shadcn_ onCloseAutoFocus={(e) => e.stopPropagation()}>
          <ContextMenuItem_Shadcn_
            className="gap-x-2"
            onSelect={() => {
              const value = formatClipboardValue(cellValue ?? '')
              copyToClipboard(value)
            }}
            onFocusCapture={(e) => e.stopPropagation()}
          >
            <Clipboard size={14} />
            Copy cell content
          </ContextMenuItem_Shadcn_>
          <ContextMenuItem_Shadcn_
            className="gap-x-2"
            onSelect={() => setExpandCell(true)}
            onFocusCapture={(e) => e.stopPropagation()}
          >
            <Expand size={14} />
            View cell content
          </ContextMenuItem_Shadcn_>
        </ContextMenuContent_Shadcn_>
      </ContextMenu_Shadcn_>
    )
  }

  const columnRender = (name: string) => {
    return <div className="flex h-full items-center justify-center font-mono text-xs">{name}</div>
  }

  const EST_CHAR_WIDTH = 8.25
  const MIN_COLUMN_WIDTH = 100
  const MAX_COLUMN_WIDTH = 500

  const columns: CalculatedColumn<any>[] = Object.keys(rows?.[0] ?? []).map((key, idx) => {
    const maxColumnValueLength = rows
      .map((row) => String(row[key]).length)
      .reduce((a, b) => Math.max(a, b), 0)

    const columnWidth = Math.max(
      Math.min(maxColumnValueLength * EST_CHAR_WIDTH, MAX_COLUMN_WIDTH),
      MIN_COLUMN_WIDTH
    )

    return {
      idx,
      key,
      name: key,
      resizable: true,
      parent: undefined,
      level: 0,
      width: columnWidth,
      minWidth: MIN_COLUMN_WIDTH,
      maxWidth: undefined,
      draggable: false,
      frozen: false,
      sortable: false,
      isLastFrozenColumn: false,
      renderCell: ({ row }) => formatter(key, row),
      renderHeaderCell: () => columnRender(key),
    }
  })

  return (
    <>
      {rows.length === 0 ? (
        <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark">
          <p className="m-0 border-0 px-4 py-3 font-mono text-sm text-foreground-light">
            Success. No rows returned
          </p>
        </div>
      ) : (
        <>
          <DataGrid
            columns={columns}
            rows={rows}
            className="h-full flex-grow border-t-0"
            rowClass={() => '[&>.rdg-cell]:items-center'}
            onSelectedCellChange={setCellPosition}
            onCellKeyDown={handleCopyCell}
          />
          <CellDetailPanel
            column={cellPosition?.column.name ?? ''}
            value={cellPosition?.row?.[cellPosition.column.name]}
            visible={expandCell}
            onClose={() => setExpandCell(false)}
          />
        </>
      )}
    </>
  )
}

export default Results
