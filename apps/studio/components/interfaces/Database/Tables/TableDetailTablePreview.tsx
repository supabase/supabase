import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import type { TableLike } from '@/data/table-editor/table-editor-types'
import { useTableRowsQuery } from '@/data/table-rows/table-rows-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const PREVIEW_ROW_LIMIT = 5

function formatPreviewValue(value: unknown): string {
  if (value === null) return 'NULL'
  if (value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

interface TableDetailTablePreviewProps {
  table: TableLike
  qualifiedName?: string
}

export function TableDetailTablePreview({ table, qualifiedName }: TableDetailTablePreviewProps) {
  const { data: project } = useSelectedProjectQuery()
  const columns = table.columns ?? []
  const displayName = qualifiedName ?? `${table.schema}.${table.name}`

  const {
    data: rowsData,
    isPending,
    isError,
    error,
  } = useTableRowsQuery(
    {
      projectRef: project?.ref,
      tableId: table.id,
      limit: PREVIEW_ROW_LIMIT,
      page: 1,
    },
    { enabled: !!project?.ref }
  )

  const rows = rowsData?.rows ?? []

  return (
    <Card>
      {isPending ? (
        <div className="p-4">
          <GenericSkeletonLoader />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.length === 0 ? (
                <TableHead className="text-foreground-muted">No columns</TableHead>
              ) : (
                columns.map((column) => (
                  <TableHead key={column.id} className="whitespace-nowrap">
                    {column.name}
                  </TableHead>
                ))
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isError && (
              <TableRow className="[&>td]:hover:bg-inherit">
                <TableCell colSpan={Math.max(columns.length, 1)}>
                  <AlertError error={error} subject={`Failed to load rows for "${displayName}"`} />
                </TableCell>
              </TableRow>
            )}

            {!isError && rows.length === 0 && (
              <TableRow className="[&>td]:hover:bg-inherit">
                <TableCell
                  colSpan={Math.max(columns.length, 1)}
                  className="text-center text-foreground-muted"
                >
                  This table has no rows yet.
                </TableCell>
              </TableRow>
            )}

            {!isError &&
              rows.map((row, rowIndex) => (
                <TableRow key={row.idx ?? rowIndex}>
                  {columns.map((column) => {
                    const value = row[column.name]
                    const formatted = formatPreviewValue(value)
                    return (
                      <TableCell key={column.id} className="max-w-64 truncate font-mono text-xs">
                        <span className={value === null ? 'text-foreground-muted' : undefined}>
                          {formatted}
                        </span>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
          </TableBody>

          {!isError && rows.length > 0 && (
            <TableFooter>
              <TableRow className="bg-transparent hover:bg-transparent">
                <TableCell
                  colSpan={Math.max(columns.length, 1)}
                  className="text-foreground-muted font-normal"
                >
                  Showing up to {PREVIEW_ROW_LIMIT} rows
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      )}
    </Card>
  )
}
