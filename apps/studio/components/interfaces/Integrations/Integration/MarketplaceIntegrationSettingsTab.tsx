import dayjs from 'dayjs'
import { Settings, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Badge, Button } from 'ui'
import { Admonition, GenericSkeletonLoader } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { defaultDisabledSmtpFormValues } from '@/components/interfaces/Auth/SmtpForm/SmtpForm.constants'
import { ConstrainedIntegrationTabScaffold } from '@/components/interfaces/Integrations/ConstrainedIntegrationTabScaffold'
import {
  getConnectedResources,
  useProjectOAuthIntegrationData,
  type ConnectedResource,
} from '@/components/interfaces/Integrations/Landing/Landing.utils'
import { useIntegrationDetail } from '@/components/interfaces/Integrations/Landing/useIntegrationDetail'
import { RevokeAppModal } from '@/components/interfaces/Organization/OAuthApps/RevokeAppModal'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useAPIKeyDeleteMutation } from '@/data/api-keys/api-key-delete-mutation'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { useAuthorizedAppRevokeMutation } from '@/data/oauth/authorized-app-revoke-mutation'
import type { AuthorizedApp } from '@/data/oauth/authorized-apps-query'
import { useSecretsDeleteMutation } from '@/data/secrets/secrets-delete-mutation'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

type ResourceKind = ConnectedResource['kind']
type ApiKeyResource = Extract<ConnectedResource, { kind: 'api_key' }>

type ManageAction = { label: string; href: string }

/** A single removable entry within a section (one OAuth app, one API key, one secret, etc.). */
type ResourceItem = { resource: ConnectedResource; identifier: string; meta?: string }

/** A group of same-kind resources rendered as one section (e.g. all secret API keys together). */
type ResourceGroup = {
  kind: ResourceKind
  title: string
  badge?: string
  description: ReactNode
  note: string
  manageAction?: ManageAction
  items: ResourceItem[]
}

const KIND_ORDER: ResourceKind[] = ['oauth_app', 'api_key', 'edge_function_secret', 'smtp']

const formatDate = (value?: string | null) =>
  value ? dayjs(value).format('MMM D, YYYY') : undefined

/** The monospace identifier shown for an individual resource. */
const getItemIdentifier = (resource: ConnectedResource): string => {
  switch (resource.kind) {
    case 'oauth_app':
      return resource.app.name
    case 'api_key':
      return resource.apiKey.name
    case 'edge_function_secret':
      return resource.secret.name
    case 'smtp':
      return 'smtp.resend.com'
  }
}

/** Secondary metadata (timestamp) shown beneath an individual resource. */
const getItemMeta = (resource: ConnectedResource): string | undefined => {
  switch (resource.kind) {
    case 'oauth_app': {
      const date = formatDate(resource.app.authorized_at)
      return date ? `Authorized ${date}` : undefined
    }
    case 'api_key': {
      const date = formatDate(resource.apiKey.inserted_at)
      return date ? `Created ${date}` : undefined
    }
    case 'edge_function_secret': {
      const date = formatDate(resource.secret.updated_at)
      return date ? `Updated ${date}` : undefined
    }
    case 'smtp':
      return undefined
  }
}

/**
 * Section-level, integration-aware copy for a kind of resource. The settings page reads like a
 * guide that explains what each resource does and what removing it affects.
 */
const getGroupContent = ({
  kind,
  count,
  integrationName,
  orgSlug,
  projectRef,
}: {
  kind: ResourceKind
  count: number
  integrationName: string
  orgSlug?: string
  projectRef?: string
}): Omit<ResourceGroup, 'kind' | 'items'> => {
  const name = <span className="text-foreground">{integrationName}</span>
  const plural = count > 1

  switch (kind) {
    case 'oauth_app':
      return {
        title: 'OAuth application',
        badge: 'Connected',
        description: (
          <>
            Grants {name} access to your organization and its projects through a scoped OAuth grant.
          </>
        ),
        note: 'Removing this OAuth app will remove it for all projects and members of your organization.',
        manageAction: orgSlug
          ? { label: 'Manage access', href: `/org/${orgSlug}/apps` }
          : undefined,
      }
    case 'api_key':
      return {
        title: plural ? 'Secret API keys' : 'Secret API key',
        description: plural ? (
          <>Secret API keys that {name} uses to authenticate to your project&apos;s API.</>
        ) : (
          <>A secret API key that {name} uses to authenticate to your project&apos;s API.</>
        ),
        note: `Removing ${plural ? 'a key' : 'this key'} takes effect immediately and can interrupt the integration.`,
      }
    case 'edge_function_secret':
      return {
        title: plural ? 'Edge Function secrets' : 'Edge Function secret',
        description: plural ? (
          <>
            Secrets synced by {name} and exposed to your project&apos;s Edge Functions at runtime.
          </>
        ) : (
          <>
            A secret synced by {name} and exposed to your project&apos;s Edge Functions at runtime.
          </>
        ),
        note: `Removing ${plural ? 'a secret' : 'this secret'} takes effect immediately and can interrupt the integration.`,
      }
    case 'smtp':
      return {
        title: 'SMTP settings',
        description: <>A custom SMTP relay so your project sends emails through {name}.</>,
        note: 'Removing this relay reverts your project to the default email service. Auth emails may be rate-limited until SMTP is configured again.',
        manageAction: projectRef
          ? { label: 'Manage settings', href: `/project/${projectRef}/auth/smtp` }
          : undefined,
      }
  }
}

const ResourceGroupSection = ({
  group,
  onRemove,
}: {
  group: ResourceGroup
  onRemove: (resource: ConnectedResource) => void
}) => {
  return (
    <section className="flex flex-col gap-y-4 border-b py-8 first:pt-0 last:border-b-0">
      <div className="flex flex-col gap-y-2">
        <div className="flex items-center gap-x-2">
          <h3 className="text-base text-foreground">{group.title}</h3>
          {group.badge && (
            <Badge variant="success" className="gap-x-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              {group.badge}
            </Badge>
          )}
        </div>
        <p className="text-sm text-foreground-light max-w-2xl">{group.description}</p>
      </div>

      <Admonition type="default" className="m-0 max-w-2xl">
        {group.note}
      </Admonition>

      <div className="max-w-2xl divide-y rounded-md border bg-surface-100">
        {group.items.map((item) => (
          <div
            key={item.resource.key}
            className="flex items-center justify-between gap-x-4 px-4 py-3"
          >
            <div className="flex min-w-0 flex-col">
              <code className="truncate font-mono text-sm text-foreground" title={item.identifier}>
                {item.identifier}
              </code>
              {item.meta && <span className="text-xs text-foreground-lighter">{item.meta}</span>}
            </div>
            <div className="flex shrink-0 items-center gap-x-2">
              {group.manageAction && (
                <Button asChild type="default" icon={<Settings />}>
                  <a href={group.manageAction.href}>{group.manageAction.label}</a>
                </Button>
              )}
              <Button
                type="default"
                icon={<Trash2 className="text-foreground-light" />}
                onClick={() => onRemove(item.resource)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export const MarketplaceIntegrationSettingsTab = () => {
  const { ref, integration } = useIntegrationDetail()
  const { data: organization } = useSelectedOrganizationQuery()

  const { data: projectData, isLoading, isError, error } = useProjectOAuthIntegrationData(ref)

  // The generic confirmation modal targets a single resource or all of them ('all'). The OAuth app
  // and API keys are removed through their own dedicated modals, tracked separately.
  const [confirmTarget, setConfirmTarget] = useState<ConnectedResource | 'all' | undefined>()
  const [appToRevoke, setAppToRevoke] = useState<AuthorizedApp | undefined>()
  const [apiKeyToDelete, setApiKeyToDelete] = useState<ApiKeyResource | undefined>()

  const onMutationSuccess = () => {
    toast.success('Successfully removed the connected resource')
  }

  const { mutateAsync: revokeAuthorizedApp, isPending: isRevokingApp } =
    useAuthorizedAppRevokeMutation({ onSuccess: onMutationSuccess })
  const { mutateAsync: deleteAPIKey, isPending: isDeletingApiKey } = useAPIKeyDeleteMutation({
    onSuccess: onMutationSuccess,
  })
  const { mutateAsync: deleteSecrets, isPending: isDeletingSecret } = useSecretsDeleteMutation({
    onSuccess: onMutationSuccess,
  })
  const { mutateAsync: updateAuthConfig, isPending: isUpdatingAuthConfig } =
    useAuthConfigUpdateMutation({ onSuccess: onMutationSuccess })

  const isRemoving = isRevokingApp || isDeletingApiKey || isDeletingSecret || isUpdatingAuthConfig

  const integrationName = integration?.name ?? 'this integration'
  const resources =
    integration && projectData ? getConnectedResources({ integration, projectData }) : []

  // Group resources by kind so e.g. multiple secret API keys render under one section.
  const groups: ResourceGroup[] = KIND_ORDER.flatMap((kind) => {
    const kindResources = resources.filter((resource) => resource.kind === kind)
    if (kindResources.length === 0) return []
    return [
      {
        kind,
        ...getGroupContent({
          kind,
          count: kindResources.length,
          integrationName,
          orgSlug: organization?.slug,
          projectRef: ref,
        }),
        items: kindResources.map((resource) => ({
          resource,
          identifier: getItemIdentifier(resource),
          meta: getItemMeta(resource),
        })),
      },
    ]
  })

  const removeResource = async (resource: ConnectedResource) => {
    switch (resource.kind) {
      case 'oauth_app':
        if (!organization?.slug) throw new Error('Organization is required')
        return revokeAuthorizedApp({ orgSlug: organization.slug, id: resource.app.id })
      case 'api_key':
        if (!ref) throw new Error('Project is required')
        return deleteAPIKey({ projectRef: ref, id: resource.apiKey.id! })
      case 'edge_function_secret':
        if (!ref) throw new Error('Project is required')
        return deleteSecrets({ projectRef: ref, secrets: [resource.secret.name] })
      case 'smtp':
        if (!ref) throw new Error('Project is required')
        return updateAuthConfig({ projectRef: ref, config: defaultDisabledSmtpFormValues })
    }
  }

  const onSelectRemove = (resource: ConnectedResource) => {
    // Reuse the same dedicated modals used elsewhere for OAuth apps and API keys.
    if (resource.kind === 'oauth_app') setAppToRevoke(resource.app)
    else if (resource.kind === 'api_key') setApiKeyToDelete(resource)
    else setConfirmTarget(resource)
  }

  const onConfirmRemove = async () => {
    if (!confirmTarget) return
    try {
      if (confirmTarget === 'all') {
        for (const resource of resources) await removeResource(resource)
      } else {
        await removeResource(confirmTarget)
      }
      setConfirmTarget(undefined)
    } catch (err) {
      toast.error(`Failed to remove: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const onConfirmDeleteApiKey = async () => {
    if (!apiKeyToDelete || !ref) return
    try {
      await deleteAPIKey({ projectRef: ref, id: apiKeyToDelete.apiKey.id! })
      setApiKeyToDelete(undefined)
    } catch {
      // Error toast is handled by the mutation's default onError.
    }
  }

  const isUninstallingAll = confirmTarget === 'all'
  const confirmResourceTitle =
    confirmTarget && confirmTarget !== 'all' ? confirmTarget.title.toLowerCase() : 'resource'

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
        title={
          isUninstallingAll ? `Uninstall ${integrationName}?` : `Remove ${confirmResourceTitle}?`
        }
        confirmLabel={isUninstallingAll ? 'Uninstall' : 'Remove'}
        confirmLabelLoading={isUninstallingAll ? 'Uninstalling' : 'Removing'}
        onCancel={() => setConfirmTarget(undefined)}
        onConfirm={onConfirmRemove}
      >
        <p className="text-sm text-foreground-light">
          {isUninstallingAll ? (
            <>
              This removes all {resources.length} connected resource
              {resources.length === 1 ? '' : 's'} and revokes {integrationName}&apos;s access to
              your project. This action cannot be undone.
            </>
          ) : (
            <>
              This removes the resource immediately and may stop {integrationName} from working
              correctly. This action cannot be undone.
            </>
          )}
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
        loading={isDeletingApiKey}
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
