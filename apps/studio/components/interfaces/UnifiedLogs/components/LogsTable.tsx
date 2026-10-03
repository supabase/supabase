import { cn } from 'ui'

import {
  DataTableInfinite,
  type DataTableInfiniteProps,
} from '@/components/ui/DataTable/DataTableInfinite'

type LogsTableProps<TData> = DataTableInfiniteProps<TData, unknown, unknown> & {
  className?: string
}

/**
 * A logs list: DataTableInfinite with the Logs page's header and row styling. Reads rows,
 * selection and loading state from the surrounding DataTableProvider, so any logs view renders
 * the same way whatever its columns or row type.
 */
export const LogsTable = <TData,>({ className, ...props }: LogsTableProps<TData>) => (
  <div
    className={cn(
      'h-full [&>div]:h-full',
      '[&_thead_th]:[border-top:none]! [&_thead_th]:[border-bottom:none]!',
      '[&_thead_th]:[box-shadow:inset_0_-1px_0_var(--border-default)]!',
      '[&_thead_th]:text-foreground-lighter! [&_thead_tr]:bg-background! [&_thead_tr:hover]:bg-background!',
      '[&_thead_tr]:border-b-0! [&_tbody_tr]:border-b-0!',
      className
    )}
  >
    <DataTableInfinite errorSubject="Failed to retrieve logs" {...props} />
  </div>
)
