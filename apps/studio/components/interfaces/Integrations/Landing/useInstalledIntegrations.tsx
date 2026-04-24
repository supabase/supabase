import { useMemo } from 'react'
import { parseSchemaComment } from 'stripe-experiment-sync/supabase'

import { wrapperMetaComparator } from '../Wrappers/Wrappers.utils'
import { useAvailableIntegrations } from './useAvailableIntegrations'
import {
  isInstalled as checkIsInstalled,
  findStripeSchema,
} from '@/components/interfaces/Integrations/templates/StripeSyncEngine/stripe-sync-status'
import { useAPIKeysQuery } from '@/data/api-keys/api-keys-query'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useFDWsQuery } from '@/data/fdw/fdws-query'
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

  const {
    data: apiKeys,
    error: apiKeysError,
    isError: isErrorApiKeys,
    isLoading: isApiKeysLoading,
    isSuccess: isSuccessApiKeys,
  } = useAPIKeysQuery(
    { projectRef: project?.ref, reveal: false },
    { enabled: !!project?.ref && hasSecretKeyPrefixIntegration }
  )

  const {
    data,
    error: fdwError,
    isError: isErrorFDWs,
    isPending: isFDWLoading,
    isSuccess: isSuccessFDWs,
  } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const {
    data: extensions,
    error: extensionsError,
    isError: isErrorExtensions,
    isPending: isExtensionsLoading,
    isSuccess: isSuccessExtensions,
  } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const {
    data: schemas,
    error: schemasError,
    isError: isErrorSchemas,
    isPending: isSchemasLoading,
    isSuccess: isSuccessSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isHooksEnabled = schemas?.some((schema) => schema.name === 'supabase_functions')
  const wrappers = useMemo(() => data ?? EMPTY_ARR, [data])

  const installedIntegrations = useMemo(() => {
    return allIntegrations
      .filter((integration) => {
        // special handling for supabase webhooks
        if (integration.id === 'webhooks') {
          return isHooksEnabled
        }
        if (integration.id === 'data_api') {
          return true
        }
        if (integration.id === 'stripe_sync_engine') {
          const stripeSchema = findStripeSchema(schemas)
          const parsedSchema = parseSchemaComment(stripeSchema?.comment)
          return checkIsInstalled(parsedSchema.status)
        }
        if (integration.type === 'wrapper') {
          return wrappers.find((w) => wrapperMetaComparator(integration.meta, w))
        }
        if (integration.type === 'postgres_extension') {
          return integration.requiredExtensions.every((extName) => {
            const foundExtension = (extensions ?? []).find((ext) => ext.name === extName)
            return !!foundExtension?.installed_version
          })
        }
        if (integration.type === 'oauth') {
          const prefix = integration.secretKeyPrefix

          if (integration.installIdentificationMethod !== 'secret_key_prefix' || !prefix) {
            return false
          }

          return (apiKeys ?? []).some((key) => key.type === 'secret' && key.name.startsWith(prefix))
        }
        return false
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allIntegrations, wrappers, extensions, schemas, isHooksEnabled, apiKeys])

  const error =
    fdwError ||
    extensionsError ||
    schemasError ||
    availableIntegrationsError ||
    (hasSecretKeyPrefixIntegration ? apiKeysError : null)
  const isLoading =
    isSchemasLoading ||
    isFDWLoading ||
    isExtensionsLoading ||
    isAvailableIntegrationsLoading ||
    (hasSecretKeyPrefixIntegration && isApiKeysLoading)
  const isError =
    isErrorFDWs ||
    isErrorExtensions ||
    isErrorSchemas ||
    isErrorAvailableIntegrations ||
    (hasSecretKeyPrefixIntegration && isErrorApiKeys)
  const isSuccess =
    isSuccessFDWs &&
    isSuccessExtensions &&
    isSuccessSchemas &&
    isSuccessAvailableIntegrations &&
    (!hasSecretKeyPrefixIntegration || isSuccessApiKeys)

  return {
    // show all integrations at once instead of showing partial results
    installedIntegrations: isLoading ? EMPTY_ARR : installedIntegrations,
    error,
    isError,
    isLoading,
    isSuccess,
  }
}
