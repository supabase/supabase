import { type PropsWithChildren } from 'react'
import { cn, TableCell, TableRow } from 'ui'

interface TableRowNoResultsProps {
  className?: string
  colSpan: number
  search?: string
  /** Keep the live region mounted so changes are announced as search results update. */
  isVisible?: boolean
}

export const TableRowNoResults = ({
  className,
  colSpan,
  search,
  isVisible = true,
  children,
}: PropsWithChildren<TableRowNoResultsProps>) => {
  return (
    <TableRow className={cn(className, !isVisible && 'sr-only')}>
      <TableCell colSpan={colSpan}>
        <div role="status" aria-live="polite" aria-atomic="true">
          {isVisible &&
            (children ?? (
              <>
                <p className="text-sm text-foreground">No results found</p>
                <p className="text-sm text-foreground-light">
                  Your search for "{search}" did not return any results
                </p>
              </>
            ))}
        </div>
      </TableCell>
    </TableRow>
  )
}
