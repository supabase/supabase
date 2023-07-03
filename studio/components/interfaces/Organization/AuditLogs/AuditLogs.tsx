import * as Tooltip from '@radix-ui/react-tooltip'
import dayjs from 'dayjs'
import Image from 'next/image'
import { useState } from 'react'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { DatePicker } from 'components/ui/DatePicker'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import {
  OrganizationAuditLog,
  useOrganizationAuditLogsQuery,
} from 'data/organizations/organization-audit-logs-query'
import { useOrganizationDetailQuery } from 'data/organizations/organization-detail-query'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { Alert, Button, IconArrowDown, IconArrowUp, IconUser } from 'ui'
import FilterPopover from './FilterPopover'
import LogDetailsPanel from './LogDetailsPanel'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'

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
  const [selectedLog, setSelectedLog] = useState<OrganizationAuditLog>()
  const [filters, setFilters] = useState<{ users: string[]; projects: string[] }>({
    users: [], // gotrue_id[]
    projects: [], // project_ref[]
  })

  const { data: projects } = useProjectsQuery()
  const { data: organizations } = useOrganizationsQuery()
  const { data: detailData } = useOrganizationDetailQuery({ slug })
  const { data: rolesData } = useOrganizationRolesQuery({ slug })
  const { data, isLoading, isSuccess, isError } = useOrganizationAuditLogsQuery({
    slug,
    iso_timestamp_start: dateRange.from,
    iso_timestamp_end: dateRange.to,
  })

  const members = detailData?.members ?? []
  const roles = rolesData?.roles ?? []

  const retentionPeriod = data?.retention_period ?? 0
  const logs = data?.result ?? []
  const sortedLogs = logs
    ?.sort((a, b) =>
      dateSortDesc
        ? Number(new Date(b.timestamp)) - Number(new Date(a.timestamp))
        : Number(new Date(a.timestamp)) - Number(new Date(b.timestamp))
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
        return filters.projects.includes(log.permission_group.project_ref || '')
      } else {
        return log
      }
    })

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

          {isError && <AlertError subject="Failed to retrieve audit logs" />}

          {isSuccess && (
            <>
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
                  options={projects ?? []}
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
                        <span className="text-brand-900">
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
                <div className="h-[20px] border-r border-scale-700 !ml-4 !mr-2" />
                <p className="prose text-xs">Viewing {sortedLogs.length} logs in total</p>
              </div>

              {logs.length === 0 ? (
                <div className="bg-scale-100 dark:bg-scale-300 border rounded p-4 flex items-center justify-between">
                  <p className="prose text-sm">
                    Your organization does not have any audit logs available yet
                  </p>
                </div>
              ) : logs.length > 0 && sortedLogs.length === 0 ? (
                <div className="bg-scale-100 dark:bg-scale-300 border rounded p-4 flex items-center justify-between">
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
                          <Tooltip.Trigger>
                            <Button
                              type="text"
                              className="px-1"
                              icon={
                                dateSortDesc ? (
                                  <IconArrowDown strokeWidth={1.5} size={14} />
                                ) : (
                                  <IconArrowUp strokeWidth={1.5} size={14} />
                                )
                              }
                              onClick={() => setDateSortDesc(!dateSortDesc)}
                            />
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Portal>
                              <Tooltip.Content side="right">
                                <Tooltip.Arrow className="radix-tooltip-arrow" />
                                <div
                                  className={[
                                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                    'border border-scale-200',
                                  ].join(' ')}
                                >
                                  <span className="text-xs text-scale-1200">
                                    {dateSortDesc ? 'Sort latest first' : 'Sort earliest first'}
                                  </span>
                                </div>
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </div>
                    </Table.th>,
                    <Table.th key="actions" className="py-2"></Table.th>,
                  ]}
                  body={
                    sortedLogs?.map((log) => {
                      const user = members.find((member) => member.gotrue_id === log.actor.id)
                      const role = roles.find((role) => user?.role_ids?.[0] === role.id)
                      const project = projects?.find(
                        (project) => project.ref === log.permission_group.project_ref
                      )
                      const organization = organizations?.find(
                        (org) => org.slug === log.permission_group.org_slug
                      )

                      const hasStatusCode = log.action.metadata[0]?.status !== undefined
                      const userIcon =
                        user === undefined ? (
                          <div className="flex h-[40px] w-[40px] flex items-center justify-center border-2 rounded-full border-scale-700">
                            <p>?</p>
                          </div>
                        ) : user?.invited_id || user?.username === user?.primary_email ? (
                          <div className="flex h-[40px] w-[40px] flex items-center justify-center border-2 rounded-full border-scale-700">
                            <IconUser size={18} strokeWidth={2} />
                          </div>
                        ) : (
                          <Image
                            alt={user?.username}
                            src={`https://github.com/${user?.username ?? ''}.png?size=80`}
                            width="40"
                            height="40"
                            className="border rounded-full"
                          />
                        )

                      return (
                        <Table.tr
                          key={log.timestamp}
                          onClick={() => setSelectedLog(log)}
                          className="cursor-pointer hover:!bg-scale-100 transition duration-100"
                        >
                          <Table.td>
                            <div className="flex items-center space-x-4">
                              {userIcon}
                              <div>
                                <p className="text-scale-1100">{user?.username ?? log.actor.id}</p>
                                {role && (
                                  <p className="mt-0.5 text-xs text-scale-1000">{role?.name}</p>
                                )}
                              </div>
                            </div>
                          </Table.td>
                          <Table.td>
                            <div className="flex items-center space-x-2">
                              {hasStatusCode && (
                                <p className="bg-scale-400 rounded px-1 flex items-center justify-center text-xs font-mono border">
                                  {log.action.metadata[0].status}
                                </p>
                              )}
                              <p className="max-w-[200px] truncate">{log.action.name}</p>
                            </div>
                          </Table.td>
                          <Table.td>
                            <p className="text-scale-1100 truncate">
                              {project?.name
                                ? 'Project: '
                                : organization?.name
                                ? 'Organization: '
                                : null}
                              {project?.name ?? organization?.name ?? 'Entity no longer exists'}
                            </p>
                            <p className="text-scale-1000 text-xs mt-0.5 truncate">
                              {log.permission_group.project_ref
                                ? 'Ref: '
                                : log.permission_group.org_slug
                                ? 'Slug: '
                                : null}
                              {log.permission_group.project_ref ?? log.permission_group.org_slug}
                            </p>
                          </Table.td>
                          <Table.td>
                            {dayjs(log.timestamp).format('DD MMM YYYY, HH:mm:ss')}
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
