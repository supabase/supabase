import { ArrowLeft, ArrowRight, Clipboard } from 'lucide-react'
import { useState } from 'react'
import { Item, Menu, useContextMenu } from 'react-contexify'
import DataGrid, { CalculatedColumn } from 'react-data-grid'
import { createPortal } from 'react-dom'

import { useKeyboardShortcuts } from 'hooks'
import { copyToClipboard } from 'lib/helpers'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

const ROWS_PER_PAGE_OPTIONS = [
  { value: 100, label: '100 rows' },
  { value: 500, label: '500 rows' },
  { value: 1000, label: '1,000 rows' },
]

const Results = ({ id, rows }: { id: string; rows: readonly any[] }) => {
  const [page, setPage] = useState<number>(1)
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0].value)
  const [cellPosition, setCellPosition] = useState<any>(undefined)

  const totalPages = Math.ceil(rows.length / rowsPerPage)
  const SQL_CONTEXT_EDITOR_ID = 'sql-context-menu-' + id

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

  const { show: showContextMenu } = useContextMenu()

  const formatter = (column: any, row: any) => {
    return (
      <span
        className="font-mono text-xs w-full"
        onContextMenu={(e) =>
          showContextMenu(e, {
            id: SQL_CONTEXT_EDITOR_ID,
          })
        }
      >
        {JSON.stringify(row[column])}
      </span>
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
      renderCell: ({ row }: any) => formatter(key, row),
      renderHeaderCell: () => columnRender(key),
    }
  })

  function onSelectedCellChange(position: any) {
    setCellPosition(position)
  }

  if (rows.length <= 0) {
    return (
      <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono text-sm">Success. No rows returned</p>
      </div>
    )
  }

  return (
    <>
      <DataGrid
        columns={columns}
        rows={
          page === 0
            ? rows.slice(0, rowsPerPage)
            : rows.slice((page - 1) * rowsPerPage, page * rowsPerPage)
        }
        className="flex-grow border-t-0"
        rowClass={() => '[&>.rdg-cell]:items-center'}
        onSelectedCellChange={onSelectedCellChange}
      />

      {typeof window !== 'undefined' &&
        createPortal(
          <Menu id={SQL_CONTEXT_EDITOR_ID} animation={false}>
            <Item onClick={onCopyCell}>
              <Clipboard size={14} />
              <span className="ml-2 text-xs">Copy cell content</span>
            </Item>
          </Menu>,
          document.body
        )}

      {rows.length > 100 && (
        <div className="border-t py-1 px-2 flex items-center justify-center gap-x-2">
          <Button
            icon={<ArrowLeft />}
            type="outline"
            className="px-1.5"
            disabled={page <= 1}
            onClick={() => setPage((prev) => prev - 1)}
          />
          <p className="text-sm text-foreground-light">Page</p>
          <Input
            size="tiny"
            type="number"
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            min={1}
            max={totalPages}
          />
          <p className="text-sm text-foreground-light">of {totalPages}</p>
          <Button
            icon={<ArrowRight />}
            type="outline"
            className="px-1.5"
            disabled={page === totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button asChild type="outline">
                <span>{rowsPerPage.toLocaleString()} rows</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-42">
              <DropdownMenuRadioGroup
                value={rowsPerPage.toString()}
                onValueChange={(val) => setRowsPerPage(Number(val))}
              >
                {ROWS_PER_PAGE_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.label} value={option.value.toString()}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </>
  )
}

export default Results

function formatClipboardValue(value: any) {
  if (value === null) return ''
  if (typeof value == 'object' || Array.isArray(value)) {
    return JSON.stringify(value)
  }
  return value
}
