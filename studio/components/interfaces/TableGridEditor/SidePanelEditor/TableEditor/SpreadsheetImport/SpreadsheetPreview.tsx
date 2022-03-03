import { FC } from 'react'
import { isUndefined } from 'lodash'
import DataGrid from '@supabase/react-data-grid'
import { Typography } from '@supabase/ui'

interface Props {
  headers: string[]
  rows?: any[]
}

const MAX_ROWS = 100;
const MAX_HEADERS = 20;

const SpreadsheetPreview: FC<Props> = ({ headers = [], rows = [] }) => {
  const previewHeaders = headers.slice(0, MAX_HEADERS);
  const previewRows = rows.slice(0, MAX_ROWS);

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
              <Typography.Text small>{header}</Typography.Text>
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
      style={{ height: `${34 + 34 * previewRows.length}px` }}
    />
  )
}

export default SpreadsheetPreview
