import { ReactNode } from 'react'
import { cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Loader2 } from 'lucide-react'
import NoDataPlaceholder from 'components/ui/Charts/NoDataPlaceholder'

export type OverviewTableColumn<T> = {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

export interface OverviewTable<T> {
  columns: OverviewTableColumn<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
}

export function OverviewTable<T>({ columns, data, isLoading, emptyMessage }: OverviewTable<T>) {
  const hasData = !isLoading && data.length > 0

  return (
    <Table className="border-t mt-4">
      {hasData && (
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={String(col.key)} className={cn(col.className)}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      )}
      <TableBody className="text-foreground">
        {isLoading ? (
          <TableRow className="[&>td]:hover:bg-transparent">
            <TableCell colSpan={columns.length} className="text-center text-foreground-light">
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="size-4 animate-spin" />
              </div>
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow className="[&>td]:hover:bg-transparent">
            <TableCell colSpan={columns.length} className="text-center text-foreground-light">
              <div className="p-2 pt-0">
                <NoDataPlaceholder
                  size="normal"
                  message={emptyMessage || 'No data available'}
                  isFullHeight
                />
              </div>
            </TableCell>
          </TableRow>
        ) : (
          (data as unknown as T[]).map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((col) => (
                <TableCell key={String(col.key)} className={cn(col.className)}>
                  {col.render ? col.render(row) : (row as any)[col.key as string]}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
