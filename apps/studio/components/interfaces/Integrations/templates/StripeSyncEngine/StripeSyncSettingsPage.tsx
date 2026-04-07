import { useParams } from 'common'
import { formatRelative } from 'date-fns'
import { BadgeCheck, RefreshCwIcon } from 'lucide-react'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle } from 'ui'
import { Admonition, ShimmeringLoader, TimestampInfo } from 'ui-patterns'
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
  const { ref } = useParams()

  const {
    schemaComment: { status: installationStatus },
    syncState,
  } = useStripeSyncStatus()
  const installed = isInstalled(installationStatus)
  const isSyncing = isSyncRunning(syncState)
  const uninstalling = isUninstalling(installationStatus)

  if (!installed || uninstalling) {
    return (
      <PageContainer className="mx-0">
        <PageSection>
          <Admonition type="default" title="Stripe Sync Engine is not installed" />
        </PageSection>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="mx-0">
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Manage Stripe data</PageSectionTitle>
            <PageSectionDescription>
              Access and manage the synced Stripe data in your database.
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle className="text-foreground-lighter">
                {!syncState ? (
                  <ShimmeringLoader className="py-2" />
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    {isSyncing ? (
                      <>
                        <div className="flex items-center gap-x-3 text-foreground-light">
                          <RefreshCwIcon size={14} className="animate-spin" />
                          <p>Sync in progress</p>
                        </div>
                        {syncState.started_at && (
                          <p className="text-foreground-light">
                            Started{' '}
                            <TimestampInfo
                              utcTimestamp={syncState.started_at}
                              label={
                                syncState.started_at
                                  ? formatRelative(new Date(syncState.started_at), new Date())
                                  : 'recently'
                              }
                            />
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-x-3 text-foreground-light">
                          <BadgeCheck size={14} />
                          <p>All up to date</p>
                        </div>
                        {syncState.closed_at && (
                          <p className="text-foreground-light">
                            Last synced{' '}
                            <TimestampInfo
                              utcTimestamp={syncState.closed_at}
                              label={
                                syncState.closed_at
                                  ? formatRelative(new Date(syncState.closed_at), new Date())
                                  : 'recently'
                              }
                            />
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="@container">
              <div className="flex flex-col items-start justify-between gap-4 @md:flex-row @md:items-center">
                <div className="flex flex-col gap-1">
                  <h5 className="text-sm">View Stripe data in Table Editor</h5>
                  <p className="text-sm text-foreground-light text-balance">
                    The Stripe Sync Engine stores all synced data in the{' '}
                    <code className="text-code-inline !break-keep">stripe</code> schema. You can
                    view and query this data directly in the Table Editor.
                  </p>
                </div>

                <Button asChild type="default" className="ml-8 @md:ml-0">
                  <Link href={`/project/${ref}/editor?schema=stripe`}>Open Table Editor</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
