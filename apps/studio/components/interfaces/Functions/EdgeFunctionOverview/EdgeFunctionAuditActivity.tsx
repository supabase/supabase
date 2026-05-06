import { useParams } from 'common'
import { useMemo } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { RecentAuditActivity, type AuditEntry } from '@/components/ui/RecentAuditActivity'
import { useProjectAuditLogs } from '@/hooks/misc/useProjectAuditLogs'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export function EdgeFunctionAuditActivity() {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const { logs, isLoading, hasAccess, refetch } = useProjectAuditLogs({
    projectRef,
    actionFilter: ['function'],
    lookbackDays: 7,
    limit: 10,
  })

  const entries = useMemo<AuditEntry[]>(() => logs.map((log) => ({ source: 'api', log })), [logs])

  const viewAllHref = organization?.slug ? `/org/${organization.slug}/audit` : undefined

  return (
    <PageContainer>
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Audit Activity</PageSectionTitle>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <RecentAuditActivity
            entries={entries}
            isLoading={isLoading}
            hasAccess={hasAccess}
            viewAllHref={viewAllHref}
            title="Recent Changes"
            description="Recent edge function configuration changes in the last 7 days"
            onRefresh={refetch}
          />
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
