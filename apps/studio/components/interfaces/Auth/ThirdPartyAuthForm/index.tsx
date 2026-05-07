import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { AddIntegrationDropdown } from './AddIntegrationDropdown'
import { CreateAuth0IntegrationDialog } from './CreateAuth0Dialog'
import { CreateAwsCognitoAuthIntegrationDialog } from './CreateAwsCognitoAuthDialog'
import { CreateClerkAuthIntegrationDialog } from './CreateClerkAuthDialog'
import { CreateFirebaseAuthIntegrationDialog } from './CreateFirebaseAuthDialog'
import { CreateWorkOSIntegrationDialog } from './CreateWorkOSDialog'
import { IntegrationCard } from './IntegrationCard'
import {
  getIntegrationType,
  getIntegrationTypeLabel,
  INTEGRATION_TYPES,
} from './ThirdPartyAuthForm.utils'
import AlertError from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { InlineLink } from '@/components/ui/InlineLink'
import { useDeleteThirdPartyAuthIntegrationMutation } from '@/data/third-party-auth/integration-delete-mutation'
import {
  ThirdPartyAuthIntegration,
  thirdPartyAuthIntegrationsQueryOptions,
} from '@/data/third-party-auth/integrations-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { DOCS_URL } from '@/lib/constants'

export const ThirdPartyAuthForm = () => {
  const { ref: projectRef } = useParams()
  const {
    data: integrationsData,
    isPending: isLoading,
    isError,
    isSuccess,
    error,
  } = useQuery(thirdPartyAuthIntegrationsQueryOptions({ projectRef }))
  const integrations = integrationsData || []

  const [selectedIntegration, setSelectedIntegration] = useState<INTEGRATION_TYPES>()
  const [selectedIntegrationForDeletion, setSelectedIntegrationForDeletion] =
    useState<ThirdPartyAuthIntegration>()

  const { mutateAsync: deleteIntegration } = useDeleteThirdPartyAuthIntegrationMutation()
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  if (isError) {
    return (
      <AlertError
        error={error}
        subject="Failed to retrieve auth configuration for Third-Party Auth Integrations"
      />
    )
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Third-Party Auth</PageSectionTitle>
          <PageSectionDescription>
            Billing is based on the number of monthly active users (MAUs) requesting your API
            throughout the billing period.{' '}
            <InlineLink
              href={`${DOCS_URL}/guides/platform/manage-your-usage/monthly-active-users-third-party`}
            >
              Learn more
            </InlineLink>
          </PageSectionDescription>
        </PageSectionSummary>
        <PageSectionAside>
          <DocsButton href={`${DOCS_URL}/guides/auth/third-party/overview`} />
          <AddIntegrationDropdown onSelectIntegrationType={setSelectedIntegration} />
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent>
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
            <EmptyStatePresentational
              title="Add an authentication provider"
              description="Use third-party authentication systems based on JWTs to access your project."
            >
              <AddIntegrationDropdown
                align="center"
                type="default"
                onSelectIntegrationType={setSelectedIntegration}
              />
            </EmptyStatePresentational>
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

        <CreateClerkAuthIntegrationDialog
          visible={selectedIntegration === 'clerk'}
          onDelete={() => {}}
          onClose={() => setSelectedIntegration(undefined)}
        />

        <CreateWorkOSIntegrationDialog
          visible={selectedIntegration === 'workos'}
          onDelete={() => {}}
          onClose={() => setSelectedIntegration(undefined)}
        />

        <ConfirmationModal
          size="medium"
          visible={!!selectedIntegrationForDeletion}
          variant="destructive"
          title="Confirm to delete integration"
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
          <p className="text-sm text-foreground-light">
            Are you sure you want to delete the{' '}
            {getIntegrationTypeLabel(getIntegrationType(selectedIntegrationForDeletion))}{' '}
            integration?
          </p>
        </ConfirmationModal>
      </PageSectionContent>
    </PageSection>
  )
}
