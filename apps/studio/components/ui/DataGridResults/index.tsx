import { Copy, Expand, Loader2, Maximize2 } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, RenderCellProps } from 'react-data-grid'
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
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

export const DataGridResults = ({
  rows,
  onEditRow,
  canEditRow,
  reserveRowActions = false,
  isLoadingRowActions = false,
}: {
  rows: readonly ResultRow[]
  onEditRow?: (row: ResultRow) => void
  canEditRow?: (row: ResultRow) => boolean
  /** Keep the action gutter stable while row editability is being resolved. */
  reserveRowActions?: boolean
  isLoadingRowActions?: boolean
}) => {
  const [expandedCell, setExpandedCell] = useState<{ column: string; value: unknown } | null>(null)
  const [contextMenuRow, setContextMenuRow] = useState<ResultRow>()
  const contextMenuCellRef = useRef<{ column: string; value: unknown; row: ResultRow } | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, column: string, value: unknown, row: ResultRow) => {
      contextMenuCellRef.current = { column, value, row }
      setContextMenuRow(row)

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
    },
    []
  )

  const columnRender = (name: string) => {
    return (
      <div className="flex h-full items-center overflow-hidden text-ellipsis text-xs select-text text-foreground">
        {name}
      </div>
    )
  }

  const columns: Column<ResultRow>[] = useMemo(
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
              onContextMenu={(event, column, value) => handleContextMenu(event, column, value, row)}
              onExpand={(column, value) => setExpandedCell({ column, value })}
            />
          ),
          renderHeaderCell: () => columnRender(key),
        }
      }),
    [rows, handleContextMenu]
  )

  const gridColumns: Column<ResultRow>[] =
    onEditRow || reserveRowActions || isLoadingRowActions
      ? [
          {
            key: '\u0000edit-row',
            name: '',
            width: 40,
            minWidth: 40,
            maxWidth: 40,
            cellClass: 'justify-center',
            frozen: true,
            resizable: false,
            renderCell: ({ row, tabIndex }) => {
              if (isLoadingRowActions) {
                return (
                  <Loader2
                    size={14}
                    className="animate-spin text-tertiary-foreground"
                    role="img"
                    aria-label="Checking row editability"
                  />
                )
              }
              if (!onEditRow) return null
              return (
                <ButtonTooltip
                  variant="text"
                  size="tiny"
                  className="px-1 opacity-0 transition-opacity group-hover/result-row:opacity-100 focus-visible:opacity-100"
                  aria-label="Edit row"
                  tooltip={{
                    content: {
                      text:
                        canEditRow && !canEditRow(row)
                          ? 'This row does not include a usable primary key.'
                          : 'Edit row',
                    },
                  }}
                  tabIndex={tabIndex}
                  icon={<Maximize2 />}
                  disabled={canEditRow ? !canEditRow(row) : false}
                  onClick={() => onEditRow(row)}
                />
              )
            },
          },
          ...columns,
        ]
      : columns

  return (
    <>
      {rows.length === 0 ? (
        <p className="px-4 py-3 font-sans text-sm text-foreground-light">
          Success. No rows returned
        </p>
      ) : (
        <>
          <ContextMenu modal={false}>
            <ContextMenuTrigger asChild>
              <div ref={triggerRef} className="fixed pointer-events-none w-0 h-0" />
            </ContextMenuTrigger>
            <ContextMenuContent onCloseAutoFocus={(e) => e.stopPropagation()}>
              {onEditRow && (
                <ContextMenuItem
                  className="gap-x-2"
                  disabled={!contextMenuRow || (canEditRow && !canEditRow(contextMenuRow))}
                  onSelect={() => {
                    const row = contextMenuCellRef.current?.row
                    if (row && (!canEditRow || canEditRow(row))) onEditRow(row)
                  }}
                  onFocusCapture={(event) => event.stopPropagation()}
                >
                  <Maximize2 size={12} />
                  Edit row
                </ContextMenuItem>
              )}
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
            columns={gridColumns}
            rows={rows}
            className="grow min-h-0 border-t-0! border-b-0!"
            rowClass={() => 'group/result-row [&>.rdg-cell]:items-center'}
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
