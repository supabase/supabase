import { EllipsisVerticalIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

import type { JitUserRule } from './JitDbAccess.types'
import { getJitStatusDisplay } from './JitDbAccess.utils'
import { JitDbAccessInfo } from './JitDbAccessInfo'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'

interface JitDbAccessRulesTableProps {
  users: JitUserRule[]
  isLoading?: boolean
  canUpdate: boolean
  disableActions?: boolean
  allProjectMembersHaveRules?: boolean
  onAddRule: () => void
  onEditRule: (user: JitUserRule) => void
  onDeleteRule: (user: JitUserRule) => void
}

export function JitDbAccessRulesTable({
  users,
  isLoading = false,
  canUpdate,
  disableActions = false,
  allProjectMembersHaveRules = false,
  onAddRule,
  onEditRule,
  onDeleteRule,
}: JitDbAccessRulesTableProps) {
  const addDisabled = disableActions || !canUpdate || allProjectMembersHaveRules
  const addRuleTooltip = !canUpdate
    ? 'Additional permissions required'
    : allProjectMembersHaveRules
      ? 'All project members already have temporary access rules'
      : undefined

  const { can: canManageJitDbAccess } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.DATABASE_JIT_WRITE
  )

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
      <CardContent className="p-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-y-0.5 mb-0">
            <CardTitle>Temporary access rules</CardTitle>
            <CardDescription>
              Manage member access, allowed roles, and expiry settings.
            </CardDescription>
          </div>
          {canManageJitDbAccess && (
            <ButtonTooltip
              icon={<PlusIcon />}
              onClick={onAddRule}
              disabled={addDisabled}
              tooltip={{ content: { side: 'bottom', text: addRuleTooltip } }}
            >
              Add rule
            </ButtonTooltip>
          )}
        </CardHeader>

        <JitDbAccessInfo />

        {canManageJitDbAccess && (
          <Table>
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
                    <p className="text-sm text-foreground">No rules yet</p>
                    <p className="text-sm text-foreground-lighter">
                      Add your first temporary access rule above
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
                      className={
                        rowIsInteractive ? 'relative focus-inset cursor-pointer' : undefined
                      }
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
                        {enabledGrants.length} role
                        {enabledGrants.length === 1 ? '' : <span>s</span>}
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
                              icon={<EllipsisVerticalIcon />}
                              aria-label="More actions"
                              size="tiny"
                              className="w-7 hit-area-2"
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
                              <PencilIcon size={14} className="text-foreground-lighter" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-x-2"
                              onClick={(event) => {
                                event.stopPropagation()
                                onDeleteRule(user)
                              }}
                              disabled={!canUpdate || disableActions}
                            >
                              <Trash2Icon size={14} className="text-foreground-lighter" />
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
        )}
      </CardContent>
    </Card>
  )
}
