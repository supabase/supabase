import { parseSchemaComment } from '@stripe/sync-engine/supabase'
import { useMemo } from 'react'

import { type WrapperMeta } from '../Wrappers/Wrappers.types'
import { wrapperMetaComparator } from '../Wrappers/Wrappers.utils'
import { type IntegrationDefinition } from './Integrations.constants'
import {
  isInstalled as checkIsInstalled,
  findStripeSchema,
} from '@/components/interfaces/Integrations/templates/StripeSyncEngine/stripe-sync-status'
import { useAPIKeysQuery, type APIKey } from '@/data/api-keys/api-keys-query'
import { ProjectAuthConfigData, useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { type DatabaseExtension } from '@/data/database-extensions/database-extensions-query'
import { type Schema } from '@/data/database/schemas-query'
import { type FDW } from '@/data/fdw/fdws-query'
import { AuthorizedApp, useAuthorizedAppsQuery } from '@/data/oauth/authorized-apps-query'
import {
  IntegrationStatus,
  usePartnerIntegrationsQuery,
} from '@/data/partners/integration-status-query'
import { useSecretsQuery, type ProjectSecret } from '@/data/secrets/secrets-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { ResponseError } from '@/types'

export const isStripeSyncEngineInstalled = (schemas: Schema[]) => {
  const stripeSchema = findStripeSchema(schemas)
  const parsedSchema = parseSchemaComment(stripeSchema?.comment)
  return checkIsInstalled(parsedSchema.status)
}

type ProjectOAuthIntegrationData = {
  apiKeys: APIKey[]
  edgeFunctionSecrets: ProjectSecret[]
  authConfig: ProjectAuthConfigData | undefined
  partnerIntegrations: IntegrationStatus[]
  oauthApps: AuthorizedApp[]
}

/**
 * Gathers all the information needed to determine if an arbitrary OAuth integration is installed.
 */
export const useProjectOAuthIntegrationData = (
  projectRef: string | undefined,
  { enabled = true } = {}
): {
  data: ProjectOAuthIntegrationData
  error: ResponseError | null
  isError: boolean
  isLoading: boolean
  isPending: boolean
  isSuccess: boolean
} => {
  const { data: org } = useSelectedOrganizationQuery({ enabled })
  const queries = {
    apiKeys: useAPIKeysQuery({ projectRef, reveal: false }, { enabled }),
    edgeFunctionSecrets: useSecretsQuery({ projectRef }, { enabled }),
    authConfig: useAuthConfigQuery({ projectRef }, { enabled }),
    partnerIntegrations: usePartnerIntegrationsQuery({ projectRef }, { enabled }),
    oauthApps: useAuthorizedAppsQuery({ slug: org?.slug }, { enabled: !!org }),
  }

  // memoize to prevent object creation from triggering a re-render when the result data is used
  // as a dependency.
  const data = useMemo(() => {
    return {
      apiKeys: queries.apiKeys.data ?? [],
      edgeFunctionSecrets: queries.edgeFunctionSecrets.data ?? [],
      authConfig: queries.authConfig.data,
      partnerIntegrations: queries.partnerIntegrations.data ?? [],
      oauthApps: queries.oauthApps.data ?? [],
    }
  }, [
    queries.apiKeys.data,
    queries.edgeFunctionSecrets.data,
    queries.authConfig.data,
    queries.partnerIntegrations.data,
    queries.oauthApps.data,
  ])

  return {
    data,
    error:
      Object.values(queries)
        .map((q) => q.error)
        .find((e) => !!e) || null,
    isError: Object.values(queries).some((x) => x.isError),
    isLoading: Object.values(queries).some((x) => x.isLoading),
    isPending: Object.values(queries).some((x) => x.isPending),
    isSuccess: Object.values(queries).every((x) => x.isSuccess),
  }
}

const isPartnerIntegrationReady = (
  projectData: ProjectOAuthIntegrationData,
  integration: IntegrationDefinition
) => {
  return projectData.partnerIntegrations.some(
    (i) => i.listing_slug === integration.id && i.status === 'ready'
  )
}

const isOAuthAppAuthorized = (
  projectData: ProjectOAuthIntegrationData,
  integration: IntegrationDefinition
) => {
  return (
    !!integration.oauthAppId &&
    projectData.oauthApps.some((app) => app.app_id === integration.oauthAppId)
  )
}

const isSecretKeyPrefixPresent = (projectData: ProjectOAuthIntegrationData, prefix?: string) => {
  if (!prefix) return false
  return projectData.apiKeys.some((key) => key.type === 'secret' && key.name.startsWith(prefix))
}

const isEdgeFunctionSecretPresent = (
  projectData: ProjectOAuthIntegrationData,
  secretName?: string
) => {
  if (!secretName) return false
  return projectData.edgeFunctionSecrets.some((secret) => secret.name === secretName)
}

export const isOAuthInstalled = ({
  integration,
  projectData,
}: {
  integration: IntegrationDefinition
  projectData: ProjectOAuthIntegrationData
}) => {
  // Special-case logic for in-development integrations
  if (integration.id === 'resend') {
    return (
      projectData.authConfig?.SMTP_HOST === 'smtp.resend.com' &&
      // Keying off of OAuth App instead of integration status lets us show the integration as
      // installed for partner-initiated connections, without degrading the experience for
      // marketplace-initiated installations.
      isOAuthAppAuthorized(projectData, integration)
    )
  }

  if (integration.id === 'grafana') {
    // Grafana is not yet sending integration status, so just use presence of API key.
    return (
      isOAuthAppAuthorized(projectData, integration) ||
      isSecretKeyPrefixPresent(projectData, 'grafana_cloud_integration_')
    )
  }

  if (integration.id === 'aikido') {
    return isOAuthAppAuthorized(projectData, integration)
  }

  if (integration.id === 'doppler') {
    return (
      isOAuthAppAuthorized(projectData, integration) ||
      isEdgeFunctionSecretPresent(projectData, 'DOPPLER_CONFIG') ||
      isPartnerIntegrationReady(projectData, integration)
    )
  }

  // Fallback logic for generic OAuth integrations.
  if (integration.installIdentificationMethod === 'integration_status') {
    return isPartnerIntegrationReady(projectData, integration)
  }

  if (integration.installIdentificationMethod === 'oauth_authorization') {
    return isOAuthAppAuthorized(projectData, integration)
  }

  // Special-case logic that is still encoded as database fields, consider removing.
  if (integration.installIdentificationMethod === 'secret_key_prefix') {
    return isSecretKeyPrefixPresent(projectData, integration.secretKeyPrefix)
  }

  if (integration.installIdentificationMethod === 'edge_function_secret_name') {
    return isEdgeFunctionSecretPresent(projectData, integration.edgeFunctionSecretName)
  }

  return false
}

/**
 * A resource associated with a specific integration provisions that can be managed by the user
 */
export type ConnectedResource =
  | { kind: 'oauth_app'; key: string; title: string; description: string; app: AuthorizedApp }
  | { kind: 'api_key'; key: string; title: string; description: string; apiKey: APIKey }
  | {
      kind: 'edge_function_secret'
      key: string
      title: string
      description: string
      secret: ProjectSecret
    }
  | { kind: 'smtp'; key: string; title: string; description: string }

export type ConnectedResourceKind = ConnectedResource['kind']

/**
 * Integration-specific copy that explains how a particular partner uses a kind of connected
 * resource. When present it replaces the generic, kind-level copy shown on the integration's
 * settings tab so users understand what the resource does for that integration specifically
 * (e.g. that Grafana uses a secret API key to read project metrics).
 */
export type ConnectedResourceUsage = {
  /** Explains how this integration uses the resource. Overrides the generic section description. */
  description?: string
  /** Describes the impact of removing the resource. Overrides the generic section note. */
  removalWarning?: string
  /**
   * Describes the impact of this resource being missing while the integration is otherwise still
   * connected. Shown in the resource's zero (missing) state. Overrides the generic absent note.
   */
  noteWhenAbsent?: string
}

type IntegrationResourceOverride = {
  secretKeyPrefix?: string
  edgeFunctionSecretName?: string
  resendSmtp?: boolean
  /** Per-resource-kind explanations of how this integration uses each connected resource. */
  usage?: Partial<Record<ConnectedResourceKind, ConnectedResourceUsage>>
}

/**
 * Temporary manual overrides for specific integrations.
 * TODO(integrations-team) to move logic to database
 * Complements the special-case logic in {@link isOAuthInstalled}.
 */
const INTEGRATION_RESOURCE_OVERRIDES: Record<string, IntegrationResourceOverride> = {
  grafana: {
    secretKeyPrefix: 'grafana_cloud_integration_',
    usage: {
      oauth_app: {
        description:
          'Grants Grafana access to your organization so it can discover projects to monitor.',
      },
      api_key: {
        description:
          'Grafana uses this secret API key to read your project metrics from the Prometheus-compatible metrics endpoint.',
        removalWarning:
          'Removing this key stops Grafana from collecting metrics from your project until a new key is connected.',
        noteWhenAbsent:
          'No secret API key is connected for Grafana to read your project metrics. Dashboards will not receive data without one.',
      },
    },
  },
  doppler: {
    edgeFunctionSecretName: 'DOPPLER_CONFIG',
    usage: {
      oauth_app: {
        description:
          'Grants Doppler access to your organization so it can update secrets in your projects.',
        noteWhenAbsent:
          'Doppler does not have access to update secrets in your project. Any changes you make to secrets in Doppler will not be reflected in your project until access is granted.',
      },
      edge_function_secret: {
        description:
          'Doppler syncs your managed secrets into this Edge Function secret so they are available to your functions at runtime.',
        removalWarning:
          'Connected secrets that are removed while this integration is active may be resynced if still present in Doppler.',
        noteWhenAbsent: 'No Edge Function secrets were found connected to this integration.',
      },
    },
  },
  resend: {
    resendSmtp: true,
    usage: {
      oauth_app: {
        description:
          'Grants Resend access to manage the custom SMTP configuration used to send your project emails.',
      },
      smtp: {
        description:
          'Resend is configured as the custom SMTP relay your project uses to deliver authentication and transactional emails.',
        noteWhenAbsent:
          "SMTP settings for Resend were not detected. Authentication emails may not be sent through Resend's SMTP service.",
      },
    },
  },
}

/**
 * The connected resource kinds an integration is expected to provision, in display order. Derived
 * from the same identifiers used by {@link getConnectedResources} and {@link isOAuthInstalled} so
 * the settings tab can render a zero (missing) state for any expected resource that is absent.
 */
export const getExpectedResourceKinds = (
  integration: IntegrationDefinition
): ConnectedResourceKind[] => {
  const overrides = INTEGRATION_RESOURCE_OVERRIDES[integration.id] ?? {}
  const kinds: ConnectedResourceKind[] = []

  if (integration.oauthAppId) kinds.push('oauth_app')
  if (overrides.secretKeyPrefix ?? integration.secretKeyPrefix) kinds.push('api_key')
  if (overrides.edgeFunctionSecretName ?? integration.edgeFunctionSecretName) {
    kinds.push('edge_function_secret')
  }
  if (overrides.resendSmtp) kinds.push('smtp')

  return kinds
}

/**
 * Returns the integration-specific usage copy for a connected resource kind, if one has been
 * defined in {@link INTEGRATION_RESOURCE_OVERRIDES}. Callers fall back to generic, kind-level
 * copy when this returns `undefined`.
 */
export const getConnectedResourceUsage = (
  integrationId: string,
  kind: ConnectedResourceKind
): ConnectedResourceUsage | undefined =>
  INTEGRATION_RESOURCE_OVERRIDES[integrationId]?.usage?.[kind]

/**
 * Collects every resource an OAuth integration has provisioned on the current project/organization
 * so it can be displayed and removed from the integration's settings tab. Keyed off the same data
 * and identifiers used by {@link isOAuthInstalled}.
 */
export const getConnectedResources = ({
  integration,
  projectData,
}: {
  integration: IntegrationDefinition
  projectData: ProjectOAuthIntegrationData
}): ConnectedResource[] => {
  const overrides = INTEGRATION_RESOURCE_OVERRIDES[integration.id] ?? {}
  const resources: ConnectedResource[] = []

  // OAuth apps
  if (integration.oauthAppId) {
    const app = projectData.oauthApps.find((a) => a.app_id === integration.oauthAppId)
    if (app) {
      resources.push({
        kind: 'oauth_app',
        key: `oauth_app:${app.id}`,
        title: 'OAuth application',
        description: `Grants ${integration.name} access to your organization and its projects.`,
        app,
      })
    }
  }

  // Secret API keys
  const secretKeyPrefix = overrides.secretKeyPrefix ?? integration.secretKeyPrefix
  if (secretKeyPrefix) {
    projectData.apiKeys
      .filter((key) => key.type === 'secret' && key.name.startsWith(secretKeyPrefix))
      .forEach((apiKey) => {
        resources.push({
          kind: 'api_key',
          key: `api_key:${apiKey.id}`,
          title: 'Secret API key',
          description: apiKey.name,
          apiKey,
        })
      })
  }

  // Edge Function secrets
  const edgeFunctionSecretName =
    overrides.edgeFunctionSecretName ?? integration.edgeFunctionSecretName
  if (edgeFunctionSecretName) {
    const secret = projectData.edgeFunctionSecrets.find((s) => s.name === edgeFunctionSecretName)
    if (secret) {
      resources.push({
        kind: 'edge_function_secret',
        key: `edge_function_secret:${secret.name}`,
        title: 'Edge Function secret',
        description: secret.name,
        secret,
      })
    }
  }

  // Custom SMTP relay
  if (overrides.resendSmtp && projectData.authConfig?.SMTP_HOST === 'smtp.resend.com') {
    resources.push({
      kind: 'smtp',
      key: 'smtp',
      title: 'SMTP settings',
      description: `Custom SMTP relay configured to send project emails through ${integration.name}.`,
    })
  }

  return resources
}

export const hasMatchingWrapper = ({ meta, wrappers }: { meta: WrapperMeta; wrappers: FDW[] }) => {
  return wrappers.find((w) => wrapperMetaComparator(meta, w))
}

export const hasRequiredExtensions = ({
  integration,
  extensions,
}: {
  integration: IntegrationDefinition
  extensions: DatabaseExtension[]
}) => {
  return integration.requiredExtensions.every((extName) => {
    const foundExtension = extensions.find((ext) => ext.name === extName)
    return !!foundExtension?.installed_version
  })
}
