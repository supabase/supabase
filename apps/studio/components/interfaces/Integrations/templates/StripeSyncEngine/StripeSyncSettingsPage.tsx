import { useStripeSyncUninstallMutation } from 'data/database-integrations/stripe/stripe-sync-uninstall-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Loader2, Table2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Card,
  CardContent,
  WarningIcon,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { useStripeSyncStatus } from '@/components/interfaces/Integrations/templates/StripeSyncEngine/useStripeSyncStatus'

export const StripeSyncSettingsPage = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const [showUninstallModal, setShowUninstallModal] = useState(false)

  const { installationStatus } = useStripeSyncStatus({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isInstalled = installationStatus === 'installed'
  const uninstallInProgress = installationStatus === 'uninstalling'

  const { mutate: uninstallStripeSync, isPending: isUninstalling } = useStripeSyncUninstallMutation(
    {
      onSuccess: () => {
        toast.success('Stripe Sync uninstallation started')
        setShowUninstallModal(false)
        // Redirect to overview after uninstall with status query parameter
        if (project?.ref) {
          router.push(
            `/project/${project.ref}/integrations/stripe_sync_engine/overview?status=uninstalling`
          )
        }
      },
    }
  )

  // Redirect to overview if not installed and not uninstalling
  useEffect(() => {
    if (!isInstalled && !uninstallInProgress && !isUninstalling && project?.ref) {
      router.push(`/project/${project.ref}/integrations/stripe_sync_engine/overview`)
    }
  }, [isInstalled, uninstallInProgress, isUninstalling, project?.ref, router])

  const handleUninstall = () => {
    if (!project?.ref) return
    uninstallStripeSync({ projectRef: project.ref })
  }

  const tableEditorUrl = `/project/${project?.ref}/editor?schema=stripe`

  const showLoading = isUninstalling || (!isInstalled && !uninstallInProgress)

  // Show loading state while checking installation status (but not during uninstall)
  if (showLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-foreground-muted" size={24} />
      </div>
    )
  }

  return (
    <>
      <PageContainer size="small">
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
              <CardContent>
                <div className="flex space-x-4 @container">
                  <Table2 className="w-5 h-5 shrink-0" />
                  <div className="flex flex-col items-start @lg:flex-row @lg:items-center  gap-4">
                    <div className="flex flex-col gap-1">
                      <h5 className="text-sm mb-1">Open Stripe schema in Table Editor</h5>
                      <p className="text-sm text-foreground-light">
                        The Stripe Sync Engine stores all synced data in the <code>stripe</code>{' '}
                        schema. You can view and query this data directly in the Table Editor.
                      </p>
                    </div>
                    <Button asChild type="default">
                      <Link href={tableEditorUrl}>Open Table Editor</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PageSectionContent>
        </PageSection>

        <PageSection id="uninstall-stripe-sync">
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Uninstall Stripe Sync Engine</PageSectionTitle>
              <PageSectionDescription>
                Remove the integration and all synced data from your project.
              </PageSectionDescription>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <Alert_Shadcn_ variant="warning" className="flex space-x-4 @container">
              <div>
                <WarningIcon className="w-5 h-5 shrink-0" />
              </div>
              <div className="flex flex-col items-start @lg:flex-row @lg:items-center gap-4 p-0 m-0">
                <div>
                  <AlertTitle_Shadcn_>
                    Uninstalling will remove the <code>stripe</code> schema and all synced data.
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>This action cannot be undone.</AlertDescription_Shadcn_>
                </div>
                <div className="mt-2">
                  <Button
                    type="default"
                    onClick={() => setShowUninstallModal(true)}
                    loading={isUninstalling || uninstallInProgress}
                    disabled={isUninstalling || uninstallInProgress}
                  >
                    {isUninstalling || uninstallInProgress
                      ? 'Uninstalling...'
                      : 'Uninstall Stripe Sync Engine'}
                  </Button>
                </div>
              </div>
            </Alert_Shadcn_>
          </PageSectionContent>
        </PageSection>
      </PageContainer>

      <ConfirmationModal
        visible={showUninstallModal}
        title="Uninstall Stripe Sync Engine"
        confirmLabel="Uninstall"
        confirmLabelLoading="Uninstalling..."
        variant="destructive"
        loading={isUninstalling}
        onCancel={() => setShowUninstallModal(false)}
        onConfirm={handleUninstall}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to uninstall the Stripe Sync Engine? This will:
        </p>
        <ul className="list-disc pl-5 mt-2 text-sm text-foreground-light space-y-1">
          <li>
            Remove the <code>stripe</code> schema and all tables
          </li>
          <li>Delete all synced Stripe data</li>
          <li>Remove the associated Edge Functions</li>
          <li>Remove the scheduled sync jobs</li>
        </ul>
        <p className="mt-4 text-sm text-foreground-light font-medium">
          This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  )
}
