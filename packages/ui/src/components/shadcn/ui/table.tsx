import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import type { ComponentProps, ComponentPropsWithRef, ReactNode } from 'react'

import { cn } from '../../../lib/utils/cn'
import { ShadowScrollArea } from '../../ShadowScrollArea'

const tableVariants = cva('group/table w-full caption-bottom', {
  variants: {
    prose: {
      true: cn(
        'my-0',
        '[&_td:first-child_code]:whitespace-nowrap',
        '[&_td:not(:first-child)_code]:break-all',
        '[&_td]:box-content [&_td]:min-w-18',
        '[&_:is(th,td):not(:last-child)]:pr-8',
        '[&_th]:whitespace-nowrap'
      ),
      false: 'text-sm',
    },
  },
  defaultVariants: { prose: false },
})

interface TableProps extends ComponentPropsWithRef<'table'>, VariantProps<typeof tableVariants> {
  containerProps?: Partial<ComponentProps<typeof ShadowScrollArea>>
}

const Table = ({ className, containerProps, prose, ...props }: TableProps) => {
  const table = <table className={cn(tableVariants({ prose }), className)} {...props} />

  // prose pages can render without hydration, so prose uses a css-only scroll fade. other tables
  // keep ShadowScrollArea for its sticky last column
  if (prose) return <div className="my-7 overflow-x-auto scroll-fade-x">{table}</div>

  return <ShadowScrollArea {...containerProps}>{table}</ShadowScrollArea>
}

const TableHeader = ({ className, ...props }: ComponentPropsWithRef<'thead'>) => (
  <thead className={cn('[&_tr]:border-b [&>tr]:bg-200', className)} {...props} />
)

const TableBody = ({ className, ...props }: ComponentPropsWithRef<'tbody'>) => (
  <tbody
    className={cn(
      '[&_tr:last-child]:border-0',
      // :where() keeps this at lower specificity than a row's own hover:* class, so rows can opt out (e.g. loading/empty states)
      '[:where(&)>tr]:hover:bg-surface-200',
      className
    )}
    {...props}
  />
)

const TableFooter = ({ className, ...props }: ComponentPropsWithRef<'tfoot'>) => (
  <tfoot className={cn('border-t font-medium', className)} {...props} />
)

const TableRow = ({ className, ...props }: ComponentPropsWithRef<'tr'>) => (
  <tr className={cn('border-b group data-[state=selected]:bg-muted', className)} {...props} />
)

const TableHead = ({ className, ...props }: ComponentPropsWithRef<'th'>) => (
  <th
    className={cn(
      'h-10 px-4 text-left align-middle heading-meta whitespace-nowrap text-foreground-lighter [&:has([role=checkbox])]:pr-0',
      // Transition text color when NoSearchResults or NoFilterResults empty state is shown
      'transition-colors',
      className
    )}
    {...props}
  />
)

interface TableHeadSortProps<TColumn extends string = string> {
  column: TColumn
  currentSort: string
  onSortChange: (column: TColumn) => void
  children: ReactNode
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
            !isActive ? 'group-hover/table-head-sort:opacity-80' : 'opacity-0!'
          )}
        />
      </>
    )
  }

  return (
    <button
      type="button"
      tabIndex={0}
      className={cn(
        'group/table-head-sort heading-meta whitespace-nowrap flex items-center gap-1 cursor-pointer select-none bg-transparent! border-none p-0 w-full text-left',
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

const TableCell = ({ className, ...props }: ComponentPropsWithRef<'td'>) => (
  <td
    className={cn('transition-colors p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
)

const TableCaption = ({ className, ...props }: ComponentPropsWithRef<'caption'>) => (
  <caption
    className={cn(
      'border-t', // TableCaption is aligned by parent Table at caption-bottom
      'p-4 text-sm text-foreground-muted', // Match styling of TableCell
      className
    )}
    // Should only contain inline elements
    {...props}
  />
)

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
