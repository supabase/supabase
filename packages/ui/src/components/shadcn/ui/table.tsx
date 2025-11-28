import type { ComponentProps } from 'react'
import * as React from 'react'
import { ArrowDown, ArrowUp, ChevronUp } from 'lucide-react'

import { cn } from '../../../lib/utils/cn'
import { ShadowScrollArea } from '../../ShadowScrollArea'

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  containerProps?: Partial<ComponentProps<typeof ShadowScrollArea>>
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, containerProps, ...props }, ref) => {
    return (
      <ShadowScrollArea {...containerProps}>
        <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
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

interface TableHeadSortableProps<TColumn extends string = string> {
  sortable: true
  column: TColumn
  currentSort: string
  onSortChange: (column: TColumn) => void
}

interface TableHeadNonSortableProps {
  sortable?: false
  column?: never
  currentSort?: never
  onSortChange?: never
}

type TableHeadProps<TColumn extends string = string> =
  React.ThHTMLAttributes<HTMLTableCellElement> &
    (TableHeadSortableProps<TColumn> | TableHeadNonSortableProps)

function TableHeadInner<TColumn extends string = string>(
  {
    className,
    sortable,
    column,
    currentSort,
    onSortChange,
    children,
    onClick,
    onMouseEnter,
    onMouseLeave,
    ...props
  }: TableHeadProps<TColumn>,
  ref: React.Ref<HTMLTableCellElement>
) {
  const [isHovered, setIsHovered] = React.useState(false)

  const getSortIcon = () => {
    if (!sortable || !column || !currentSort) return null

    const iconClassName = 'w-3 h-3'
    const [currentCol, currentOrder] = currentSort.split(':')

    if (currentCol === column) {
      return currentOrder === 'asc' ? (
        <ArrowUp className={iconClassName} />
      ) : (
        <ArrowDown className={iconClassName} />
      )
    }
    if (isHovered) {
      return <ChevronUp className={iconClassName} />
    }
    return <div className={iconClassName} />
  }

  const handleClick = (e: React.MouseEvent<HTMLTableCellElement>) => {
    if (sortable && column && onSortChange) {
      onSortChange(column)
    } else if (onClick) {
      onClick(e)
    }
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLTableCellElement>) => {
    if (sortable) {
      setIsHovered(true)
    }
    if (onMouseEnter) {
      onMouseEnter(e)
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLTableCellElement>) => {
    if (sortable) {
      setIsHovered(false)
    }
    if (onMouseLeave) {
      onMouseLeave(e)
    }
  }

  const thClassName = cn(
    'h-10 px-4 text-left align-middle heading-meta whitespace-nowrap text-foreground-lighter [&:has([role=checkbox])]:pr-0',
    sortable && 'cursor-pointer select-none',
    className
  )

  const content = sortable ? (
    <div className="flex items-center gap-1 !bg-transparent">
      {children}
      {getSortIcon()}
    </div>
  ) : (
    children
  )

  return (
    <th
      ref={ref}
      className={thClassName}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {content}
    </th>
  )
}

const TableHead = React.forwardRef(TableHeadInner) as (<TColumn extends string = string>(
  props: TableHeadProps<TColumn> & { ref?: React.Ref<HTMLTableCellElement> }
) => React.ReactElement) & { displayName?: string }

TableHead.displayName = 'TableHead'

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

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow }
