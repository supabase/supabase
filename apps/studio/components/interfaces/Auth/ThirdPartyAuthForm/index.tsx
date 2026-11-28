import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { Loader2Icon } from 'lucide-react'
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
import { CreateCustomOidcIntegrationDialog } from './CreateCustomOidcDialog'
import { CreateFirebaseAuthIntegrationDialog } from './CreateFirebaseAuthDialog'
import { CreateScalekitAuthDialog } from './CreateScalekitAuthDialog'
import { CreateWorkOSIntegrationDialog } from './CreateWorkOSDialog'
import { IntegrationCard } from './IntegrationCard'
import {
  getIntegrationType,
  getIntegrationTypeLabel,
  INTEGRATION_TYPES,
} from './ThirdPartyAuthForm.utils'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { InlineLink } from '@/components/ui/InlineLink'
import { NoPermission } from '@/components/ui/NoPermission'
import { useDeleteThirdPartyAuthIntegrationMutation } from '@/data/third-party-auth/integration-delete-mutation'
import {
  ThirdPartyAuthIntegration,
  thirdPartyAuthIntegrationsQueryOptions,
} from '@/data/third-party-auth/integrations-query'
import { DOCS_URL } from '@/lib/constants'
import { getWriteGrantToastMessage, getWriteGrantTooltip, useGrant } from '@/lib/grants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const ThirdPartyAuthForm = () => {
  const { ref: projectRef } = useParams()
  const integrationsGrant = useGrant('GET /v1/projects/{ref}/config/auth/third-party-auth', {
    projectRef,
  })
  const deleteGrant = useGrant('DELETE /v1/projects/{ref}/config/auth/third-party-auth/{tpa_id}', {
    projectRef,
  })
  const {
    data: integrationsData,
    isPending: isLoadingIntegrations,
    isError,
    isSuccess,
    error,
  } = useQuery(
    thirdPartyAuthIntegrationsQueryOptions({ projectRef, grant: integrationsGrant.grant })
  )
  const isLoading = integrationsGrant.status === 'loading' || isLoadingIntegrations
  const integrations = integrationsData || []

  const [selectedIntegration, setSelectedIntegration] = useState<INTEGRATION_TYPES>()
  const [selectedIntegrationForDeletion, setSelectedIntegrationForDeletion] =
    useState<ThirdPartyAuthIntegration>()
  const [addIntegrationOpen, setAddIntegrationOpen] = useState(false)

  useShortcut(SHORTCUT_IDS.LIST_PAGE_NEW_ITEM, () => setAddIntegrationOpen(true), {
    label: 'Add provider',
  })

  const { mutateAsync: deleteIntegration } = useDeleteThirdPartyAuthIntegrationMutation()
  const canUpdateConfig = deleteGrant.status === 'granted'

  if (integrationsGrant.status === 'denied') {
    return <NoPermission resourceText="view auth provider settings" />
  }

  if (integrationsGrant.status === 'error') {
    return (
      <AlertError
        error={integrationsGrant.error}
        subject="Failed to check auth provider settings permissions"
      />
    )
  }

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
          <AddIntegrationDropdown
            open={addIntegrationOpen}
            onOpenChange={setAddIntegrationOpen}
            onSelectIntegrationType={setSelectedIntegration}
          />
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent>
        {isLoading && (
          <div
            className={cn(
              'border rounded-sm border-default px-20 py-16 flex flex-col items-center justify-center space-y-4'
            )}
          >
            <Loader2Icon size={24} className="animate-spin" />
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
                variant="default"
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
                    deleteTooltip={getWriteGrantTooltip(
                      deleteGrant.status,
                      'delete',
                      'third-party auth integrations'
                    )}
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

        <CreateScalekitAuthDialog
          visible={selectedIntegration === 'scalekit'}
          onClose={() => setSelectedIntegration(undefined)}
        />

        <CreateCustomOidcIntegrationDialog
          visible={selectedIntegration === 'custom'}
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
            if (!selectedIntegrationForDeletion) return
            if (!deleteGrant.grant) {
              toast.error(
                getWriteGrantToastMessage(
                  deleteGrant.status,
                  'delete',
                  'third-party auth integrations'
                )
              )
              return
            }
            const type = getIntegrationType(selectedIntegrationForDeletion)
            try {
              await deleteIntegration({
                projectRef: projectRef!,
                tpaId: selectedIntegrationForDeletion.id,
                grant: deleteGrant.grant,
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
