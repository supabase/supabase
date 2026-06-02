import { useMemo } from 'react'

import {
  hasMatchingWrapper,
  hasRequiredExtensions,
  isOAuthInstalled,
  isStripeSyncEngineInstalled,
} from './Landing.utils'
import { useAvailableIntegrations } from './useAvailableIntegrations'
import { useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useFDWsQuery } from '@/data/fdw/fdws-query'
import { useSecretsQuery } from '@/data/secrets/secrets-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { EMPTY_ARR } from '@/lib/void'

export const useInstalledIntegrations = () => {
  const { data: project } = useSelectedProjectQuery()

  const {
    data: allIntegrations = EMPTY_ARR,
    error: availableIntegrationsError,
    isPending: isAvailableIntegrationsLoading,
    isSuccess: isSuccessAvailableIntegrations,
    isError: isErrorAvailableIntegrations,
  } = useAvailableIntegrations()

  const hasSecretKeyPrefixIntegration = useMemo(() => {
    return allIntegrations.some(
      (integration) =>
        integration.type === 'oauth' &&
        integration.installIdentificationMethod === 'secret_key_prefix' &&
        !!integration.secretKeyPrefix
    )
  }, [allIntegrations])

  const hasEdgeFunctionSecretNameIntegration = useMemo(() => {
    return allIntegrations.some(
      (integration) =>
        integration.type === 'oauth' &&
        integration.installIdentificationMethod === 'edge_function_secret_name' &&
        !!integration.edgeFunctionSecretName
    )
  }, [allIntegrations])

  const {
    data: apiKeys = EMPTY_ARR,
    error: apiKeysError,
    isError: isErrorApiKeys,
    isLoading: isApiKeysLoading,
    isSuccess: isSuccessApiKeys,
  } = useAPIKeysQuery(
    { projectRef: project?.ref, reveal: false },
    { enabled: hasSecretKeyPrefixIntegration }
  )

  const {
    data: edgeFunctionSecrets = EMPTY_ARR,
    error: edgeFunctionSecretsError,
    isError: isErrorEdgeFunctionSecrets,
    isLoading: isEdgeFunctionSecretsLoading,
    isSuccess: isSuccessEdgeFunctionSecrets,
  } = useSecretsQuery(
    { projectRef: project?.ref },
    { enabled: hasEdgeFunctionSecretNameIntegration }
  )

  const {
    data: wrappers = EMPTY_ARR,
    error: fdwError,
    isError: isErrorFDWs,
    isPending: isFDWLoading,
    isSuccess: isSuccessFDWs,
  } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const {
    data: extensions = EMPTY_ARR,
    error: extensionsError,
    isError: isErrorExtensions,
    isPending: isExtensionsLoading,
    isSuccess: isSuccessExtensions,
  } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const {
    data: schemas = EMPTY_ARR,
    error: schemasError,
    isError: isErrorSchemas,
    isPending: isSchemasLoading,
    isSuccess: isSuccessSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isHooksEnabled = schemas?.some((schema) => schema.name === 'supabase_functions')

  const installedIntegrations = useMemo(() => {
    return allIntegrations
      .filter((integration) => {
        if (integration.id === 'webhooks') return isHooksEnabled
        if (integration.id === 'data_api') return true
        if (integration.id === 'stripe_sync_engine') {
          return isStripeSyncEngineInstalled(schemas)
        }
        if (integration.type === 'wrapper') {
          return hasMatchingWrapper({ meta: integration.meta, wrappers })
        }
        if (integration.type === 'postgres_extension') {
          return hasRequiredExtensions({ integration, extensions })
        }
        if (integration.type === 'oauth') {
          return isOAuthInstalled({ integration, apiKeys, secrets: edgeFunctionSecrets })
        }
        return false
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allIntegrations, wrappers, extensions, schemas, isHooksEnabled, apiKeys, edgeFunctionSecrets])

  const error =
    fdwError ||
    extensionsError ||
    schemasError ||
    availableIntegrationsError ||
    (hasSecretKeyPrefixIntegration ? apiKeysError : null) ||
    (hasEdgeFunctionSecretNameIntegration ? edgeFunctionSecretsError : null)
  const isLoading =
    isSchemasLoading ||
    isFDWLoading ||
    isExtensionsLoading ||
    isAvailableIntegrationsLoading ||
    (hasSecretKeyPrefixIntegration && isApiKeysLoading) ||
    (hasEdgeFunctionSecretNameIntegration && isEdgeFunctionSecretsLoading)
  const isError =
    isErrorFDWs ||
    isErrorExtensions ||
    isErrorSchemas ||
    isErrorAvailableIntegrations ||
    (hasSecretKeyPrefixIntegration && isErrorApiKeys) ||
    (hasEdgeFunctionSecretNameIntegration && isErrorEdgeFunctionSecrets)
  const isSuccess =
    isSuccessFDWs &&
    isSuccessExtensions &&
    isSuccessSchemas &&
    isSuccessAvailableIntegrations &&
    (!hasSecretKeyPrefixIntegration || isSuccessApiKeys) &&
    (!hasEdgeFunctionSecretNameIntegration || isSuccessEdgeFunctionSecrets)

  return {
    // show all integrations at once instead of showing partial results
    installedIntegrations: isLoading ? EMPTY_ARR : installedIntegrations,
    error,
    isError,
    isLoading,
    isSuccess,
  }
}
