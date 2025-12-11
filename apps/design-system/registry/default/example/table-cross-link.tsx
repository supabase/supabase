import { DatabaseZap, Edit2, EllipsisVertical } from 'lucide-react'
import Link from 'next/link'
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

export default function TableCrossLink() {
  return (
    <Card className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1">
              <span className="sr-only">Icon</span>
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Table</TableHead>
            <TableHead>Function</TableHead>
            <TableHead className="w-1">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="w-1">
              <DatabaseZap size={16} className="text-foreground-muted" />
            </TableCell>
            <TableCell>trigger_purchase</TableCell>
            <TableCell>
              <Link
                className="text-link-table-cell text-foreground-lighter hover:text-foreground duration-100"
                // Demo purposes only
                href="/"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                stock
              </Link>
            </TableCell>
            <TableCell>
              <Link
                className="text-link-table-cell text-foreground-lighter hover:text-foreground duration-100"
                // Demo purposes only
                href="/"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                check_stock_levels
              </Link>
            </TableCell>
            <TableCell className="flex items-center gap-x-2">
              <Button type="default" size="tiny" icon={<Edit2 />}>
                Edit
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
              <DatabaseZap size={16} className="text-foreground-muted" />
            </TableCell>
            <TableCell>trigger_refund</TableCell>
            <TableCell>
              <Link
                className="text-link-table-cell text-foreground-lighter hover:text-foreground duration-100"
                // Demo purposes only
                href="/"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                stock
              </Link>
            </TableCell>
            <TableCell>
              <Link
                className="text-link-table-cell text-foreground-lighter hover:text-foreground duration-100"
                // Demo purposes only
                href="/"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                process_return
              </Link>
            </TableCell>
            <TableCell className="flex items-center gap-x-2">
              <Button type="default" size="tiny" icon={<Edit2 />}>
                Edit
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
