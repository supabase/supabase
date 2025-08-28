import { ComponentPropsWithRef, forwardRef } from 'react'
import { cn } from 'ui'
import {
  Table as ShadcnTable,
  TableBody as ShadcnTableBody,
  TableCaption as ShadcnTableCaption,
  TableCell as ShadcnTableCell,
  TableFooter as ShadcnTableFooter,
  TableHead as ShadcnTableHead,
  TableHeader as ShadcnTableHeader,
  TableRow as ShadcnTableRow,
} from 'ui/src/components/shadcn/ui/table'

// Only create a custom component for Table with the added props
const Table = forwardRef<HTMLTableElement, ComponentPropsWithRef<typeof ShadcnTable>>(
  ({ className, onScroll, ...props }, ref) => (
    <ShadcnTable
      ref={ref}
      {...props}
      className={cn(className)}
      containerProps={{
        onScroll,
        className: 'h-full w-full overflow-auto table-fixed min-w-max caption-bottom text-sm',
      }}
    />
  )
)
Table.displayName = 'Table'

const TableHeader = forwardRef<
  HTMLTableSectionElement,
  ComponentPropsWithRef<typeof ShadcnTableHeader>
>(({ className, ...props }, ref) => (
  <ShadcnTableHeader ref={ref} className={cn('sticky top-0 z-[1]', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = forwardRef<
  HTMLTableSectionElement,
  ComponentPropsWithRef<typeof ShadcnTableBody>
>(({ className, ...props }, ref) => (
  <ShadcnTableBody
    ref={ref}
    {...props}
    className={cn(
      'outline-1 -outline-offset-1 outline-primary transition-colors focus-visible:outline'
    )}
  />
))
TableBody.displayName = 'TableBody'

const TableFooter = forwardRef<
  HTMLTableSectionElement,
  ComponentPropsWithRef<typeof ShadcnTableFooter>
>(({ className, ...props }, ref) => (
  <ShadcnTableFooter ref={ref} className={cn('text-primary-foreground', className)} {...props} />
))
TableFooter.displayName = 'TableFooter'

const TableRow = forwardRef<HTMLTableRowElement, ComponentPropsWithRef<typeof ShadcnTableRow>>(
  ({ className, ...props }, ref) => (
    <ShadcnTableRow
      ref={ref}
      className={cn('bg-background hover:bg-surface-100 border-b-0', className)}
      {...props}
    />
  )
)
TableRow.displayName = 'TableRow'

const TableHead = forwardRef<HTMLTableCellElement, ComponentPropsWithRef<typeof ShadcnTableHead>>(
  ({ className, ...props }, ref) => (
    <ShadcnTableHead
      ref={ref}
      className={cn(
        '!text-xs !font-normal text-foreground-lighter font-mono',
        'relative select-none truncate [&>.cursor-col-resize]:last:opacity-0',
        'text-muted-foreground h-8 px-2 text-left align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = 'TableHead'

const TableCell = forwardRef<HTMLTableCellElement, ComponentPropsWithRef<typeof ShadcnTableCell>>(
  ({ className, ...props }, ref) => (
    <ShadcnTableCell
      ref={ref}
      className={cn('text-xs !py-1 p-2 [&>[role=checkbox]]:translate-y-[2px] truncate', className)}
      {...props}
    />
  )
)
TableCell.displayName = 'TableCell'

const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  ComponentPropsWithRef<typeof ShadcnTableCaption>
>(({ className, ...props }, ref) => (
  <ShadcnTableCaption ref={ref} className={cn('text-sm', className)} {...props} />
))
TableCaption.displayName = 'TableCaption'

export { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow }
