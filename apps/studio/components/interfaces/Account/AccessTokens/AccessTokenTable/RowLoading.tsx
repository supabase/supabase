import { Skeleton, TableCell, TableRow } from 'ui'

export const RowLoading = () => (
  <TableRow>
    <TableCell>
      <Skeleton className="w-40 max-w-40 h-4 rounded-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="w-60 max-w-60 h-4 rounded-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="max-w-32 h-4 rounded-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="max-w-32 h-4 rounded-full" />
    </TableCell>
    <TableCell>
      <Skeleton className="w-4 h-4 rounded-md" />
    </TableCell>
  </TableRow>
)
