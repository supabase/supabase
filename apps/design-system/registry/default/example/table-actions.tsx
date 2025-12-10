import { EllipsisVertical, User } from 'lucide-react'
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

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
          <TableRow>
            <TableCell className="w-1">
              <User size={16} className="text-foreground-muted" />
            </TableCell>
            <TableCell>Feathers McGraw</TableCell>
            <TableCell className="text-foreground-lighter">feathers@example.com</TableCell>
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
          <TableRow>
            <TableCell className="w-1">
              <User size={16} className="text-foreground-muted" />
            </TableCell>
            <TableCell>Piella Bakewell</TableCell>
            <TableCell className="text-foreground-lighter">piella@example.com</TableCell>
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
        </TableBody>
      </Table>
    </Card>
  )
}
