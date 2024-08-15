import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowDown, ArrowUp, RefreshCw, User } from 'lucide-react'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { LogDetailsPanel } from 'components/interfaces/AuditLogs'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { DatePicker } from 'components/ui/DatePicker'
import { FilterPopover } from 'components/ui/FilterPopover'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import {
  AuditLog,
  useOrganizationAuditLogsQuery,
} from 'data/organizations/organization-audit-logs-query'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Alert,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'

// [Joshen considerations]
// - Maybe fix the height of the table to the remaining height of the viewport, so that the search input is always visible
// - We'll need pagination as well if the audit logs get too large, but that needs to be implemented on the API side first if possible
// - I've hidden time input in the date picker for now cause the time support in the component is a bit iffy, need to investigate
//   - Maybe a rule to follow from here is just everytime we call dayjs, use UTC(), one TZ to rule them all

const AuditLogs = () => {
  const { slug } = useParams()
  const currentTime = dayjs().utc().set('millisecond', 0)
  const [dateSortDesc, setDateSortDesc] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: currentTime.subtract(1, 'day').toISOString(),
    to: currentTime.toISOString(),
  })
  const [selectedLog, setSelectedLog] = useState<AuditLog>()
  const [filters, setFilters] = useState<{ users: string[]; projects: string[] }>({
    users: [], // gotrue_id[]
    projects: [], // project_ref[]
  })

  const canReadAuditLogs = useCheckPermissions(PermissionAction.READ, 'notifications')

  const { data: projects } = useProjectsQuery()
  const { data: organizations } = useOrganizationsQuery()
  const { data: members } = useOrganizationMembersQuery({ slug })
  const { data: rolesData } = useOrganizationRolesQuery({ slug })
  const { data, error, isLoading, isSuccess, isError, isRefetching, refetch } =
    useOrganizationAuditLogsQuery(
      {
        slug,
        iso_timestamp_start: dateRange.from,
        iso_timestamp_end: dateRange.to,
      },
      {
        enabled: canReadAuditLogs,
        retry(_failureCount, error) {
          if (error.message.endsWith('upgrade to Team or Enterprise Plan to access audit logs.')) {
            return false
          }
          return true
        },
        retryOnMount: false,
        refetchOnWindowFocus: false,
      }
    )

  // This feature depends on the subscription tier of the user. Free user can view logs up to 1 day
  // in the past. The API limits the logs to maximum of 1 day and 5 minutes so when the page is
  // viewed for more than 5 minutes, the call parameters needs to be updated. This also works with
  // higher tiers (7 days of logs).The user will see a loading shimmer.
  useEffect(() => {
    const duration = dayjs(dateRange.from).diff(dayjs(dateRange.to))
    const interval = setInterval(() => {
      const currentTime = dayjs().utc().set('millisecond', 0)
      setDateRange({
        from: currentTime.add(duration).toISOString(),
        to: currentTime.toISOString(),
      })
    }, 5 * 60000)

    return () => clearInterval(interval)
  }, [dateRange.from, dateRange.to])

  const roles = rolesData?.roles ?? []

  const retentionPeriod = data?.retention_period ?? 0
  const logs = data?.result ?? []
  const sortedLogs = logs
    ?.sort((a, b) =>
      dateSortDesc
        ? Number(new Date(b.occurred_at)) - Number(new Date(a.occurred_at))
        : Number(new Date(a.occurred_at)) - Number(new Date(b.occurred_at))
    )
    ?.filter((log) => {
      if (filters.users.length > 0) {
        return filters.users.includes(log.actor.id)
      } else {
        return log
      }
    })
    ?.filter((log) => {
      if (filters.projects.length > 0) {
        return filters.projects.includes(log.target.metadata.project_ref || '')
      } else {
        return log
      }
    })

  const currentOrganization = organizations?.find((o) => o.slug === slug)

  if (!canReadAuditLogs) {
    return (
      <ScaffoldContainerLegacy>
        <NoPermission resourceText="view organization audit logs" />
      </ScaffoldContainerLegacy>
    )
  }

  return (
    <>
      <ScaffoldContainerLegacy>
        <div className="space-y-4 flex flex-col">
          {isLoading && (
            <div className="space-y-2">
              <ShimmeringLoader />
              <ShimmeringLoader className="w-3/4" />
              <ShimmeringLoader className="w-1/2" />
            </div>
          )}

          {isError ? (
            error.message.endsWith('upgrade to Team or Enterprise Plan to access audit logs.') ? (
              <Alert_Shadcn_
                variant="default"
                title="Organization Audit Logs are not available on Free or Pro plans"
              >
                <WarningIcon />
                <div className="flex flex-row pt-1">
                  <div className="grow">
                    <AlertTitle_Shadcn_>
                      Organization Audit Logs are not available on Free or Pro plans
                    </AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_ className="flex flex-row justify-between gap-3">
                      <p>
                        Upgrade to Team or Enterprise to view up to 28 days of Audit Logs for your
                        organization.
                      </p>
                    </AlertDescription_Shadcn_>
                  </div>

                  <div className="flex items-center">
                    <Button type="primary" asChild>
                      <Link href={`/org/${slug}/billing?panel=subscriptionPlan`}>
                        Upgrade subscription
                      </Link>
                    </Button>
                  </div>
                </div>
              </Alert_Shadcn_>
            ) : (
              <AlertError error={error} subject="Failed to retrieve audit logs" />
            )
          ) : null}

          {isSuccess && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <p className="text-xs prose">Filter by</p>
                  <FilterPopover
                    name="Users"
                    options={members ?? []}
                    labelKey="username"
                    valueKey="gotrue_id"
                    activeOptions={filters.users}
                    onSaveFilters={(values) => setFilters({ ...filters, users: values })}
                  />
                  <FilterPopover
                    name="Projects"
                    options={
                      projects?.filter((p) => p.organization_id === currentOrganization?.id) ?? []
                    }
                    labelKey="name"
                    valueKey="ref"
                    activeOptions={filters.projects}
                    onSaveFilters={(values) => setFilters({ ...filters, projects: values })}
                  />
                  <DatePicker
                    hideTime
                    hideClear
                    triggerButtonType="dashed"
                    triggerButtonTitle=""
                    from={dateRange.from}
                    to={dateRange.to}
                    minDate={dayjs().subtract(retentionPeriod, 'days').toDate()}
                    maxDate={dayjs().toDate()}
                    onChange={(value) => {
                      if (value.from !== null && value.to !== null) {
                        const current = dayjs().utc()
                        const from = dayjs(value.from)
                          .utc()
                          .hour(current.hour())
                          .minute(current.minute())
                          .second(current.second())
                          .toISOString()
                        const to = dayjs(value.to)
                          .utc()
                          .hour(current.hour())
                          .minute(current.minute())
                          .second(current.second())
                          .toISOString()
                        setDateRange({ from, to })
                      }
                    }}
                    renderFooter={() => {
                      return (
                        <Alert title="" variant="info" className="mx-3 pl-2 pr-2 pt-1 pb-2">
                          Your organization has a log retention period of{' '}
                          <span className="text-brand">
                            {retentionPeriod} day
                            {retentionPeriod > 1 ? 's' : ''}
                          </span>
                          . You may only view logs from{' '}
                          {dayjs().subtract(retentionPeriod, 'days').format('DD MMM YYYY')} as the
                          earliest date.
                        </Alert>
                      )
                    }}
                  />
                  {isSuccess && (
                    <>
                      <div className="h-[20px] border-r border-strong !ml-4 !mr-2" />
                      <p className="prose text-xs">Viewing {sortedLogs.length} logs in total</p>
                    </>
                  )}
                </div>
                <Button
                  type="default"
                  disabled={isLoading || isRefetching}
                  icon={<RefreshCw className={isRefetching ? 'animate-spin' : ''} />}
                  onClick={() => refetch()}
                >
                  {isRefetching ? 'Refreshing' : 'Refresh'}
                </Button>
              </div>
              {logs.length === 0 ? (
                <div className="bg-surface-100 border rounded p-4 flex items-center justify-between">
                  <p className="prose text-sm">
                    Your organization does not have any audit logs available yet
                  </p>
                </div>
              ) : logs.length > 0 && sortedLogs.length === 0 ? (
                <div className="bg-surface-100 border rounded p-4 flex items-center justify-between">
                  <p className="prose text-sm">No audit logs found based on the filters applied</p>
                </div>
              ) : (
                <Table
                  head={[
                    <Table.th key="user" className="py-2">
                      User
                    </Table.th>,
                    <Table.th key="action" className="py-2">
                      Action
                    </Table.th>,
                    <Table.th key="target" className="py-2">
                      Target
                    </Table.th>,
                    <Table.th key="date" className="py-2">
                      <div className="flex items-center space-x-2">
                        <p>Date</p>

                        <Tooltip.Root delayDuration={0}>
                          <Tooltip.Trigger asChild>
                            <Button
                              type="text"
                              className="px-1"
                              icon={
                                dateSortDesc ? (
                                  <ArrowDown strokeWidth={1.5} size={14} />
                                ) : (
                                  <ArrowUp strokeWidth={1.5} size={14} />
                                )
                              }
                              onClick={() => setDateSortDesc(!dateSortDesc)}
                            />
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content side="right">
                              <Tooltip.Arrow className="radix-tooltip-arrow" />
                              <div
                                className={[
                                  'rounded bg-alternative py-1 px-2 leading-none shadow',
                                  'border border-background',
                                ].join(' ')}
                              >
                                <span className="text-xs text-foreground">
                                  {dateSortDesc ? 'Sort latest first' : 'Sort earliest first'}
                                </span>
                              </div>
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </div>
                    </Table.th>,
                    <Table.th key="actions" className="py-2"></Table.th>,
                  ]}
                  body={
                    sortedLogs?.map((log) => {
                      const user = (members ?? []).find(
                        (member) => member.gotrue_id === log.actor.id
                      )
                      const role = roles.find((role) => user?.role_ids?.[0] === role.id)
                      const project = projects?.find(
                        (project) => project.ref === log.target.metadata.project_ref
                      )
                      const organization = organizations?.find(
                        (org) => org.slug === log.target.metadata.org_slug
                      )

                      const hasStatusCode = log.action.metadata[0]?.status !== undefined
                      const userIcon =
                        user === undefined ? (
                          <div className="flex h-[30px] w-[30px] items-center justify-center border-2 rounded-full border-strong">
                            <p>?</p>
                          </div>
                        ) : user?.invited_id || user?.username === user?.primary_email ? (
                          <div className="flex h-[30px] w-[30px] items-center justify-center border-2 rounded-full border-strong">
                            <User size={18} strokeWidth={2} />
                          </div>
                        ) : (
                          <Image
                            alt={user?.username}
                            src={`https://github.com/${user?.username ?? ''}.png?size=80`}
                            width="30"
                            height="30"
                            className="border rounded-full"
                          />
                        )

                      return (
                        <Table.tr
                          key={log.occurred_at}
                          onClick={() => setSelectedLog(log)}
                          className="cursor-pointer hover:!bg-alternative transition duration-100"
                        >
                          <Table.td>
                            <div className="flex items-center space-x-4">
                              <div>{userIcon}</div>
                              <div>
                                <p className="text-foreground-light">{user?.username ?? '-'}</p>
                                {role && (
                                  <p className="mt-0.5 text-xs text-foreground-light">
                                    {role?.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Table.td>
                          <Table.td className="max-w-[250px]">
                            <div className="flex items-center space-x-2">
                              {hasStatusCode && (
                                <p className="bg-surface-200 rounded px-1 flex items-center justify-center text-xs font-mono border">
                                  {log.action.metadata[0].status}
                                </p>
                              )}
                              <p className="truncate" title={log.action.name}>
                                {log.action.name}
                              </p>
                            </div>
                          </Table.td>
                          <Table.td>
                            <p
                              className="text-foreground-light max-w-[230px] truncate"
                              title={project?.name ?? organization?.name ?? '-'}
                            >
                              {project?.name
                                ? 'Project: '
                                : organization?.name
                                  ? 'Organization: '
                                  : null}
                              {project?.name ?? organization?.name ?? 'Unknown'}
                            </p>
                            <p
                              className="text-foreground-light text-xs mt-0.5 truncate"
                              title={
                                log.target.metadata.project_ref ?? log.target.metadata.org_slug
                              }
                            >
                              {log.target.metadata.project_ref
                                ? 'Ref: '
                                : log.target.metadata.org_slug
                                  ? 'Slug: '
                                  : null}
                              {log.target.metadata.project_ref ?? log.target.metadata.org_slug}
                            </p>
                          </Table.td>
                          <Table.td>
                            {dayjs(log.occurred_at).format('DD MMM YYYY, HH:mm:ss')}
                          </Table.td>
                          <Table.td align="right">
                            <Button type="default">View details</Button>
                          </Table.td>
                        </Table.tr>
                      )
                    }) ?? []
                  }
                />
              )}
            </>
          )}
        </div>
      </ScaffoldContainerLegacy>

      <LogDetailsPanel selectedLog={selectedLog} onClose={() => setSelectedLog(undefined)} />
    </>
  )
}

export default AuditLogs
