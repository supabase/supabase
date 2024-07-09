import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

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
import { CreateAuth0IntegrationSheet } from './CreateAuth0Sheet'
import { CreateAwsCognitoAuthIntegrationSheet } from './CreateAwsCognitoAuthSheet'
import { CreateFirebaseAuthIntegrationSheet } from './CreateFirebaseAuthSheet'
import { IntegrationCard } from './IntegrationCard'
import {
  INTEGRATION_TYPES,
  getIntegrationType,
  getIntegrationTypeLabel,
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

  const { mutate: deleteIntegration } = useDeleteThirdPartyAuthIntegrationMutation()
  // TODO: check if these permissions cover third party auth as well
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
        description="Use third-party authentication (TPA) systems based on JWTs to access your project."
        actions={
          integrations.length !== 0 ? (
            <AddIntegrationDropdown onSelectIntegrationType={setSelectedIntegration} />
          ) : null
        }
      />

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
            <p className="text-sm text-foreground-light">No integrations configured yet</p>
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
                  onSelect={() => {
                    setSelectedIntegrationForDeletion(integration)
                  }}
                />
              )
            })}
          </div>
        )
      ) : null}

      <CreateFirebaseAuthIntegrationSheet
        visible={selectedIntegration === 'firebase'}
        onDelete={() => {}}
        onClose={() => setSelectedIntegration(undefined)}
      />

      <CreateAwsCognitoAuthIntegrationSheet
        visible={selectedIntegration === 'awsCognito'}
        onDelete={() => {}}
        onClose={() => setSelectedIntegration(undefined)}
      />

      <CreateAuth0IntegrationSheet
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
          await deleteIntegration({
            projectRef: projectRef!,
            tpaId: selectedIntegrationForDeletion.id,
          })
          const type = getIntegrationType(selectedIntegrationForDeletion)
          toast.success(`A ${getIntegrationTypeLabel(type)} has been deleted.`)
          setSelectedIntegrationForDeletion(undefined)
          setSelectedIntegration(undefined)
        }}
      >
        <p className="py-4 text-sm text-foreground-light">
          {`Are you sure you want to delete the ${getIntegrationTypeLabel(getIntegrationType(selectedIntegrationForDeletion))} integration?`}
        </p>
      </ConfirmationModal>
    </div>
  )
}
