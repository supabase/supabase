import { type PropsWithChildren } from 'react'
import { TableCell, TableRow } from 'ui'

interface TableRowNoResultsProps {
  className?: string
  colSpan: number
  search?: string
}

export const TableRowNoResults = ({
  className,
  colSpan,
  search,
  children,
}: PropsWithChildren<TableRowNoResultsProps>) => {
  return (
    <TableRow className={className}>
      <TableCell colSpan={colSpan}>
        {children ?? (
          <>
            <p className="text-sm text-foreground">No results found</p>
            <p className="text-sm text-foreground-light">
              Your search for "{search}" did not return any results
            </p>
          </>
        )}
      </TableCell>
    </TableRow>
  )
}
