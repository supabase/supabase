import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

export function AppsListLoading() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="max-w-xs">Name</TableHead>
            <TableHead className="w-48">Created</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="h-4 w-32 bg-surface-300 rounded-sm animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-24 bg-surface-300 rounded-sm animate-pulse" />
              </TableCell>
              <TableCell />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
