import { Text, View } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

import { pdfStyles } from './theme'
import { formatCellValue } from '@/components/ui/DataGridResults/DataGridResults.utils'

interface NotebookPdfTableProps {
  rows: readonly Record<string, unknown>[]
}

/**
 * Renders every row (no overflow/scroll truncation, unlike the live results grid).
 * The header only renders once — react-pdf's `fixed` prop pins an element to a page
 * position rather than repeating it wherever a table happens to restart on a new page,
 * so it isn't a good fit for a repeating table header nested mid-document.
 */
export function NotebookPdfTable({ rows }: NotebookPdfTableProps): ReactElement | null {
  const columns = Object.keys(rows[0] ?? {})
  if (columns.length === 0) return null

  return (
    <View style={pdfStyles.table}>
      <View style={pdfStyles.tableHeaderRow}>
        {columns.map((column) => (
          <Text key={column} style={pdfStyles.tableHeaderCell}>
            {column}
          </Text>
        ))}
      </View>
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={
            rowIndex === rows.length - 1
              ? [pdfStyles.tableRow, pdfStyles.tableRowLast]
              : pdfStyles.tableRow
          }
          wrap={false}
        >
          {columns.map((column) => {
            const value = row[column]
            return value === null ? (
              <Text key={column} style={pdfStyles.tableCellNull}>
                NULL
              </Text>
            ) : (
              <Text key={column} style={pdfStyles.tableCell}>
                {formatCellValue(value)}
              </Text>
            )
          })}
        </View>
      ))}
    </View>
  )
}
