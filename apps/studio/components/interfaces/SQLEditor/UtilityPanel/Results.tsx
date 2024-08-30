import { ChevronDown, ChevronUp, Clipboard, Expand } from 'lucide-react'
import { useState } from 'react'
import DataGrid, { CalculatedColumn } from 'react-data-grid'

import { GridFooter } from 'components/ui/GridFooter'
import { useKeyboardShortcuts } from 'hooks/deprecated'
import { useFlag } from 'hooks/ui/useFlag'
import { copyToClipboard } from 'lib/helpers'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import {
  Button,
  cn,
  ContextMenu_Shadcn_,
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuTrigger_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'
import { CellDetailPanel } from './CellDetailPanel'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/components/shadcn/ui/tooltip'

function formatClipboardValue(value: any) {
  if (value === null) return ''
  if (typeof value == 'object' || Array.isArray(value)) {
    return JSON.stringify(value)
  }
  return value
}

const Results = ({ id, rows }: { id: string; rows: readonly any[] }) => {
  const enableFolders = useFlag('sqlFolderOrganization')
  const [expandCell, setExpandCell] = useState(false)
  const [cellPosition, setCellPosition] = useState<{ column: any; row: any; rowIdx: number }>()

  const snap = useSqlEditorStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const results = enableFolders ? snapV2.results[id]?.[0] : snap.results[id]?.[0]

  const onCopyCell = () => {
    if (cellPosition) {
      const { rowIdx, column } = cellPosition
      const colKey = column.key
      const cellValue = rows[rowIdx]?.[colKey] ?? ''
      const value = formatClipboardValue(cellValue)
      copyToClipboard(value)
    }
  }

  useKeyboardShortcuts(
    {
      'Command+c': (event: any) => {
        event.stopPropagation()
        onCopyCell()
      },
      'Control+c': (event: any) => {
        event.stopPropagation()
        onCopyCell()
      },
    },
    ['INPUT', 'TEXTAREA'] as any
  )

  const formatter = (column: any, row: any) => {
    return (
      <ContextMenu_Shadcn_ modal={false}>
        <ContextMenuTrigger_Shadcn_ asChild>
          <div
            className={cn(
              'flex items-center h-full font-mono text-xs w-full whitespace-pre',
              row[column] === null && 'text-foreground-lighter'
            )}
          >
            {row[column] === null ? 'NULL' : JSON.stringify(row[column])}
          </div>
        </ContextMenuTrigger_Shadcn_>
        <ContextMenuContent_Shadcn_ onCloseAutoFocus={(e) => e.stopPropagation()}>
          <ContextMenuItem_Shadcn_
            className="gap-x-2"
            onSelect={() => {
              const cellValue = row[column] ?? ''
              const value = formatClipboardValue(cellValue)
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

  if (rows.length <= 0) {
    return (
      <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono text-sm">Success. No rows returned</p>
      </div>
    )
  }

  const ROWS_PER_PAGE_OPTIONS = [
    { value: -1, label: 'No limit' },
    { value: 100, label: '100 rows' },
    { value: 500, label: '500 rows' },
    { value: 1000, label: '1,000 rows' },
  ]

  return (
    <>
      <DataGrid
        columns={columns}
        rows={rows}
        className="flex-grow border-t-0"
        rowClass={() => '[&>.rdg-cell]:items-center'}
        onSelectedCellChange={setCellPosition}
      />

      <GridFooter className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="default" iconRight={<ChevronUp size={14} />}>
              {
                ROWS_PER_PAGE_OPTIONS.find(
                  (opt) => opt.value === (enableFolders ? snapV2.limit : snap.limit)
                )?.label
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-42">
            <DropdownMenuRadioGroup
              value={enableFolders ? snapV2.limit.toString() : snap.limit.toString()}
              onValueChange={(val) => {
                if (enableFolders) snapV2.setLimit(Number(val))
                else snap.setLimit(Number(val))
              }}
            >
              {ROWS_PER_PAGE_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.label} value={option.value.toString()}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger>
            <p className="text-xs text-foreground-light">
              {rows.length} row{rows.length > 1 ? 's' : ''}
              {results.autoLimit !== undefined && ` (auto limit ${results.autoLimit} rows)`}
            </p>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>
              Results are limited browser performance.
              <br />
              You may change this, or remove the limit from the dropdown on the left
            </p>
          </TooltipContent>
        </Tooltip>
      </GridFooter>

      <CellDetailPanel
        column={cellPosition?.column.name ?? ''}
        value={cellPosition?.row?.[cellPosition.column.name]}
        visible={expandCell}
        onClose={() => setExpandCell(false)}
      />
    </>
  )
}

export default Results
