import { EllipsisVertical, User } from 'lucide-react'
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

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

export default function TableActions() {
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
            <TableHead className="w-1">
              <span className="sr-only">Actions</span>
            </TableHead>
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
              <TableCell className="flex items-center gap-x-2">
                <Button type="default" size="tiny">
                  Inspect
                </Button>
                <Button
                  icon={<EllipsisVertical />}
                  aria-label={`More actions`}
                  type="default"
                  size="tiny"
                  className="w-7"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
