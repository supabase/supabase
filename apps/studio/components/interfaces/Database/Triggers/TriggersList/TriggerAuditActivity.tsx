import { useParams } from 'common'
import { useMemo } from 'react'

import { RecentAuditActivity, type AuditEntry } from '@/components/ui/RecentAuditActivity'
import { useProjectDdlLogs } from '@/hooks/analytics/useProjectDdlLogs'
import { useProjectAuditLogs } from '@/hooks/misc/useProjectAuditLogs'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const TRIGGER_DDL_COMMANDS = ['CREATE TRIGGER', 'ALTER TRIGGER', 'DROP TRIGGER']

export function TriggerAuditActivity() {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const {
    logs: apiLogs,
    isLoading: isLoadingApi,
    hasAccess,
    refetch: refetchApi,
  } = useProjectAuditLogs({
    projectRef,
    actionFilter: ['trigger'],
    lookbackDays: 7,
    limit: 10,
  })

  const {
    logs: ddlLogs,
    isLoading: isLoadingDdl,
    refetch: refetchDdl,
  } = useProjectDdlLogs({
    projectRef,
    commandTags: TRIGGER_DDL_COMMANDS,
    lookbackDays: 7,
    limit: 10,
  })

  const entries = useMemo<AuditEntry[]>(() => {
    const api: AuditEntry[] = apiLogs.map((log) => ({ source: 'api', log }))
    const ddl: AuditEntry[] = ddlLogs.map((log) => ({ source: 'ddl', log }))
    return [...api, ...ddl].sort((a, b) => b.log.timestamp - a.log.timestamp).slice(0, 10)
  }, [apiLogs, ddlLogs])

  const isLoading = isLoadingApi || isLoadingDdl
  const viewAllHref = organization?.slug ? `/org/${organization.slug}/audit` : undefined

  return (
    <RecentAuditActivity
      entries={entries}
      isLoading={isLoading}
      hasAccess={hasAccess}
      viewAllHref={viewAllHref}
      title="Recent Changes"
      description="Recent trigger DDL changes in the last 7 days"
      onRefresh={() => {
        refetchApi()
        refetchDdl()
      }}
    />
  )
}
