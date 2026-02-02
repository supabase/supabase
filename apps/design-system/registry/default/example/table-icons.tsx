import { User } from 'lucide-react'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

const users = [
  {
    name: 'Feathers McGraw',
    email: 'feathers@example.com',
  },
  {
    name: 'Piella Bakewell',
    email: 'piella@example.com',
  },
  {
    name: 'Wendolene Ramsbottom',
    email: 'wendolene@example.com',
  },
]

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
          {users.map((user) => (
            <TableRow key={user.email}>
              <TableCell className="w-1">
                <User size={16} className="text-foreground-muted" />
              </TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell className="text-foreground-lighter">{user.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
