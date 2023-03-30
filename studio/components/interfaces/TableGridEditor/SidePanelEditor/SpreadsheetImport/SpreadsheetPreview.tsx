import { FC } from 'react'
import { isUndefined } from 'lodash'
import DataGrid from '@supabase/react-data-grid'

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
        return {
          key: header,
          name: header,
          width: header.length * 10,
          resizable: true,
          headerRenderer: () => (
            <div className="flex items-center justify-center font-mono h-full">
              <p className="text-sm">{header}</p>
            </div>
          ),
          formatter: ({ row }: { row: any }) => (
            <span className="font-mono text-xs">
              {isUndefined(row[header]) ? 'NULL' : row[header]}
            </span>
          ),
        }
      })}
      rows={previewRows}
      className="!border-l !border-r"
      style={{ height: `${34 + 34 * (previewRows.length || 1)}px` }}
    />
  )
}

export default SpreadsheetPreview
