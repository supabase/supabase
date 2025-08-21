import * as React from 'react'

import { cn } from '../../../lib/utils/cn'

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  containerProps?: React.HTMLAttributes<HTMLDivElement>
}

// Custom hook to detect horizontal scrolling
const useHorizontalScroll = (ref: React.RefObject<HTMLDivElement>) => {
  const [hasHorizontalScroll, setHasHorizontalScroll] = React.useState(false)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const checkScroll = () => {
      const hasScroll = element.scrollWidth > element.clientWidth
      setHasHorizontalScroll(hasScroll)

      if (hasScroll) {
        const canScrollLeft = element.scrollLeft > 0
        const canScrollRight = element.scrollLeft < element.scrollWidth - element.clientWidth
        setCanScrollLeft(canScrollLeft)
        setCanScrollRight(canScrollRight)
      } else {
        setCanScrollLeft(false)
        setCanScrollRight(false)
      }
    }

    const handleScroll = () => {
      if (hasHorizontalScroll) {
        const canScrollLeft = element.scrollLeft > 0
        const canScrollRight = element.scrollLeft < element.scrollWidth - element.clientWidth
        setCanScrollLeft(canScrollLeft)
        setCanScrollRight(canScrollRight)
      }
    }

    checkScroll()
    element.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      element.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [ref, hasHorizontalScroll])

  return { hasHorizontalScroll, canScrollLeft, canScrollRight }
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, containerProps, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const { hasHorizontalScroll, canScrollLeft, canScrollRight } = useHorizontalScroll(containerRef)

    return (
      <div className="relative">
        {/* Fixed shadows positioned relative to the wrapper */}
        <div
          className={cn(
            'absolute inset-0 pointer-events-none z-10',
            'before:absolute before:top-0 before:right-0 before:bottom-0 before:w-4 before:bg-gradient-to-l before:from-black/20 before:to-transparent before:opacity-0 before:transition-opacity before:duration-200',
            'after:absolute after:top-0 after:left-0 after:bottom-0 after:w-4 after:bg-gradient-to-r after:from-black/20 after:to-transparent after:opacity-0 after:transition-opacity after:duration-200',
            hasHorizontalScroll && 'hover:before:opacity-100 hover:after:opacity-100',
            canScrollRight && 'before:opacity-100',
            canScrollLeft && 'after:opacity-100'
          )}
        />
        {/* Scrollable table container */}
        <div ref={containerRef} className={cn('w-full overflow-auto')} {...containerProps}>
          <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
        </div>
      </div>
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
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
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
      'h-10 px-4 text-left align-middle heading-meta text-foreground-lighter [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
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
