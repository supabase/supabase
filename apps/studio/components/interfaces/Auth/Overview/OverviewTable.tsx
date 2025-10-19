import { ReactNode } from 'react'
import { cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Loader2 } from 'lucide-react'

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
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={String(col.key)} className={col.className}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className="text-foreground">
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center text-foreground-light">
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="size-4 animate-spin" />
                <span>Loading…</span>
              </div>
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center text-foreground-light">
              {emptyMessage || 'No data available'}
            </TableCell>
          </TableRow>
        ) : (
          (data as unknown as T[]).map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((col) => (
                <TableCell key={String(col.key)} className={cn('p-2 px-4', col.className)}>
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
