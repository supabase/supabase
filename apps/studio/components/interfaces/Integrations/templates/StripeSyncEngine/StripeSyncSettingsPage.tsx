import { useSchemasQuery } from 'data/database/schemas-query'
import { useStripeSyncUninstallMutation } from 'data/database-integrations/stripe/stripe-sync-uninstall-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { ExternalLink, Loader2, Table2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  INSTALLATION_INSTALLED_SUFFIX,
  STRIPE_SCHEMA_COMMENT_PREFIX,
} from 'stripe-experiment-sync/supabase'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { FormPanelContainer, FormPanelContent } from 'components/ui/Forms/FormPanel'

export const StripeSyncSettingsPage = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const [showUninstallModal, setShowUninstallModal] = useState(false)
  const [isUninstallInitiated, setIsUninstallInitiated] = useState(false)

  const { data: schemas, isLoading: isSchemasLoading } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const stripeSchema = schemas?.find((s) => s.name === 'stripe')

  const isInstalled =
    stripeSchema &&
    stripeSchema.description?.startsWith(STRIPE_SCHEMA_COMMENT_PREFIX) &&
    stripeSchema.description.includes(INSTALLATION_INSTALLED_SUFFIX)

  // Redirect to overview if not installed
  useEffect(() => {
    if (!isSchemasLoading && !isInstalled && project?.ref) {
      router.push(`/project/${project.ref}/integrations/stripe_sync_engine/overview`)
    }
  }, [isSchemasLoading, isInstalled, project?.ref, router])

  const { mutate: uninstallStripeSync, isPending: isUninstalling } = useStripeSyncUninstallMutation(
    {
      onSuccess: () => {
        toast.success('Stripe Sync uninstallation started')
        setShowUninstallModal(false)
        setIsUninstallInitiated(true)
        // Redirect to overview after uninstall
        if (project?.ref) {
          router.push(`/project/${project.ref}/integrations/stripe_sync_engine/overview`)
        }
      },
    }
  )

  const handleUninstall = () => {
    if (!project?.ref) return
    uninstallStripeSync({ projectRef: project.ref })
  }

  const tableEditorUrl = `/project/${project?.ref}/editor?schema=stripe`

  // Show loading state while checking installation status
  if (isSchemasLoading || !isInstalled) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-foreground-muted" size={24} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 p-10">
      {/* Stripe Schema Section */}
      <FormPanelContainer>
        <div className="px-8 py-6 flex justify-between items-center">
          <FormHeader
            title="Stripe Schema"
            description="Access and manage the synced Stripe data in your database."
          />
        </div>
        <FormPanelContent>
          <div className="px-8 py-4">
            <p className="text-sm text-foreground-light mb-4">
              The Stripe Sync Engine stores all synced data in the <code>stripe</code> schema. You
              can view and query this data directly in the Table Editor.
            </p>
            <Button asChild type="default" icon={<Table2 size={14} />}>
              <Link href={tableEditorUrl}>Open Stripe Schema in Table Editor</Link>
            </Button>
          </div>
        </FormPanelContent>
      </FormPanelContainer>

      {/* Uninstall Section */}
      <FormPanelContainer>
        <div className="px-8 py-6 flex justify-between items-center">
          <FormHeader
            title="Uninstall Stripe Sync Engine"
            description="Remove the Stripe Sync Engine integration from your project."
          />
        </div>
        <FormPanelContent>
          <div className="px-8 py-4">
            <Admonition type="warning" className="mb-4">
              <p>
                Uninstalling will remove the <code>stripe</code> schema and all synced data. This
                action cannot be undone.
              </p>
            </Admonition>
            <Button
              type="danger"
              onClick={() => setShowUninstallModal(true)}
              loading={isUninstalling || isUninstallInitiated}
              disabled={isUninstalling || isUninstallInitiated}
            >
              {isUninstallInitiated ? 'Uninstalling...' : 'Uninstall Stripe Sync Engine'}
            </Button>
          </div>
        </FormPanelContent>
      </FormPanelContainer>

      {/* Uninstall Confirmation Modal */}
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
    </div>
  )
}
