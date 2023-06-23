import dayjs from 'dayjs'
import Image from 'next/image'
import { useState } from 'react'

import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import {
  OrganizationAuditLog,
  useOrganizationAuditLogsQuery,
} from 'data/organizations/organization-audit-logs-query'
import { useOrganizationDetailQuery } from 'data/organizations/organization-detail-query'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { Button, IconSearch, IconUser, Input } from 'ui'
import LogDetailsPanel from './LogDetailsPanel'
import AlertError from 'components/ui/AlertError'

// [Joshen considerations]
// - Maybe fix the height of the table to the remaining height of the viewport, so that the search input is always visible

const AuditLogs = () => {
  const { slug } = useParams()
  const currentTime = dayjs()
  const [selectedLog, setSelectedLog] = useState<OrganizationAuditLog>()

  const { data: projects } = useProjectsQuery()
  const { data: organizations } = useOrganizationsQuery()
  const { data: detailData } = useOrganizationDetailQuery({ slug })
  const { data: rolesData } = useOrganizationRolesQuery({ slug })
  const {
    data: logs,
    isLoading,
    isSuccess,
    isError,
  } = useOrganizationAuditLogsQuery({
    slug,
    iso_timestamp_start: currentTime.subtract(1, 'day').toISOString(),
    iso_timestamp_end: currentTime.toISOString(),
  })

  const members = detailData?.members ?? []
  const roles = rolesData?.roles ?? []
  const sortedLogs = logs?.sort(
    (a, b) => Number(new Date(b.timestamp)) - Number(new Date(a.timestamp))
  )

  return (
    <>
      <div className="space-y-4 flex flex-col">
        {isLoading && (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        )}

        {isError && <AlertError subject="Unable to retrieve audit logs" />}

        {isSuccess && (
          <>
            {logs.length === 0 ? (
              <div className="bg-scale-100 dark:bg-scale-300 border rounded p-4 flex items-center justify-between">
                <p className="prose text-sm">
                  Your organization does not have any audit logs available yet
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center">
                  <Input
                    size="tiny"
                    className="w-80"
                    icon={<IconSearch size={14} strokeWidth={1.5} />}
                    placeholder="Search audit logs"
                  />
                </div>
                <Table
                  head={[
                    <Table.th key="user">User</Table.th>,
                    <Table.th key="action">Action</Table.th>,
                    <Table.th key="target">Target</Table.th>,
                    <Table.th key="date">Date</Table.th>,
                    <Table.th key="actions"></Table.th>,
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
                            <p className="text-scale-1100">
                              {project?.name ?? organization?.name ?? 'Entity no longer exists'}
                            </p>
                            <p className="text-scale-1000 text-xs mt-0.5">
                              {log.permission_group.org_slug ?? log.permission_group.project_ref}
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
              </>
            )}
          </>
        )}
      </div>

      <LogDetailsPanel selectedLog={selectedLog} onClose={() => setSelectedLog(undefined)} />
    </>
  )
}

export default AuditLogs
