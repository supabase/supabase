import dayjs from 'dayjs'
import { isEqual } from 'lodash'
import { Minus, MoreVertical, StopCircle, X } from 'lucide-react'
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { Fragment, useEffect, useState } from 'react'
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
  Card,
  cn,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
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
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ReportsSelectFilter } from '../../Reports/v2/ReportsSelectFilter'
import {
  QUERY_STATE_TOOLTIP,
  WARN_DURATION_ACTIVE_QUERY,
  WARN_DURATION_IDLE_TXN,
} from './DatabaseConnections.constants'
import { formatDuration } from '@/components/interfaces/QueryPerformance/QueryPerformance.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useDatabaseRolesQuery } from '@/data/database-roles/database-roles-query'
import { useDatabaseActivityQuery, type DatabaseActivity } from '@/data/database/activity-query'
import { useQueryAbortMutation } from '@/data/sql/abort-query-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { formatSql } from '@/lib/formatSql'

const getDuration = (activity: DatabaseActivity) => {
  const { state } = activity
  if (state === 'active' && activity.query_start) {
    return dayjs().utc().diff(dayjs(activity.query_start).utc(), 'second')
  }
  if (state === 'idle' && activity.state_change) {
    return dayjs().utc().diff(dayjs(activity.state_change).utc(), 'second')
  }
  if (
    (state === 'idle in transaction' || state === 'idle in transaction (aborted)') &&
    activity.transaction_start
  ) {
    return dayjs().utc().diff(dayjs(activity.transaction_start).utc(), 'second')
  }
  return null
}

const getBadgeVariant = (activity: DatabaseActivity) => {
  const { state } = activity
  if (state === 'active') return 'success'
  if (state === 'idle in transaction' || state === 'idle in transaction (aborted)') return 'warning'
  return 'default'
}

const DEFAULT_ROLES_FILTER = ['anon', 'authenticated', 'postgres']

interface ActivityProps {
  live?: boolean
}

export const Activity = ({ live }: ActivityProps) => {
  const { data: project } = useSelectedProjectQuery()

  const [selectedPid] = useQueryState('pid', parseAsInteger)

  const [
    { states: statesFilter, applications: applicationsFilter, roles: rolesFilter },
    setQueryStates,
  ] = useQueryStates({
    states: parseAsArrayOf(parseAsString, ',').withDefault([]),
    applications: parseAsArrayOf(parseAsString, ',').withDefault([]),
    roles: parseAsArrayOf(parseAsString, ',').withDefault(DEFAULT_ROLES_FILTER),
  })

  const hasNoFiltersApplied =
    statesFilter.length === 0 &&
    applicationsFilter.length === 0 &&
    isEqual(rolesFilter, DEFAULT_ROLES_FILTER)

  const { data, isPending, isSuccess } = useDatabaseActivityQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    { refetchOnWindowFocus: live, refetchInterval: live ? 3000 : false }
  )

  const { data: roles } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const activities = data?.filter((activity) => {
    const matchesState =
      !statesFilter ||
      statesFilter.length === 0 ||
      (activity.state !== null && statesFilter.includes(activity.state))
    const matchesRole = rolesFilter.length === 0 || rolesFilter.includes(activity.role_name)
    const matchesApplication =
      applicationsFilter.length === 0 || applicationsFilter.includes(activity.application_name)
    return matchesState && matchesRole && matchesApplication
  })

  const stateOptions = [
    'Idle',
    'Active',
    'Idle in transaction',
    'Idle in transaction (aborted)',
    'Fastpath function call',
    'Disabled',
  ].map((x) => ({
    label: x,
    value: x.toLowerCase(),
    quantity: data?.filter(
      (y) =>
        y.state === x.toLowerCase() &&
        (rolesFilter.length === 0 || rolesFilter.includes(y.role_name)) &&
        (applicationsFilter.length === 0 || applicationsFilter.includes(y.application_name))
    ).length,
  }))

  const applicationOptions = Array.from(new Set(data?.map((x) => x.application_name) ?? []))
    .sort()
    .map((x) => ({
      label: x,
      value: x,
      quantity: data?.filter(
        (y) =>
          y.application_name === x &&
          (rolesFilter.length === 0 || rolesFilter.includes(y.role_name)) &&
          (!statesFilter ||
            statesFilter.length === 0 ||
            (y.state !== null && statesFilter.includes(y.state)))
      ).length,
    }))
    .filter((x) => !!x.value)

  const priorityRoles = ['anon', 'authenticated', 'postgres']

  const roleOptions = (roles ?? [])
    .map((x) => ({
      label: x.name,
      value: x.name,
      quantity: data?.filter(
        (y) =>
          y.role_name === x.name &&
          (!statesFilter ||
            statesFilter.length === 0 ||
            (y.state !== null && statesFilter.includes(y.state))) &&
          (applicationsFilter.length === 0 || applicationsFilter.includes(y.application_name))
      ).length,
    }))
    .sort((a, b) => {
      const aIndex = priorityRoles.indexOf(a.value)
      const bIndex = priorityRoles.indexOf(b.value)
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return 0
    })

  useEffect(() => {
    if (selectedPid && isSuccess) {
      document
        .getElementById(selectedPid.toString())
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedPid, isSuccess])

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex gap-x-4">
        <h2>Sessions</h2>
        <div className="flex gap-x-2">
          <ReportsSelectFilter
            label="State"
            options={stateOptions}
            value={statesFilter ?? []}
            onChange={(states) => setQueryStates({ states })}
            isLoading={isPending}
            popoverClassName="w-60"
          />
          <ReportsSelectFilter
            showSearch
            label="Roles"
            options={roleOptions}
            value={rolesFilter ?? []}
            onChange={(roles) => setQueryStates({ roles })}
            isLoading={isPending}
            popoverClassName="w-72"
          />
          <ReportsSelectFilter
            showSearch
            label="Application"
            options={applicationOptions}
            value={applicationsFilter ?? []}
            onChange={(applications) => setQueryStates({ applications })}
            isLoading={isPending}
            popoverClassName="w-60"
          />
          {!hasNoFiltersApplied && (
            <ButtonTooltip
              variant="text"
              className="px-1"
              icon={<X />}
              onClick={() =>
                setQueryStates({ states: [], roles: DEFAULT_ROLES_FILTER, applications: [] })
              }
              aria-label="Reset filters"
              tooltip={{ content: { side: 'bottom', text: 'Reset filters' } }}
            />
          )}
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">State</TableHead>
              <TableHead className="max-w-[300px]">Query · Session</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Blocked by</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isPending ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <ShimmeringLoader />
                  </TableCell>
                  <TableCell>
                    <ShimmeringLoader />
                  </TableCell>
                  <TableCell>
                    <ShimmeringLoader />
                  </TableCell>
                  <TableCell colSpan={2}>
                    <ShimmeringLoader />
                  </TableCell>
                </TableRow>
              ))
            ) : (activities ?? []).length === 0 ? (
              <TableRow>
                {hasNoFiltersApplied ? (
                  <TableCell colSpan={5}>
                    <p className="text-sm text-foreground">No active sessions</p>
                    <p className="text-sm text-foreground-lighter mt-1">
                      There are currently no active database connections for the anon,
                      authenticated, and postgres roles.
                    </p>
                  </TableCell>
                ) : (
                  <TableCell colSpan={5}>
                    <p className="text-sm text-foreground">No results found</p>
                    <p className="text-sm text-foreground-lighter mt-1">
                      There are no sessions that match the selected filters. Try adjusting or
                      clearing them.
                    </p>
                    <Button
                      variant="default"
                      className="mt-2"
                      onClick={() => {
                        setQueryStates({
                          states: [],
                          roles: DEFAULT_ROLES_FILTER,
                          applications: [],
                        })
                      }}
                    >
                      Reset filters
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ) : null}

            {activities?.map((activity) => (
              <ActivityRow key={activity.pid} activity={activity} />
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

const ActivityRow = ({ activity }: { activity: DatabaseActivity }) => {
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
              const blockedProcess = data?.find((x) => x.pid === pid)

              return (
                <Fragment key={pid}>
                  {index > 0 && ', '}
                  <Tooltip>
                    <TooltipTrigger
                      className={cn(InlineLinkClassName, 'cursor-pointer')}
                      onClick={() => setSelectedPid(pid)}
                    >
                      {pid}
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="min-w-64 max-w-80">
                      <p className="truncate">
                        <code className="tracking-tighter">{blockedProcess?.query}</code>
                      </p>
                      <p className="text-xs text-foreground-lighter flex items-center gap-x-0.5 mt-0.5 truncate">
                        <span>PID: {blockedProcess?.pid}</span>
                        <span>·</span>
                        <span>{blockedProcess?.role_name}</span>
                        {blockedProcess?.application_name && (
                          <>
                            <span>·</span>
                            <span>{blockedProcess?.application_name}</span>
                          </>
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
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
