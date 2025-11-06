import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

export default function EmptyStateZeroItemsDataGrid() {
  return (
    <Card className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-foreground-muted">No users in your project</TableHead>
            <TableHead className="text-foreground-muted">
              There are currently no users signed up to your project
            </TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="[&>td]:hover:bg-inherit">
            <TableCell colSpan={3}>
              <p className="text-sm text-foreground">No tables yet</p>
              <p className="text-sm text-foreground-lighter">Connect a table from your database</p>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  )
}
