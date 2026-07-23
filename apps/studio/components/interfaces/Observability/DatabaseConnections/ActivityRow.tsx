import { Minus, MoreVertical, StopCircle } from 'lucide-react'
import { parseAsInteger, useQueryState } from 'nuqs'
import { Fragment, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  cn,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import {
  QUERY_STATE_TOOLTIP,
  WARN_DURATION_ACTIVE_QUERY,
  WARN_DURATION_IDLE_TXN,
} from './DatabaseConnections.constants'
import { getBadgeVariant, getDuration } from './DatabaseConnections.utils'
import { formatDuration } from '@/components/interfaces/QueryPerformance/QueryPerformance.utils'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useDatabaseRolesQuery } from '@/data/database-roles/database-roles-query'
import { useDatabaseActivityQuery, type DatabaseActivity } from '@/data/database/activity-query'
import { useQueryAbortMutation } from '@/data/sql/abort-query-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { formatSql } from '@/lib/formatSql'

const getBlockChain = (pid: number, activities: DatabaseActivity[]) => {
  const chain = [pid]
  const visited = new Set([pid])
  let current = activities.find((x) => x.pid === pid)

  while (current && current.blocked_by.length > 0) {
    const nextPid = current.blocked_by[0]
    if (visited.has(nextPid)) break
    chain.push(nextPid)
    visited.add(nextPid)
    current = activities.find((x) => x.pid === nextPid)
  }

  return chain
}

export const ActivityRow = ({ activity }: { activity: DatabaseActivity }) => {
  const { data: project } = useSelectedProjectQuery()
  const [showTerminateConfirmDialog, setShowTerminateConfirmDialog] = useState(false)
  const [selectedPid, setSelectedPid] = useQueryState('pid', parseAsInteger)

  const { data } = useDatabaseActivityQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: roles } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const superuserRoles = roles?.filter((role) => role.isSuperuser).map((role) => role.name)

  const { mutateAsync: abortQuery } = useQueryAbortMutation({
    onSuccess: () => {
      toast.success(`Successfully aborted query (ID: ${activity.pid})`)
    },
  })

  const durationSeconds = getDuration(activity)
  const badgeVariant = getBadgeVariant(activity)

  /**
   * Queries in "active state": 30s threshold is long enough (most CRUD queries should be quick)
   * Queries in "idle in transaction" state: This actively holds locks and blocks autovacuum while contributing nothing, so important to surface early at 10s threshold
   */
  const queryRunningLongWarning =
    !!durationSeconds &&
    ((activity.state === 'active' && durationSeconds >= WARN_DURATION_ACTIVE_QUERY) ||
      ((activity.state === 'idle in transaction' ||
        activity.state === 'idle in transaction (aborted)') &&
        durationSeconds >= WARN_DURATION_IDLE_TXN))

  const onConfirmTerminate = async () => {
    try {
      await abortQuery({
        pid: activity.pid,
        projectRef: project?.ref,
        connectionString: project?.connectionString,
      })
    } catch (error) {}
  }

  return (
    <>
      <TableRow id={activity.pid.toString()} key={activity.pid}>
        <TableCell className="relative w-[70px]">
          {selectedPid === activity.pid && (
            <div className="absolute h-full bg-brand top-0 left-0 w-1 bg-foreground-lighter"></div>
          )}
          <Tooltip>
            <TooltipTrigger>
              <Badge variant={badgeVariant}>{activity.state}</Badge>
            </TooltipTrigger>
            {activity.state && (
              <TooltipContent side="bottom">{QUERY_STATE_TOOLTIP[activity.state]}</TooltipContent>
            )}
          </Tooltip>
        </TableCell>
        <TableCell className="max-w-[300px]">
          <HoverCard openDelay={250} closeDelay={100}>
            <HoverCardTrigger>
              <p
                className={cn(
                  'truncate',
                  !activity.query ? 'text-foreground-lighter' : 'font-mono tracking-tighter'
                )}
              >
                {!!activity.query ? activity.query : 'No query'}
              </p>
            </HoverCardTrigger>
            {activity.query && (
              <HoverCardContent align="start" className="w-96 p-0">
                <CodeBlock
                  hideLineNumbers
                  className={cn(
                    'max-w-96 border-none [&>code]:text-xs max-h-64',
                    '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap min-h-11'
                  )}
                  wrapperClassName={cn('[&_pre]:px-4 [&_pre]:py-0')}
                  language="pgsql"
                  value={formatSql(activity.query)}
                />
              </HoverCardContent>
            )}
          </HoverCard>
          <div className="text-xs text-foreground-lighter flex items-center gap-x-1 mt-0.5 truncate">
            <Tooltip>
              <TooltipTrigger
                className="cursor-pointer"
                onClick={() => {
                  toast.success('Copied PID')
                  copyToClipboard(activity.pid.toString())
                }}
              >
                <span>PID: {activity.pid}</span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Click to copy</TooltipContent>
            </Tooltip>
            <span>·</span>
            <span>{activity.role_name}</span>
            {activity.application_name && (
              <>
                <span>·</span>
                <span>{activity.application_name}</span>
              </>
            )}
          </div>
        </TableCell>

        <TableCell>
          <p
            className={cn(
              'tabular-nums truncate',
              queryRunningLongWarning
                ? activity.state === 'active'
                  ? 'text-warning'
                  : 'text-destructive'
                : undefined
            )}
          >
            {durationSeconds !== null ? (
              formatDuration(durationSeconds * 1000, 0)
            ) : (
              <Minus size={12} className="text-foreground-lighter" />
            )}
          </p>
        </TableCell>

        <TableCell>
          {activity.blocked_by.length > 0 ? (
            activity.blocked_by.map((pid, index) => {
              const blockChain = getBlockChain(pid, data ?? [])

              return (
                <Fragment key={pid}>
                  {index > 0 && ', '}

                  <HoverCard openDelay={150} closeDelay={100}>
                    <HoverCardTrigger
                      className={cn(InlineLinkClassName, 'cursor-pointer')}
                      onClick={() => setSelectedPid(pid)}
                    >
                      {pid}
                    </HoverCardTrigger>
                    <HoverCardContent className="bg-alternative w-96 max-h-64 overflow-y-auto p-3 text-xs">
                      <p>
                        Blocked via {blockChain.length} hop{blockChain.length > 1 ? 's' : ''}
                      </p>

                      <div className="flex flex-col mt-2 gap-y-1.5">
                        {blockChain.map((chainPid, chainIndex) => {
                          const chainProcess = data?.find((x) => x.pid === chainPid)
                          const isLastProcess = chainIndex === blockChain.length - 1
                          return (
                            <div
                              key={chainPid}
                              className="flex items-center"
                              style={{
                                paddingLeft:
                                  chainIndex === 0
                                    ? 0
                                    : chainIndex === 1
                                      ? 3
                                      : (chainIndex - 1) * 20 + 4,
                              }}
                            >
                              {chainIndex > 0 && (
                                <div
                                  className={cn(
                                    'w-3 h-4 border-l-1 border-b-1 border-stronger rounded-bl-md shrink-0  mr-1.5',
                                    isLastProcess ? '-mt-12' : '-mt-8'
                                  )}
                                />
                              )}
                              <div className="truncate">
                                <div className="flex gap-x-1 items-center">
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    className="cursor-pointer hover:underline"
                                    onClick={() => setSelectedPid(chainPid)}
                                  >
                                    PID: {chainPid}
                                  </span>
                                  {isLastProcess ? (
                                    <Badge variant="warning">Holding lock</Badge>
                                  ) : (
                                    <Badge variant="default">Waiting</Badge>
                                  )}
                                </div>
                                <p
                                  className={cn(
                                    'font-mono tracking-tighter truncate',
                                    isLastProcess ? 'text-foreground' : 'text-foreground-lighter'
                                  )}
                                >
                                  {chainProcess?.query}
                                </p>
                                {isLastProcess && (
                                  <div className="flex gap-x-0.5 text-foreground-lighter truncate">
                                    <span>{chainProcess?.role_name}</span>
                                    <span>·</span>
                                    {chainProcess?.application_name && (
                                      <span>{chainProcess.application_name}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </Fragment>
              )
            })
          ) : (
            <Minus size={12} className="text-foreground-lighter" />
          )}
        </TableCell>

        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="More actions"
                variant="text"
                className="px-1"
                icon={<MoreVertical />}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItemTooltip
                className="gap-x-2"
                disabled={superuserRoles?.includes(activity.role_name)}
                onClick={() => setShowTerminateConfirmDialog(true)}
                tooltip={{
                  content: {
                    side: 'left',
                    text: 'Unable to terminate queries run by superuser roles',
                  },
                }}
              >
                <StopCircle size={12} />
                <span>Terminate</span>
              </DropdownMenuItemTooltip>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <AlertDialog open={showTerminateConfirmDialog} onOpenChange={setShowTerminateConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm to terminate this process?</AlertDialogTitle>
            <AlertDialogDescription>
              This will force the query to stop running.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="warning" onClick={onConfirmTerminate}>
              Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
