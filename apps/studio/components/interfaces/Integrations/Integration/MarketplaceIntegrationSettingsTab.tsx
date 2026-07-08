import { useState } from 'react'
import { toast } from 'sonner'
import { Admonition } from 'ui-patterns/admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ResourceGroupSection } from './ConnectedResourceGroupSection'
import { type ApiKeyResource, type ResourceGroup } from './MarketplaceIntegrationSettingsTab.types'
import {
  getGroupContent,
  getItemIdentifier,
  getItemMeta,
  KIND_ORDER,
} from './MarketplaceIntegrationSettingsTab.utils'
import { useConnectedResourceMutations } from './useConnectedResourceMutations'
import { ConstrainedIntegrationTabScaffold } from '@/components/interfaces/Integrations/ConstrainedIntegrationTabScaffold'
import {
  getConnectedResources,
  getConnectedResourceUsage,
  getExpectedResourceKinds,
  useProjectOAuthIntegrationData,
  type ConnectedResource,
} from '@/components/interfaces/Integrations/Landing/Landing.utils'
import { useIntegrationDetail } from '@/components/interfaces/Integrations/Landing/useIntegrationDetail'
import { RevokeAppModal } from '@/components/interfaces/Organization/OAuthApps/RevokeAppModal'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import type { AuthorizedApp } from '@/data/oauth/authorized-apps-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export const MarketplaceIntegrationSettingsTab = () => {
  const { ref, integration } = useIntegrationDetail()
  const { data: organization } = useSelectedOrganizationQuery()

  const { data: projectData, isLoading, isError, error } = useProjectOAuthIntegrationData(ref)

  // The generic confirmation modal targets a single resource. The OAuth app and API keys are
  // removed through their own dedicated modals, tracked separately.
  const [confirmTarget, setConfirmTarget] = useState<ConnectedResource | undefined>()
  const [appToRevoke, setAppToRevoke] = useState<AuthorizedApp | undefined>()
  const [apiKeyToDelete, setApiKeyToDelete] = useState<ApiKeyResource | undefined>()

  const { removeResource, isRemoving } = useConnectedResourceMutations({
    projectRef: ref,
    orgSlug: organization?.slug,
    onSuccess: () => toast.success('Successfully removed the connected resource'),
  })

  const integrationName = integration?.name ?? 'this integration'
  const resources =
    integration && projectData ? getConnectedResources({ integration, projectData }) : []

  // The kinds of resources this integration is expected to provision. Used to render a zero
  // (missing) state for any expected resource that isn't currently present.
  const expectedKinds = integration ? getExpectedResourceKinds(integration) : []

  // Only surface missing zero-states when the integration is otherwise still connected (at least
  // one resource present). A fully uninstalled integration falls through to the empty state below.
  const hasAnyResource = resources.length > 0

  // Group resources by kind so e.g. multiple secret API keys render under one section. Expected
  // kinds with no present resources render as a missing zero-state instead of being skipped.
  const groups: ResourceGroup[] = KIND_ORDER.flatMap((kind) => {
    const kindResources = resources.filter((resource) => resource.kind === kind)
    const isExpected = expectedKinds.includes(kind)
    const isMissing = kindResources.length === 0

    // Skip kinds that are neither present nor expected, and missing kinds while nothing is
    // connected. A missing OAuth app is communicated by the top-level orphaned-resources warning
    // instead of its own section, so it's skipped here to avoid repeating the same message.
    if (isMissing && (!isExpected || !hasAnyResource || kind === 'oauth_app')) return []

    return [
      {
        kind,
        ...getGroupContent({
          kind,
          // The zero-state copy reads in the singular, so default the count to 1 when missing.
          count: Math.max(kindResources.length, 1),
          integrationName,
          orgSlug: organization?.slug,
          projectRef: ref,
          usage: integration ? getConnectedResourceUsage(integration.id, kind) : undefined,
        }),
        missing: isMissing,
        items: kindResources.map((resource) => ({
          resource,
          identifier: getItemIdentifier(resource),
          meta: getItemMeta(resource),
        })),
      },
    ]
  })

  // Generic warning for OAuth-connected integrations: the OAuth app is gone but other resources it
  // provisioned are still associated with the project, leaving the integration in a broken state.
  const isOAuthAppMissing =
    expectedKinds.includes('oauth_app') && !resources.some((r) => r.kind === 'oauth_app')
  const hasOtherResources = resources.some((r) => r.kind !== 'oauth_app')
  const showOrphanedResourcesWarning = isOAuthAppMissing && hasOtherResources

  const onSelectRemove = (resource: ConnectedResource) => {
    // Reuse the same dedicated modals used elsewhere for OAuth apps and API keys.
    if (resource.kind === 'oauth_app') setAppToRevoke(resource.app)
    else if (resource.kind === 'api_key') setApiKeyToDelete(resource)
    else setConfirmTarget(resource)
  }

  const onConfirmRemove = async () => {
    if (!confirmTarget) return
    try {
      await removeResource(confirmTarget)
      setConfirmTarget(undefined)
    } catch (err) {
      toast.error(`Failed to remove: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const onConfirmDeleteApiKey = async () => {
    if (!apiKeyToDelete) return
    try {
      await removeResource(apiKeyToDelete)
      setApiKeyToDelete(undefined)
    } catch {
      // Error toast is handled by the mutation's default onError.
    }
  }

  const confirmResourceTitle = confirmTarget ? confirmTarget.title.toLowerCase() : 'resource'

  return (
    <>
      <ConstrainedIntegrationTabScaffold>
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex flex-col gap-y-3">
            <h2 className="flex items-center gap-x-2 text-2xl text-foreground">
              Connected resources
            </h2>
          </div>

          <div className="mt-8">
            {isLoading ? (
              <div className="pt-8">
                <GenericSkeletonLoader />
              </div>
            ) : isError ? (
              <Admonition
                type="warning"
                title="Failed to load connected resources"
                description={error?.message}
                className="mt-8"
              />
            ) : groups.length === 0 ? (
              <Admonition
                type="default"
                title="No connected resources"
                description={`${integrationName} doesn't have any resources connected to your project.`}
                className="mt-8"
              />
            ) : (
              <>
                {showOrphanedResourcesWarning && (
                  <Admonition
                    type="warning"
                    title="OAuth application is missing"
                    description={`No OAuth app is connected for ${integrationName}, but other resources associated with it are still present on your project. ${integrationName} may not work correctly without an OAuth app. Reconnect it, or to fully disconnect the integration, remove the remaining resources below.`}
                    className="mb-8 mt-0"
                  />
                )}
                {groups.map((group) => (
                  <ResourceGroupSection key={group.kind} group={group} onRemove={onSelectRemove} />
                ))}
              </>
            )}
          </div>
        </div>
      </ConstrainedIntegrationTabScaffold>

      <ConfirmationModal
        variant="destructive"
        visible={confirmTarget !== undefined}
        loading={isRemoving}
        title={`Remove ${confirmResourceTitle}?`}
        confirmLabel="Remove"
        confirmLabelLoading="Removing"
        onCancel={() => setConfirmTarget(undefined)}
        onConfirm={onConfirmRemove}
      >
        <p className="text-sm text-foreground-light">
          This removes the resource immediately and may stop {integrationName} from working
          correctly. This action cannot be undone.
        </p>
      </ConfirmationModal>

      <RevokeAppModal
        selectedApp={appToRevoke}
        orgSlug={organization?.slug}
        onClose={() => setAppToRevoke(undefined)}
      />

      <TextConfirmModal
        variant="destructive"
        visible={apiKeyToDelete !== undefined}
        loading={isRemoving}
        title={`Delete secret API key: ${apiKeyToDelete?.apiKey.name ?? ''}`}
        confirmString={apiKeyToDelete?.apiKey.name ?? ''}
        confirmLabel="Yes, irreversibly delete this API key"
        confirmPlaceholder="Type the name of the API key to confirm"
        onCancel={() => setApiKeyToDelete(undefined)}
        onConfirm={onConfirmDeleteApiKey}
        alert={{
          title: 'This cannot be undone',
          description:
            'Make sure all components using this key have been updated. Deletion will cause them to receive HTTP 401 Unauthorized status codes on all Supabase APIs.',
        }}
      />
    </>
  )
}
