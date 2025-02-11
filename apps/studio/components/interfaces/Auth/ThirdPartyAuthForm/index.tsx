import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useDeleteThirdPartyAuthIntegrationMutation } from 'data/third-party-auth/integration-delete-mutation'
import {
  ThirdPartyAuthIntegration,
  useThirdPartyAuthIntegrationsQuery,
} from 'data/third-party-auth/integrations-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { cn } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { AddIntegrationDropdown } from './AddIntegrationDropdown'
import { CreateAuth0IntegrationDialog } from './CreateAuth0Dialog'
import { CreateAwsCognitoAuthIntegrationDialog } from './CreateAwsCognitoAuthDialog'
import { CreateFirebaseAuthIntegrationDialog } from './CreateFirebaseAuthDialog'
import { IntegrationCard } from './IntegrationCard'
import {
  getIntegrationType,
  getIntegrationTypeLabel,
  INTEGRATION_TYPES,
} from './ThirdPartyAuthForm.utils'

export const ThirdPartyAuthForm = () => {
  const { ref: projectRef } = useParams()
  const {
    data: integrationsData,
    isLoading,
    isError,
    isSuccess,
    error,
  } = useThirdPartyAuthIntegrationsQuery({ projectRef })
  const integrations = integrationsData || []

  const [selectedIntegration, setSelectedIntegration] = useState<INTEGRATION_TYPES>()
  const [selectedIntegrationForDeletion, setSelectedIntegrationForDeletion] =
    useState<ThirdPartyAuthIntegration>()

  const { mutateAsync: deleteIntegration } = useDeleteThirdPartyAuthIntegrationMutation()
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  if (isError) {
    return (
      <AlertError
        error={error}
        subject="Failed to retrieve auth configuration for Third Party Auth Integrations"
      />
    )
  }

  return (
    <div className="pb-4">
      <FormHeader
        title="Third Party Auth"
        className="mb-1"
        description="Use third-party authentication (TPA) systems based on JWTs to access your project."
        actions={
          integrations.length !== 0 ? (
            <AddIntegrationDropdown onSelectIntegrationType={setSelectedIntegration} />
          ) : null
        }
        docsUrl="https://supabase.com/docs/guides/auth/third-party/overview"
      />
      <div className="prose text-sm mb-6 max-w-full">
        <span>
          Billing is based on the number of monthly active users (MAUs) requesting your API
          throughout the billing period (50 included then you'll be charged{' '}
        </span>
        <span className="text-brand">$0.00325</span>
        <span> per MAU).</span>
      </div>
      {isLoading && (
        <div
          className={cn(
            'border rounded border-default px-20 py-16 flex flex-col items-center justify-center space-y-4'
          )}
        >
          <Loader2 size={24} className="animate-spin" />
        </div>
      )}

      {isSuccess ? (
        integrations.length === 0 ? (
          <div
            className={cn(
              'border rounded border-default px-20 py-16 flex flex-col items-center justify-center space-y-4'
            )}
          >
            <p className="text-sm text-foreground-light">No providers configured yet</p>
            <AddIntegrationDropdown
              buttonText="Add a new integration"
              onSelectIntegrationType={setSelectedIntegration}
            />
          </div>
        ) : (
          <div className="-space-y-px">
            {integrations.map((integration) => {
              return (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  canUpdateConfig={canUpdateConfig}
                  onDelete={() => {
                    setSelectedIntegrationForDeletion(integration)
                  }}
                />
              )
            })}
          </div>
        )
      ) : null}

      <CreateFirebaseAuthIntegrationDialog
        visible={selectedIntegration === 'firebase'}
        onDelete={() => {}}
        onClose={() => setSelectedIntegration(undefined)}
      />

      <CreateAwsCognitoAuthIntegrationDialog
        visible={selectedIntegration === 'awsCognito'}
        onDelete={() => {}}
        onClose={() => setSelectedIntegration(undefined)}
      />

      <CreateAuth0IntegrationDialog
        visible={selectedIntegration === 'auth0'}
        onDelete={() => {}}
        onClose={() => setSelectedIntegration(undefined)}
      />

      <ConfirmationModal
        visible={!!selectedIntegrationForDeletion}
        variant="destructive"
        title="Confirm to delete"
        confirmLabel="Delete"
        confirmLabelLoading="Deleting"
        onCancel={() => setSelectedIntegrationForDeletion(undefined)}
        onConfirm={async () => {
          if (!selectedIntegrationForDeletion) {
            return
          }
          const type = getIntegrationType(selectedIntegrationForDeletion)
          try {
            await deleteIntegration({
              projectRef: projectRef!,
              tpaId: selectedIntegrationForDeletion.id,
            })
            toast.success(`Successfully deleted ${getIntegrationTypeLabel(type)}.`)
            setSelectedIntegrationForDeletion(undefined)
            setSelectedIntegration(undefined)
          } catch (error) {
            toast.error(`Failed to delete ${getIntegrationTypeLabel(type)}.`)
            console.error(error)
          }
        }}
      >
        <p className="py-4 text-sm text-foreground-light">
          {`Are you sure you want to delete the ${getIntegrationTypeLabel(getIntegrationType(selectedIntegrationForDeletion))} integration?`}
        </p>
      </ConfirmationModal>
    </div>
  )
}
