import { TableCell, TableRow } from 'ui'

export const TableRowNoResults = ({ colSpan, search }: { colSpan: number; search?: string }) => {
  return (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <p className="text-sm text-foreground">No results found</p>
        <p className="text-sm text-foreground-light">
          Your search for "{search}" did not return any results
        </p>
      </TableCell>
    </TableRow>
  )
}
