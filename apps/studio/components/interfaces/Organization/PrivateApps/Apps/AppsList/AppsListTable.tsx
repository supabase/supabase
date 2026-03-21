import dayjs from 'dayjs'
import { Key, MoreVertical, Trash } from 'lucide-react'
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
  TableHeadSort,
  TableRow,
} from 'ui'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import type { PrivateApp } from '../../PrivateAppsContext'
import type { AppsSort } from '../Apps.types'

interface AppsListTableProps {
  sortedApps: PrivateApp[]
  sort: AppsSort
  onSortChange: (column: string) => void
  onViewApp: (app: PrivateApp) => void
  onDeleteApp: (app: PrivateApp) => void
}

export function AppsListTable({
  sortedApps,
  sort,
  onSortChange,
  onViewApp,
  onDeleteApp,
}: AppsListTableProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="w-48">
              <TableHeadSort column="created_at" currentSort={sort} onSortChange={onSortChange}>
                Created
              </TableHeadSort>
            </TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedApps.map((app) => (
            <TableRow key={app.id}>
              <TableCell>
                <p className="text-left max-w-[48ch] truncate block">{app.name}</p>
              </TableCell>
              <TableCell>
                <TimestampInfo
                  utcTimestamp={app.created_at}
                  label={dayjs(app.created_at).fromNow()}
                  className="text-sm text-foreground-light whitespace-nowrap"
                />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="default" icon={<MoreVertical size={14} />} className="w-7" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="bottom" className="w-44">
                    <DropdownMenuItem className="gap-x-2" onClick={() => onViewApp(app)}>
                      <Key size={14} />
                      View permissions
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="!text-destructive gap-x-2"
                      onClick={() => onDeleteApp(app)}
                    >
                      <Trash size={14} />
                      Delete
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
