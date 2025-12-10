import { User } from 'lucide-react'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

export default function TableIcons() {
  return (
    <Card className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1">
              <span className="sr-only">Icon</span>
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="w-1">
              <User size={16} className="text-foreground-muted" />
            </TableCell>
            <TableCell>Feathers McGraw</TableCell>
            <TableCell className="text-foreground-lighter">feathers@example.com</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="w-1">
              <User size={16} className="text-foreground-muted" />
            </TableCell>
            <TableCell>Piella Bakewell</TableCell>
            <TableCell className="text-foreground-lighter">piella@example.com</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  )
}
