import { Copy, DatabaseZap, Edit2, EllipsisVertical, Trash2 } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

const triggers = [
  {
    name: 'trigger_purchase',
    table: 'stock',
    function: 'check_stock_levels',
  },
  {
    name: 'trigger_refund',
    table: 'stock',
    function: 'process_return',
  },
  {
    name: 'trigger_update',
    table: 'inventory',
    function: 'update_quantity',
  },
]

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
          {triggers.map((trigger) => (
            <TableRow key={trigger.name}>
              <TableCell className="w-1">
                <DatabaseZap size={16} className="text-foreground-muted" />
              </TableCell>
              <TableCell>{trigger.name}</TableCell>
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
                  {trigger.table}
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
                  {trigger.function}
                </Link>
              </TableCell>
              <TableCell className="flex items-center gap-x-2">
                <Button type="default" size="tiny" icon={<Edit2 />} className="hit-area-2">
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="default"
                      icon={<EllipsisVertical />}
                      aria-label="More actions"
                      className="w-7 hit-area-2"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end" className="w-40">
                    <DropdownMenuItem className="gap-x-2">
                      <Copy size={14} />
                      <span>Duplicate trigger</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-x-2">
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
