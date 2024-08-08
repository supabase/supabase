import { Clipboard } from 'lucide-react'
import { useState } from 'react'
import { Item, Menu, useContextMenu } from 'react-contexify'
import DataGrid, { CalculatedColumn } from 'react-data-grid'
import { createPortal } from 'react-dom'

import { GridFooter } from 'components/ui/GridFooter'
import { useKeyboardShortcuts } from 'hooks/deprecated'
import { copyToClipboard } from 'lib/helpers'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { useFlag } from 'hooks/ui/useFlag'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'

const Results = ({ id, rows }: { id: string; rows: readonly any[] }) => {
  const SQL_CONTEXT_EDITOR_ID = 'sql-context-menu-' + id
  const enableFolders = useFlag('sqlFolderOrganization')
  const [cellPosition, setCellPosition] = useState<any>(undefined)

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

  const { show: showContextMenu } = useContextMenu()

  const formatter = (column: any, row: any) => {
    return (
      <span
        className="font-mono text-xs w-full whitespace-pre"
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
        rows={rows}
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

      <GridFooter className="flex items-center justify-center">
        <p className="text-xs text-foreground-light">
          {rows.length} row{rows.length > 1 ? 's' : ''}
          {results.autoLimit !== undefined && ` (auto limit ${results.autoLimit} rows)`}
        </p>
      </GridFooter>
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
