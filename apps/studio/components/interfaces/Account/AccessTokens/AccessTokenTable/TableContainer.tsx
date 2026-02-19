import { Card, CardContent, cn } from 'ui'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableHeadSort,
  TableRow,
} from 'ui/src/components/shadcn/ui/table'
import { AccessTokenSort, AccessTokenSortColumn } from '../AccessToken.types'

const tableHeaderClass = 'text-left font-mono uppercase text-xs text-foreground-lighter py-2'

interface TableContainerProps {
  children: React.ReactNode
  sort: AccessTokenSort
  onSortChange: (column: AccessTokenSortColumn) => void
}

export const TableContainer = ({ children, sort, onSortChange }: TableContainerProps) => (
  <Card className="w-full overflow-hidden">
    <CardContent className="p-0">
      <Table className="p-5 table-auto">
        <TableHeader>
          <TableRow className="bg-200">
            <TableHead className={tableHeaderClass}>Token</TableHead>
            <TableHead className={tableHeaderClass}>
              <TableHeadSort column="last_used_at" currentSort={sort} onSortChange={onSortChange}>
                Last used
              </TableHeadSort>
            </TableHead>
            <TableHead className={tableHeaderClass}>
              <TableHeadSort column="expires_at" currentSort={sort} onSortChange={onSortChange}>
                Expires
              </TableHeadSort>
            </TableHead>
            <TableHead className={cn(tableHeaderClass, '!text-right')} />
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </CardContent>
  </Card>
)
