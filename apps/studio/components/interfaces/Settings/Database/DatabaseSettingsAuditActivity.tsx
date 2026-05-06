import { useParams } from 'common'
import { useMemo } from 'react'

import { RecentAuditActivity, type AuditEntry } from '@/components/ui/RecentAuditActivity'
import { useProjectAuditLogs } from '@/hooks/misc/useProjectAuditLogs'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const SETTINGS_ACTION_FILTER = [
  'database',
  'password',
  'pooler',
  'network',
  'ssl',
  'setting',
  'disk',
]

export function DatabaseSettingsAuditActivity() {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const { logs, isLoading, hasAccess, refetch } = useProjectAuditLogs({
    projectRef,
    actionFilter: SETTINGS_ACTION_FILTER,
    lookbackDays: 7,
    limit: 10,
  })

  const entries = useMemo<AuditEntry[]>(() => logs.map((log) => ({ source: 'api', log })), [logs])

  const viewAllHref = organization?.slug ? `/org/${organization.slug}/audit` : undefined

  return (
    <RecentAuditActivity
      entries={entries}
      isLoading={isLoading}
      hasAccess={hasAccess}
      viewAllHref={viewAllHref}
      title="Recent Changes"
      description="Recent database configuration changes in the last 7 days"
      onRefresh={refetch}
    />
  )
}
