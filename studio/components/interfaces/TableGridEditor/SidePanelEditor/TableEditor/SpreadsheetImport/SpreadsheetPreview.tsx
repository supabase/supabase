import { FC } from 'react'
import { isUndefined } from 'lodash'
import DataGrid from '@supabase/react-data-grid'

interface Props {
  headers: string[]
  rows?: any[]
}

const SpreadsheetPreview: FC<Props> = ({ headers = [], rows = [] }) => {
  return (
    <DataGrid
      columns={headers.map((header) => {
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
      rows={rows}
      className="!border-l !border-r"
      style={{ height: `${34 + 34 * rows.length}px` }}
    />
  )
}

export default SpreadsheetPreview
