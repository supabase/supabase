import { Copy, Expand } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import DataGrid, { CalculatedColumn } from 'react-data-grid'
import {
  cn,
  ContextMenu_Shadcn_,
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuTrigger_Shadcn_,
  copyToClipboard,
} from 'ui'

import { CellDetailPanel } from './CellDetailPanel'
import { formatCellValue, formatClipboardValue } from './Results.utils'
import { handleCopyCell } from '@/components/grid/SupabaseGrid.utils'

const Results = ({ rows }: { rows: readonly any[] }) => {
  const [expandCell, setExpandCell] = useState(false)
  const [cellPosition, setCellPosition] = useState<{ column: any; row: any; rowIdx: number }>()
  const contextMenuCellRef = useRef<{ column: string; value: any } | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent, column: string, value: any) => {
    contextMenuCellRef.current = { column, value }

    if (triggerRef.current) {
      // Position the hidden trigger at the mouse cursor so the context menu opens there
      triggerRef.current.style.position = 'fixed'
      triggerRef.current.style.left = `${e.clientX}px`
      triggerRef.current.style.top = `${e.clientY}px`

      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        clientX: e.clientX,
        clientY: e.clientY,
      })
      triggerRef.current.dispatchEvent(contextMenuEvent)
    }
  }, [])

  const columnRender = (name: string) => {
    return <div className="flex h-full items-center justify-center font-mono text-xs">{name}</div>
  }

  const EST_CHAR_WIDTH = 8.25
  const MIN_COLUMN_WIDTH = 100
  const MAX_COLUMN_WIDTH = 500

  const columns: CalculatedColumn<any>[] = useMemo(
    () =>
      Object.keys(rows?.[0] ?? []).map((key, idx) => {
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
          renderCell: ({ row }: { row: any }) => {
            const cellValue = row[key]
            return (
              <div
                className={cn(
                  'flex items-center h-full font-mono text-xs w-full whitespace-pre',
                  cellValue === null && 'text-foreground-lighter'
                )}
                onContextMenu={(e) => {
                  e.preventDefault()
                  handleContextMenu(e, key, cellValue)
                }}
              >
                {formatCellValue(cellValue)}
              </div>
            )
          },
          renderHeaderCell: () => columnRender(key),
        }
      }),
    [rows, handleContextMenu]
  )

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
          <ContextMenu_Shadcn_ modal={false}>
            <ContextMenuTrigger_Shadcn_ asChild>
              <div ref={triggerRef} className="fixed pointer-events-none w-0 h-0" />
            </ContextMenuTrigger_Shadcn_>
            <ContextMenuContent_Shadcn_ onCloseAutoFocus={(e) => e.stopPropagation()}>
              <ContextMenuItem_Shadcn_
                className="gap-x-2"
                onSelect={() => {
                  const value = formatClipboardValue(contextMenuCellRef.current?.value ?? '')
                  copyToClipboard(value)
                }}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Copy size={12} />
                Copy cell content
              </ContextMenuItem_Shadcn_>
              <ContextMenuItem_Shadcn_
                className="gap-x-2"
                onSelect={() => setExpandCell(true)}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Expand size={12} />
                View cell content
              </ContextMenuItem_Shadcn_>
            </ContextMenuContent_Shadcn_>
          </ContextMenu_Shadcn_>
          <DataGrid
            columns={columns}
            rows={rows}
            className="flex-grow min-h-0 border-t-0"
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
