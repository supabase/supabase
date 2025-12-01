import type { ComponentProps } from 'react'
import * as React from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

import { cn } from '../../../lib/utils/cn'
import { ShadowScrollArea } from '../../ShadowScrollArea'

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  containerProps?: Partial<ComponentProps<typeof ShadowScrollArea>>
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, containerProps, ...props }, ref) => {
    return (
      <ShadowScrollArea {...containerProps}>
        <table
          ref={ref}
          className={cn('group/table w-full caption-bottom text-sm', className)}
          {...props}
        />
      </ShadowScrollArea>
    )
  }
)
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b [&>tr]:bg-200', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
))
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('bg-primary font-medium text-primary-foreground', className)}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b [&>td]:hover:bg-surface-200 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-10 px-4 text-left align-middle heading-meta whitespace-nowrap text-foreground-lighter [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

interface TableHeadSortProps<TColumn extends string = string> {
  column: TColumn
  currentSort: string
  onSortChange: (column: TColumn) => void
  children: React.ReactNode
  className?: string
}

function TableHeadSort<TColumn extends string = string>({
  column,
  currentSort,
  onSortChange,
  children,
  className,
}: TableHeadSortProps<TColumn>) {
  const [currentCol, currentOrder] = currentSort.split(':')
  const isActive = currentCol === column
  const isAsc = isActive && currentOrder === 'asc'
  const isDesc = isActive && currentOrder === 'desc'

  const getSortIcon = () => {
    const baseIconClass = 'w-3 h-3 absolute inset-0'

    return (
      <>
        <ArrowUp
          className={cn(
            baseIconClass,
            'transition-transform',
            isAsc ? 'translate-y-0' : 'translate-y-full'
          )}
        />
        <ArrowDown
          className={cn(
            baseIconClass,
            'transition-transform',
            isDesc ? 'translate-y-0' : '-translate-y-full'
          )}
        />
        <ChevronsUpDown
          className={cn(
            baseIconClass,
            'transition-opacity opacity-80 md:opacity-40',
            !isActive ? 'group-hover/table-head-sort:opacity-80' : '!opacity-0'
          )}
        />
      </>
    )
  }

  return (
    <button
      type="button"
      className={cn(
        'group/table-head-sort heading-meta whitespace-nowrap flex items-center gap-1 cursor-pointer select-none !bg-transparent border-none p-0 w-full text-left',
        className
      )}
      onClick={() => onSortChange(column)}
    >
      {children}
      <div className="w-3 h-3 relative overflow-hidden">{getSortIcon()}</div>
    </button>
  )
}
TableHeadSort.displayName = 'TableHeadSort'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('transition-colors p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn('mt-4 text-sm text-foreground-muted', className)} {...props} />
))
TableCaption.displayName = 'TableCaption'

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableHeadSort,
  TableRow,
}
