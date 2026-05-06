import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useMemo } from 'react'

import {
  filterByProjects,
  sortAuditLogs,
} from '@/components/interfaces/Organization/AuditLogs/AuditLogs.utils'
import { useOrganizationAuditLogsQuery } from '@/data/organizations/organization-audit-logs-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

dayjs.extend(utc)

interface UseProjectAuditLogsOptions {
  projectRef?: string
  actionFilter?: string[]
  lookbackDays?: number
  limit?: number
  enabled?: boolean
}

export function useProjectAuditLogs({
  projectRef,
  actionFilter,
  lookbackDays = 7,
  limit = 10,
  enabled = true,
}: UseProjectAuditLogsOptions = {}) {
  const { data: organization } = useSelectedOrganizationQuery()
  const slug = organization?.slug

  const { can: canReadAuditLogs, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'notifications'
  )

  const { hasAccess: hasAccessToAuditLogs, isLoading: isLoadingEntitlements } =
    useCheckEntitlements('security.audit_logs_days')

  const hasAccess = canReadAuditLogs && hasAccessToAuditLogs

  const { from, to } = useMemo(() => {
    const now = dayjs().utc().set('millisecond', 0)
    return {
      from: now.subtract(lookbackDays, 'day').toISOString(),
      to: now.toISOString(),
    }
  }, [lookbackDays])

  const {
    data,
    isLoading: isLoadingLogs,
    isError,
    refetch,
  } = useOrganizationAuditLogsQuery(
    {
      slug,
      iso_timestamp_start: from,
      iso_timestamp_end: to,
    },
    {
      enabled: enabled && hasAccess && !isLoadingPermissions && !isLoadingEntitlements,
      retry: false,
      refetchOnWindowFocus: false,
    }
  )

  const logs = useMemo(() => {
    const allLogs = data?.result ?? []

    const projectFiltered = projectRef ? filterByProjects(allLogs, [projectRef]) : allLogs

    const actionFiltered =
      actionFilter && actionFilter.length > 0
        ? projectFiltered.filter((log) =>
            actionFilter.some((keyword) =>
              log.action.name.toLowerCase().includes(keyword.toLowerCase())
            )
          )
        : projectFiltered

    return sortAuditLogs(actionFiltered, true).slice(0, limit)
  }, [data?.result, projectRef, actionFilter, limit])

  const isLoading = isLoadingPermissions || isLoadingEntitlements || (hasAccess && isLoadingLogs)

  return { logs, isLoading, hasAccess, isError, refetch }
}
