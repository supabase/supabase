import { FC } from 'react'
import { isUndefined } from 'lodash'
import DataGrid from '@supabase/react-data-grid'
import clsx from 'clsx'

interface Props {
  headers: string[]
  rows?: any[]
}

const MAX_ROWS = 20
const MAX_HEADERS = 20

const SpreadsheetPreview: FC<Props> = ({ headers = [], rows = [] }) => {
  const previewHeaders = headers.slice(0, MAX_HEADERS)
  const previewRows = rows.slice(0, MAX_ROWS)
  return (
    <DataGrid
      columns={previewHeaders.map((header) => {
        const columnValues = previewRows.map((row) => row[header].toString())
        const maxLength = Math.max(...columnValues.map((el) => el.length))
        const maxWidth = maxLength > 20 ? 200 : maxLength * 10

        return {
          key: header,
          name: header,
          width: maxWidth,
          resizable: true,
          headerRenderer: () => (
            <div className="flex items-center justify-center font-mono h-full">
              <p className="text-xs">{header}</p>
            </div>
          ),
          formatter: ({ row }: { row: any }) => {
            const isEmpty = !row[header]
            return (
              <span
                className={clsx(
                  'font-mono text-xs flex items-center',
                  isEmpty && 'text-scale-1000'
                )}
              >
                {isEmpty ? 'NULL' : row[header]}
              </span>
            )
          },
        }
      })}
      rows={previewRows}
      className="!border-l !border-r"
      // style={{ height: `${34 + 34 * (previewRows.length || 1)}px` }}
      style={{ height: '250px' }}
    />
  )
}

export default SpreadsheetPreview
