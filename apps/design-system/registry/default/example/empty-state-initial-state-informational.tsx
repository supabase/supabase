import { Plus } from 'lucide-react'
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

export default function EmptyStateZeroItemsTable() {
  return (
    <div className="flex flex-col gap-y-4 w-full">
      <Button className="w-fit self-end" type="primary" size="tiny" icon={<Plus size={14} />}>
        New table
      </Button>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-foreground-muted">Table name</TableHead>
              <TableHead className="text-foreground-muted">Date created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="[&>td]:hover:bg-inherit">
              <TableCell colSpan={3}>
                <p className="text-sm text-foreground">No tables yet</p>
                <p className="text-sm text-foreground-lighter">Create a table to get started</p>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
