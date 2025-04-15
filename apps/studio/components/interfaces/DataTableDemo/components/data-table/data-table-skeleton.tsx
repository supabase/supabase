import { Skeleton } from 'ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/interfaces/DataTableDemo/components/custom/table'

interface DataTableSkeletonProps {
  /**
   * Number of rows to render
   * @default 10
   */
  rows?: number
}

export function DataTableSkeleton({ rows = 10 }: DataTableSkeletonProps) {
  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          <TableHead>
            <Skeleton className="my-1.5 h-4 w-24" />
          </TableHead>
          <TableHead className="hidden sm:table-cell">
            <Skeleton className="my-1.5 h-4 w-32" />
          </TableHead>
          <TableHead className="hidden md:table-cell">
            <Skeleton className="my-1.5 h-4 w-16" />
          </TableHead>
          <TableHead>
            <Skeleton className="my-1.5 h-4 w-20" />
          </TableHead>
          <TableHead className="flex items-center justify-end" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {new Array(rows).fill(0).map((_, i) => (
          <TableRow key={i} className="hover:bg-transparent">
            <TableCell>
              <Skeleton className="my-1.5 h-4 w-full max-w-[10rem]" />
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Skeleton className="my-1.5 h-4 w-full max-w-[13rem]" />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Skeleton className="my-1.5 h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="my-1.5 h-4 w-full max-w-[10rem]" />
            </TableCell>
            <TableCell className="flex justify-end">
              <Skeleton className="my-1.5 h-5 w-5" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
