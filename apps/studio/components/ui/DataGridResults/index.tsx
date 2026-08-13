import { Copy, Expand } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import DataGrid, { CalculatedColumn, RenderCellProps } from 'react-data-grid'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  copyToClipboard,
} from 'ui'

import { CellDetailPanel } from './CellDetailPanel'
import {
  calculateResultColumnWidth,
  formatClipboardValue,
  RESULT_COLUMN_MIN_WIDTH,
  type ResultRow,
} from './DataGridResults.utils'
import { ResultCell } from './ResultCell'
import { handleCellKeyDown } from '@/components/grid/SupabaseGrid.utils'

export const DataGridResults = ({ rows }: { rows: readonly ResultRow[] }) => {
  const [expandedCell, setExpandedCell] = useState<{ column: string; value: unknown } | null>(
    null
  )
  const contextMenuCellRef = useRef<{ column: string; value: unknown } | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent, column: string, value: unknown) => {
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

  const columns: CalculatedColumn<ResultRow>[] = useMemo(
    () =>
      Object.keys(rows?.[0] ?? []).map((key, idx) => {
        return {
          idx,
          key,
          name: key,
          resizable: true,
          parent: undefined,
          level: 0,
          width: calculateResultColumnWidth(key, rows),
          minWidth: RESULT_COLUMN_MIN_WIDTH,
          maxWidth: undefined,
          draggable: false,
          frozen: false,
          sortable: false,
          isLastFrozenColumn: false,
          renderCell: ({ row }: RenderCellProps<ResultRow>) => (
            <ResultCell
              column={key}
              value={row[key]}
              onContextMenu={handleContextMenu}
              onExpand={(column, value) => setExpandedCell({ column, value })}
            />
          ),
          renderHeaderCell: () => columnRender(key),
        }
      }),
    [rows, handleContextMenu]
  )

  return (
    <>
      {rows.length === 0 ? (
        <p className="px-4 py-3 font-mono text-sm text-foreground-light">
          Success. No rows returned
        </p>
      ) : (
        <>
          <ContextMenu modal={false}>
            <ContextMenuTrigger asChild>
              <div ref={triggerRef} className="fixed pointer-events-none w-0 h-0" />
            </ContextMenuTrigger>
            <ContextMenuContent onCloseAutoFocus={(e) => e.stopPropagation()}>
              <ContextMenuItem
                className="gap-x-2"
                onSelect={() => {
                  const value = formatClipboardValue(contextMenuCellRef.current?.value ?? '')
                  copyToClipboard(value)
                }}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Copy size={12} />
                Copy cell content
              </ContextMenuItem>
              <ContextMenuItem
                className="gap-x-2"
                onSelect={() => {
                  const cell = contextMenuCellRef.current
                  if (cell) setExpandedCell({ column: cell.column, value: cell.value })
                }}
                onFocusCapture={(e) => e.stopPropagation()}
              >
                <Expand size={12} />
                View cell content
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          <DataGrid
            columns={columns}
            rows={rows}
            className="grow min-h-0 border-t-0! border-b-0!"
            rowClass={() => '[&>.rdg-cell]:items-center'}
            onCellKeyDown={handleCellKeyDown}
          />
          <CellDetailPanel
            column={expandedCell?.column ?? ''}
            value={expandedCell?.value}
            visible={expandedCell !== null}
            onClose={() => setExpandedCell(null)}
          />
        </>
      )}
    </>
  )
}
