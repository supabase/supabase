import DataGrid from 'react-data-grid'
import clsx from 'clsx'

const MAX_ROWS = 20
const MAX_HEADERS = 20

interface SpreadsheetPreviewGridProps {
  headers: string[]
  rows?: any[]
  height?: number
}

const SpreadsheetPreviewGrid = ({
  headers = [],
  rows = [],
  height,
}: SpreadsheetPreviewGridProps) => {
  const previewHeaders = headers.slice(0, MAX_HEADERS)
  const previewRows = rows.slice(0, MAX_ROWS)

  return (
    <DataGrid
      columns={previewHeaders.map((header) => {
        const columnValues = previewRows.map((row) => row[header]?.toString() ?? '')
        const maxLength = Math.max(...columnValues.map((el) => el.length))
        const maxWidth = maxLength > 20 ? 200 : maxLength * 10

        return {
          key: header,
          name: header,
          width: maxWidth,
          resizable: true,
          headerRenderer: () => (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs">{header}</p>
            </div>
          ),
          formatter: ({ row }: { row: any }) => {
            const isEmpty = !row[header]
            return (
              <span
                className={clsx('text-sm flex items-center', isEmpty && 'text-foreground-light')}
              >
                {isEmpty ? 'NULL' : row[header]}
              </span>
            )
          },
        }
      })}
      rows={previewRows}
      className="!border-l !border-r"
      style={{ height: height || `${34 + 34 * (previewRows.length || 1)}px` }}
    />
  )
}

export default SpreadsheetPreviewGrid
