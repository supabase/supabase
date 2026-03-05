import { formatRelative } from 'date-fns'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { BadgeCheck, RefreshCwIcon, Table2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, Card, CardContent } from 'ui'
import { Admonition } from 'ui-patterns'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { isInstalled, isSyncRunning, isUninstalling } from './stripe-sync-status'
import { useStripeSyncStatus } from '@/components/interfaces/Integrations/templates/StripeSyncEngine/useStripeSyncStatus'

export const StripeSyncSettingsPage = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()

  const {
    parsedSchema: { status: installationStatus },
    syncState,
    isLoading: isLoadingInstallationStatus,
  } = useStripeSyncStatus({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const installed = isInstalled(installationStatus)
  const isSyncing = isSyncRunning(syncState)
  const uninstalling = isUninstalling(installationStatus)
  const tableEditorUrl = `/project/${project?.ref}/editor?schema=stripe`

  return (
    <PageContainer className="mx-0">
      {syncState && installed && !uninstalling && (
        <PageSection id="sync-status">
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Sync Status</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <Admonition type="default" showIcon={false}>
              <div className="flex items-center justify-between gap-2">
                {isSyncing ? (
                  <>
                    <div className="flex items-center gap-2">
                      <RefreshCwIcon size={14} className="animate-spin" />
                      <div>Sync in progress...</div>
                    </div>
                    <div className="text-foreground-light text-sm">
                      Started{' '}
                      {syncState.started_at
                        ? formatRelative(new Date(syncState.started_at), new Date())
                        : 'recently'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <BadgeCheck size={14} className="text-brand" />
                      <div>All up to date</div>
                      <Button asChild type="text">
                        <Link href={tableEditorUrl}>View data</Link>
                      </Button>
                    </div>
                    <div className="text-foreground-light text-sm">
                      Last synced{' '}
                      {syncState.closed_at
                        ? formatRelative(new Date(syncState.closed_at), new Date())
                        : 'recently'}
                    </div>
                  </>
                )}
              </div>
            </Admonition>
          </PageSectionContent>
        </PageSection>
      )}
      <PageSection id="stripe-schema">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Stripe Schema</PageSectionTitle>
            <PageSectionDescription>
              Access and manage the synced Stripe data in your database.
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Card>
            <CardContent className="@container">
              <div className="flex flex-col items-start justify-between gap-4 @md:flex-row @md:items-center">
                <div className="flex gap-x-4">
                  <Table2 className="w-5 h-5 shrink-0" />
                  <div className="flex flex-col gap-1">
                    <h5 className="text-sm mb-1">Open Stripe schema in Table Editor</h5>
                    <p className="text-sm text-foreground-light text-balance">
                      The Stripe Sync Engine stores all synced data in the{' '}
                      <code className="text-code-inline !break-keep">stripe</code> schema. You can
                      view and query this data directly in the Table Editor.
                    </p>
                  </div>
                </div>
                <Button asChild type="default" className="ml-8 @md:ml-0">
                  <Link href={`/project/${project?.ref}/editor?schema=stripe`}>
                    Open Table Editor
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
