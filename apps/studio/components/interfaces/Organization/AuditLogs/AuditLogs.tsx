import { PermissionAction } from '@supabase/shared-types/out/constants'
import { keepPreviousData } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowDown, ArrowUp, RefreshCw, User } from 'lucide-react'
import Image from 'next/legacy/image'
import { useEffect, useMemo, useState } from 'react'

import { LogDetailsPanel } from 'components/interfaces/AuditLogs/LogDetailsPanel'
import { LogsDatePicker } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FilterPopover } from 'components/ui/FilterPopover'
import NoPermission from 'components/ui/NoPermission'
import { UpgradeToPro } from 'components/ui/UpgradeToPro'
import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
import {
  AuditLog,
  useOrganizationAuditLogsQuery,
} from 'data/organizations/organization-audit-logs-query'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

const logsUpgradeError = 'upgrade to Team or Enterprise Plan to access audit logs.'

// [Joshen considerations]
// - Maybe fix the height of the table to the remaining height of the viewport, so that the search input is always visible
// - We'll need pagination as well if the audit logs get too large, but that needs to be implemented on the API side first if possible
// - I've hidden time input in the date picker for now cause the time support in the component is a bit iffy, need to investigate
//   - Maybe a rule to follow from here is just everytime we call dayjs, use UTC(), one TZ to rule them all

export const AuditLogs = () => {
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

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const { can: canReadAuditLogs, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'notifications'
  )

  const { hasAccess: hasAccessToAuditLogs, isLoading: isLoadingEntitlements } =
    useCheckEntitlements('security.audit_logs_days')

  const {
    data,
    error,
    isPending: isLoading,
    isSuccess,
    isError,
    isRefetching,
    fetchStatus,
    refetch,
  } = useOrganizationAuditLogsQuery(
    {
      slug,
      iso_timestamp_start: dateRange.from,
      iso_timestamp_end: dateRange.to,
    },
    {
      enabled: canReadAuditLogs,
      retry: false,
      refetchOnWindowFocus: (query) => {
        return !query.state.error?.message.endsWith(logsUpgradeError)
      },
    }
  )

  const isLogsNotAvailableBasedOnPlan = isError && !hasAccessToAuditLogs
  const isRangeExceededError = isError && error.message.includes('range exceeded')
  const showFilters = !isLoading && !isLogsNotAvailableBasedOnPlan

  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useOrgProjectsInfiniteQuery(
    { slug, search: search.length === 0 ? search : debouncedSearch },
    { placeholderData: keepPreviousData, enabled: showFilters }
  )
  const { data: organizations } = useOrganizationsQuery({
    enabled: showFilters,
  })
  const { data: members } = useOrganizationMembersQuery({ slug }, { enabled: showFilters })
  const { data: rolesData } = useOrganizationRolesV2Query({ slug }, { enabled: showFilters })

  const activeMembers = (members ?? []).filter((x) => !x.invited_at)
  const roles = [...(rolesData?.org_scoped_roles ?? []), ...(rolesData?.project_scoped_roles ?? [])]
  const projects =
    useMemo(() => projectsData?.pages.flatMap((page) => page.projects), [projectsData?.pages]) || []

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

  const shouldShowLoadingState =
    (isLoading && fetchStatus !== 'idle') || isLoadingPermissions || isLoadingEntitlements

  // This feature depends on the subscription tier of the user.
  // The API limits the logs to maximum of 62 days and 5 minutes so when the page is
  // viewed for more than 5 minutes, the call parameters needs to be updated. This also works with
  // higher tiers.The user will see a loading shimmer.
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

  if (isLogsNotAvailableBasedOnPlan) {
    return (
      <ScaffoldContainer className="px-6 xl:px-10">
        <ScaffoldSection isFullWidth>
          <UpgradeToPro
            plan="Team"
            source="organizationAuditLogs"
            primaryText="Organization Audit Logs are not available on Free or Pro plans"
            secondaryText="Upgrade to Team or Enterprise to view up to 62 days of Audit Logs for your organization."
            featureProposition="enable audit logs"
          />
        </ScaffoldSection>
      </ScaffoldContainer>
    )
  }

  return (
    <>
      <ScaffoldContainer className="px-6 xl:px-10">
        <ScaffoldSection isFullWidth>
          <div className="space-y-4 flex flex-col">
            {showFilters && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <p className="text-xs prose">Filter by</p>
                  <FilterPopover
                    name="Users"
                    options={activeMembers}
                    labelKey="username"
                    valueKey="gotrue_id"
                    activeOptions={filters.users}
                    onSaveFilters={(values) => setFilters({ ...filters, users: values })}
                  />
                  <FilterPopover
                    name="Projects"
                    options={projects}
                    labelKey="name"
                    valueKey="ref"
                    activeOptions={filters.projects}
                    onSaveFilters={(values) => setFilters({ ...filters, projects: values })}
                    search={search}
                    setSearch={setSearch}
                    hasNextPage={hasNextPage}
                    isLoading={isLoadingProjects}
                    isFetching={isFetching}
                    isFetchingNextPage={isFetchingNextPage}
                    fetchNextPage={fetchNextPage}
                  />
                  <LogsDatePicker
                    hideWarnings
                    value={dateRange}
                    onSubmit={(value) => setDateRange(value)}
                    helpers={[
                      {
                        text: 'Last 1 hour',
                        calcFrom: () => dayjs().subtract(1, 'hour').toISOString(),
                        calcTo: () => dayjs().toISOString(),
                      },
                      {
                        text: 'Last 3 hours',
                        calcFrom: () => dayjs().subtract(3, 'hour').toISOString(),
                        calcTo: () => dayjs().toISOString(),
                      },

                      {
                        text: 'Last 6 hours',
                        calcFrom: () => dayjs().subtract(6, 'hour').toISOString(),
                        calcTo: () => dayjs().toISOString(),
                      },
                      {
                        text: 'Last 12 hours',
                        calcFrom: () => dayjs().subtract(12, 'hour').toISOString(),
                        calcTo: () => dayjs().toISOString(),
                      },
                      {
                        text: 'Last 24 hours',
                        calcFrom: () => dayjs().subtract(1, 'day').toISOString(),
                        calcTo: () => dayjs().toISOString(),
                      },
                    ]}
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
            )}

            {shouldShowLoadingState ? (
              <div className="space-y-2">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
              </div>
            ) : !canReadAuditLogs ? (
              <NoPermission resourceText="view organization audit logs" />
            ) : null}

            {isError &&
              (isRangeExceededError ? (
                <Alert_Shadcn_ variant="destructive" title="Date range too large">
                  <WarningIcon />
                  <AlertTitle_Shadcn_>Date range too large</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    The selected date range exceeds the maximum allowed period. Please select a
                    smaller time range.
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              ) : (
                <AlertError error={error} subject="Failed to retrieve audit logs" />
              ))}

            {isSuccess && (
              <>
                {logs.length === 0 ? (
                  <div className="bg-surface-100 border rounded p-4 flex items-center justify-between">
                    <p className="prose text-sm">
                      Your organization does not have any audit logs available yet
                    </p>
                  </div>
                ) : logs.length > 0 && sortedLogs.length === 0 ? (
                  <div className="bg-surface-100 border rounded p-4 flex items-center justify-between">
                    <p className="prose text-sm">
                      No audit logs found based on the filters applied
                    </p>
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

                          <ButtonTooltip
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
                            tooltip={{
                              content: {
                                side: 'bottom',
                                text: dateSortDesc ? 'Sort latest first' : 'Sort earliest first',
                              },
                            }}
                          />
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
                        const logProjectRef =
                          log.target.metadata.project_ref ?? log.target.metadata.ref
                        const logOrgSlug = log.target.metadata.org_slug ?? log.target.metadata.slug

                        const project = projects?.find((project) => project.ref === logProjectRef)
                        const organization = organizations?.find((org) => logOrgSlug)

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
                                title={logProjectRef ?? logOrgSlug ?? ''}
                              >
                                {logProjectRef ? 'Ref: ' : logOrgSlug ? 'Slug: ' : null}
                                {logProjectRef ?? logOrgSlug}
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
        </ScaffoldSection>
      </ScaffoldContainer>

      <LogDetailsPanel selectedLog={selectedLog} onClose={() => setSelectedLog(undefined)} />
    </>
  )
}
