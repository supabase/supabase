import { useMemo } from 'react'
import { parseSchemaComment } from 'stripe-experiment-sync/supabase'

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
    return isSecretKeyPrefixPresent(projectData, 'grafana_cloud_integration_')
  }

  if (integration.id === 'aikido') {
    return isOAuthAppAuthorized(projectData, integration)
  }

  if (integration.id === 'doppler') {
    return (
      isEdgeFunctionSecretPresent(projectData, 'DOPPLER_CONFIG') &&
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
