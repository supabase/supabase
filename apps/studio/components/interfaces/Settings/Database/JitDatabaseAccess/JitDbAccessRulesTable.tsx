import { EllipsisVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import type { JitUserRule } from './JitDbAccess.types'
import { getJitStatusDisplay } from './JitDbAccess.utils'

interface JitDbAccessRulesTableProps {
  users: JitUserRule[]
  isLoading?: boolean
  canUpdate: boolean
  disableActions?: boolean
  onAddRule: () => void
  onEditRule: (user: JitUserRule) => void
  onDeleteRule: (user: JitUserRule) => void
}

export function JitDbAccessRulesTable({
  users,
  isLoading = false,
  canUpdate,
  disableActions = false,
  onAddRule,
  onEditRule,
  onDeleteRule,
}: JitDbAccessRulesTableProps) {
  const addDisabled = disableActions || !canUpdate

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-0">
        <div className="flex items-center justify-between px-4 pb-2 pt-6">
          <div>
            <h3 className="text-sm text-foreground">JIT access rules</h3>
            <p className="text-sm text-foreground-light">
              Configure which members can request temporary database access.
            </p>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="default" icon={<Plus />} onClick={onAddRule} disabled={addDisabled}>
                Add rule
              </Button>
            </TooltipTrigger>
            {!canUpdate && (
              <TooltipContent side="bottom">
                You need additional permissions to manage JIT access rules.
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        <Table className="border-t">
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-1">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow className="[&>td]:hover:bg-inherit">
                <TableCell colSpan={4}>
                  <p className="text-sm text-foreground">No JIT access rules</p>
                  <p className="text-sm text-foreground-lighter">
                    Add your first JIT access rule above
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const statusDisplay = getJitStatusDisplay(user.status)
                const enabledGrants = user.grants.filter((grant) => grant.enabled)
                const rowIsInteractive = canUpdate && !disableActions

                return (
                  <TableRow
                    key={user.id}
                    className={rowIsInteractive ? 'relative inset-focus cursor-pointer' : undefined}
                    onClick={
                      rowIsInteractive
                        ? (event) => {
                            if ((event.target as HTMLElement).closest('button')) return
                            onEditRule(user)
                          }
                        : undefined
                    }
                    onKeyDown={
                      rowIsInteractive
                        ? (event) => {
                            if ((event.target as HTMLElement).closest('button')) return
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              onEditRule(user)
                            }
                          }
                        : undefined
                    }
                    tabIndex={rowIsInteractive ? 0 : undefined}
                  >
                    <TableCell className="text-sm">
                      {user.name && <p>{user.name}</p>}
                      <p className="text-foreground-lighter">{user.email}</p>
                    </TableCell>
                    <TableCell className="text-sm text-foreground-light">
                      {enabledGrants.length} role{enabledGrants.length === 1 ? '' : 's'}
                    </TableCell>
                    <TableCell className="text-sm text-foreground-light">
                      {statusDisplay.badges.length > 0 ? (
                        <span className="flex flex-wrap gap-1.5">
                          {statusDisplay.badges.map((badge) => (
                            <Badge key={badge.label} variant={badge.variant}>
                              {badge.label}
                            </Badge>
                          ))}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            icon={<EllipsisVertical />}
                            aria-label="More actions"
                            type="default"
                            size="tiny"
                            className="w-7"
                            disabled={!canUpdate || disableActions}
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="bottom" className="w-40">
                          <DropdownMenuItem
                            className="gap-x-2"
                            onClick={(event) => {
                              event.stopPropagation()
                              onEditRule(user)
                            }}
                            disabled={!canUpdate || disableActions}
                          >
                            <Pencil size={14} className="text-foreground-lighter" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-x-2"
                            onClick={(event) => {
                              event.stopPropagation()
                              onDeleteRule(user)
                            }}
                            disabled={!canUpdate || disableActions}
                          >
                            <Trash2 size={14} className="text-foreground-lighter" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
