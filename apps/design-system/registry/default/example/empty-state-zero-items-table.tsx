import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

export default function EmptyStateZeroItemsTable() {
  return (
    <Card className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-foreground-muted">Name</TableHead>
            <TableHead className="text-foreground-muted">Created</TableHead>
            <TableHead className="text-foreground-muted">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="[&>td]:hover:bg-inherit">
            <TableCell colSpan={3}>
              <p className="text-sm text-foreground">No results found</p>
              <p className="text-sm text-foreground-lighter">
                Your search for “test” did not return any results
              </p>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  )
}
