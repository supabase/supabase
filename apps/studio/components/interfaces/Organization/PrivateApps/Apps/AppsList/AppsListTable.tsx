import dayjs from 'dayjs'
import { ArrowUpCircle, Key, MoreVertical, Trash } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  installedAppIds: Set<string>
  onSortChange: (column: string) => void
  onViewApp: (app: PrivateApp) => void
  onDeleteApp: (app: PrivateApp) => void
  onPromoteApp: (app: PrivateApp) => void
}

export function AppsListTable({
  sortedApps,
  sort,
  installedAppIds,
  onSortChange,
  onViewApp,
  onDeleteApp,
  onPromoteApp,
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
          {sortedApps.map((app) => {
            const isInstalled = installedAppIds.has(app.id)
            return (
              <TableRow key={app.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <p className="text-left max-w-[48ch] truncate">{app.name}</p>
                    {isInstalled && (
                      <Badge variant="success" className="uppercase">
                        Installed
                      </Badge>
                    )}
                  </div>
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
                      {!isInstalled && (
                        <DropdownMenuItem className="gap-x-2" onClick={() => onPromoteApp(app)}>
                          <ArrowUpCircle size={14} />
                          Promote to installed
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive! gap-x-2"
                        onClick={() => onDeleteApp(app)}
                      >
                        <Trash size={14} />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
