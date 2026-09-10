import { type ResourceGroup, type ResourceKind } from './MarketplaceIntegrationSettingsTab.types'
import {
  type ConnectedResource,
  type ConnectedResourceUsage,
} from '@/components/interfaces/Integrations/Landing/Landing.utils'
import { formatDate } from '@/lib/datetime'

export const KIND_ORDER: ResourceKind[] = ['oauth_app', 'api_key', 'edge_function_secret', 'smtp']

/** Formats a resource timestamp for display, returning undefined for missing values. */
const formatResourceDate = (value?: string | null) =>
  value ? formatDate(value, { format: 'MMM D, YYYY' }) : undefined

/** The monospace identifier shown for an individual resource. */
export const getItemIdentifier = (resource: ConnectedResource): string => {
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
export const getItemMeta = (resource: ConnectedResource): string | undefined => {
  switch (resource.kind) {
    case 'oauth_app': {
      const date = formatResourceDate(resource.app.authorized_at)
      return date ? `Authorized ${date}` : undefined
    }
    case 'api_key': {
      const date = formatResourceDate(resource.apiKey.inserted_at)
      return date ? `Created ${date}` : undefined
    }
    case 'edge_function_secret': {
      const date = formatResourceDate(resource.secret.updated_at)
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
export const getGroupContent = ({
  kind,
  count,
  integrationName,
  orgSlug,
  projectRef,
  usage,
}: {
  kind: ResourceKind
  count: number
  integrationName: string
  orgSlug?: string
  projectRef?: string
  /** Integration-specific copy that overrides the generic, kind-level description and note. */
  usage?: ConnectedResourceUsage
}): Omit<ResourceGroup, 'kind' | 'items' | 'missing'> => {
  const name = <span className="text-foreground">{integrationName}</span>
  const plural = count > 1

  switch (kind) {
    case 'oauth_app':
      return {
        title: 'OAuth application',
        badge: 'Connected',
        description: usage?.description ?? (
          <>
            Grants {name} access to your organization and its projects through a scoped OAuth grant.
          </>
        ),
        note:
          usage?.removalWarning ??
          'Removing this OAuth app will remove it for all projects and members of your organization.',
        missingNote:
          usage?.noteWhenAbsent ??
          `No OAuth app is connected for ${integrationName}. It does not have access to your organization or its projects.`,
        manageAction: orgSlug
          ? { label: 'Manage access', href: `/org/${orgSlug}/apps` }
          : undefined,
      }
    case 'api_key':
      return {
        title: plural ? 'Secret API keys' : 'Secret API key',
        description:
          usage?.description ??
          (plural ? (
            <>Secret API keys that {name} uses to authenticate to your project&apos;s API.</>
          ) : (
            <>A secret API key that {name} uses to authenticate to your project&apos;s API.</>
          )),
        note:
          usage?.removalWarning ??
          `Removing ${plural ? 'a key' : 'this key'} takes effect immediately and can interrupt the integration.`,
        missingNote:
          usage?.noteWhenAbsent ??
          `No secret API key is connected for ${integrationName}. It cannot authenticate to your project's API.`,
      }
    case 'edge_function_secret':
      return {
        title: plural ? 'Edge Function secrets' : 'Edge Function secret',
        description:
          usage?.description ??
          (plural ? (
            <>
              Secrets synced by {name} and exposed to your project&apos;s Edge Functions at runtime.
            </>
          ) : (
            <>
              A secret synced by {name} and exposed to your project&apos;s Edge Functions at
              runtime.
            </>
          )),
        note:
          usage?.removalWarning ??
          `Removing ${plural ? 'a secret' : 'this secret'} takes effect immediately and can interrupt the integration.`,
        missingNote:
          usage?.noteWhenAbsent ??
          `No Edge Function secret from ${integrationName} was detected. Functions that rely on it may fail at runtime.`,
      }
    case 'smtp':
      return {
        title: 'SMTP settings',
        description: usage?.description ?? (
          <>A custom SMTP relay so your project sends emails through {name}.</>
        ),
        note:
          usage?.removalWarning ??
          'Removing this relay reverts your project to the default email service. Auth emails may be rate-limited until SMTP is configured again.',
        missingNote:
          usage?.noteWhenAbsent ??
          `SMTP settings for ${integrationName} were not detected. Authentication emails may not be sent through the integration's SMTP service.`,
        manageAction: projectRef
          ? { label: 'Manage settings', href: `/project/${projectRef}/auth/smtp` }
          : undefined,
      }
  }
}
