import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardContent,
} from 'ui'

const LiveQueriesTable = () => {
  // Placeholder rows
  const data = [] as Array<{ id: string; name: string; params: string[]; createdAt: string }>

  return (
    <div className="px-10 py-8">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">Name</TableHead>
                <TableHead className="w-1/4">Parameters</TableHead>
                <TableHead className="w-1/4">Created</TableHead>
                <TableHead className="text-right w-1/4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <p className="text-sm text-foreground">No queries created yet</p>
                    <p className="text-sm text-foreground-light">Click Add Query to create one</p>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="truncate">{row.name}</TableCell>
                    <TableCell className="truncate">{row.params.join(', ')}</TableCell>
                    <TableCell>{row.createdAt}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default LiveQueriesTable
