import DataGrid from 'react-data-grid'
import { cn } from 'ui'

const MAX_ROWS = 20
const MAX_HEADERS = 20

interface SpreadsheetPreviewGridProps {
  headers: string[]
  rows?: any[]
  height?: number
  emptyStringAsNullHeaders?: string[]
}

const SpreadsheetPreviewGrid = ({
  headers = [],
  rows = [],
  height,
  emptyStringAsNullHeaders = headers,
}: SpreadsheetPreviewGridProps) => {
  const previewHeaders = headers.slice(0, MAX_HEADERS)
  const previewRows = rows.slice(0, MAX_ROWS)

  return (
    <DataGrid
      columns={previewHeaders.map((header) => {
        const columnValues = previewRows.map((row) => row[header]?.toString() ?? '')
        const maxLength = Math.max(...columnValues.map((el) => el.length))
        const columnNameLength = header.length

        const charLength = Math.max(maxLength, columnNameLength)
        const maxWidth = charLength > 20 ? 200 : charLength * 10

        return {
          key: header,
          name: header,
          width: maxWidth,
          resizable: true,
          renderHeaderCell: () => (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs">{header}</p>
            </div>
          ),
          renderCell: ({ row }: { row: any }) => {
            const value = row[header]
            const isEmptyString = value === ''
            const isNullValue =
              value === null ||
              value === undefined ||
              (isEmptyString && emptyStringAsNullHeaders.includes(header))
            return (
              <span
                className={cn('text-sm flex items-center', isNullValue && 'text-foreground-light')}
              >
                {isNullValue ? 'NULL' : value}
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
