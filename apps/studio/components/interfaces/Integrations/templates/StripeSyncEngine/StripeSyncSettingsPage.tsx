import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Table2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Button, Card, CardContent } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { isInstalled } from './stripe-sync-status'
import { useStripeSyncStatus } from '@/components/interfaces/Integrations/templates/StripeSyncEngine/useStripeSyncStatus'

export const StripeSyncSettingsPage = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()

  const { installationStatus, isLoading: isLoadingInstallationStatus } = useStripeSyncStatus({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const installed = isInstalled(installationStatus)

  // Redirect to overview page when integration is not installed
  useEffect(() => {
    if (isLoadingInstallationStatus || installed || !project?.ref) return

    router.push(`/project/${project.ref}/integrations/stripe_sync_engine/overview`)
  }, [isLoadingInstallationStatus, installed, project?.ref, router])

  return (
    <PageContainer>
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
