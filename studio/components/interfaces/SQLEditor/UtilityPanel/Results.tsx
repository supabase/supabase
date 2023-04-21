import DataGrid, { Column } from '@supabase/react-data-grid'
import { useKeyboardShortcuts } from 'hooks'
import { copyToClipboard } from 'lib/helpers'
import { useState } from 'react'
import { Item, Menu, useContextMenu } from 'react-contexify'
import { createPortal } from 'react-dom'
import { IconClipboard } from 'ui'

const Results = ({ id, rows }: { id: string; rows: readonly any[] }) => {
  const SQL_CONTEXT_EDITOR_ID = 'sql-context-menu-' + id

  const [cellPosition, setCellPosition] = useState<any>(undefined)

  function onCopyCell() {
    if (columns && cellPosition) {
      const { idx, rowIdx } = cellPosition
      const colKey = columns[idx].key
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
    return <div className="flex h-full items-center justify-center font-mono">{name}</div>
  }
  const columns: Column<any, unknown>[] = Object.keys(rows?.[0] ?? []).map((key) => ({
    key,
    name: key,
    formatter: ({ row }: any) => formatter(key, row),
    headerRenderer: () => columnRender(key),
    resizable: true,
    width: 120,
  }))

  function onSelectedCellChange(position: any) {
    setCellPosition(position)
  }

  if (rows.length <= 0) {
    return (
      <div className="bg-table-header-light dark:bg-table-header-dark">
        <p className="m-0 border-0 px-6 py-4 font-mono text-sm">Success. No rows returned</p>
      </div>
    )
  }

  return (
    <>
      <DataGrid
        columns={columns}
        rows={rows}
        style={{ height: '100%' }}
        onSelectedCellChange={onSelectedCellChange}
      />
      {typeof window !== 'undefined' &&
        createPortal(
          <Menu id={SQL_CONTEXT_EDITOR_ID} animation={false}>
            <Item onClick={onCopyCell}>
              <IconClipboard size="tiny" />
              <span className="ml-2 text-xs">Copy cell content</span>
            </Item>
          </Menu>,
          document.body
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
