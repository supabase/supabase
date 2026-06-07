import { type Column } from '@tanstack/react-table'
import { TanStackTableHeadSort } from 'ui-patterns/Table'

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  className?: string
}

/**
 * @deprecated Use `TanStackTableHeadSort` from `ui-patterns/Table` instead.
 */
export const DataTableColumnHeader = <TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) => {
  return (
    <TanStackTableHeadSort column={column} className={className}>
      {title}
    </TanStackTableHeadSort>
  )
}
