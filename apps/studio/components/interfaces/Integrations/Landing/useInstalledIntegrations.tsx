import { useMemo } from 'react'

import {
  hasMatchingWrapper,
  hasRequiredExtensions,
  isOAuthInstalled,
  isStripeSyncEngineInstalled,
} from './Landing.utils'
import { useAvailableIntegrations } from './useAvailableIntegrations'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useFDWsQuery } from '@/data/fdw/fdws-query'
import { useAuthorizedAppsQuery } from '@/data/oauth/authorized-apps-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { EMPTY_ARR } from '@/lib/void'

export const useInstalledIntegrations = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const {
    data: allIntegrations = EMPTY_ARR,
    error: availableIntegrationsError,
    isPending: isAvailableIntegrationsLoading,
    isSuccess: isSuccessAvailableIntegrations,
    isError: isErrorAvailableIntegrations,
  } = useAvailableIntegrations()

  const hasOAuthIntegration = useMemo(() => {
    return allIntegrations.some(
      (integration) => integration.type === 'oauth' && !!integration.oauthClientId
    )
  }, [allIntegrations])

  const {
    data: authorizedApps = EMPTY_ARR,
    error: authorizedAppsError,
    isError: isErrorAuthorizedApps,
    isLoading: isAuthorizedAppsLoading,
    isSuccess: isSuccessAuthorizedApps,
  } = useAuthorizedAppsQuery(
    { slug: organization?.slug },
    { enabled: hasOAuthIntegration && !!organization?.slug }
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
          return isOAuthInstalled({ integration, authorizedApps })
        }
        return false
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allIntegrations, wrappers, extensions, schemas, isHooksEnabled, authorizedApps])

  const error =
    fdwError ||
    extensionsError ||
    schemasError ||
    availableIntegrationsError ||
    (hasOAuthIntegration ? authorizedAppsError : null)
  const isLoading =
    isSchemasLoading ||
    isFDWLoading ||
    isExtensionsLoading ||
    isAvailableIntegrationsLoading ||
    (hasOAuthIntegration && isAuthorizedAppsLoading)
  const isError =
    isErrorFDWs ||
    isErrorExtensions ||
    isErrorSchemas ||
    isErrorAvailableIntegrations ||
    (hasOAuthIntegration && isErrorAuthorizedApps)
  const isSuccess =
    isSuccessFDWs &&
    isSuccessExtensions &&
    isSuccessSchemas &&
    isSuccessAvailableIntegrations &&
    (!hasOAuthIntegration || isSuccessAuthorizedApps)

  return {
    // show all integrations at once instead of showing partial results
    installedIntegrations: isLoading ? EMPTY_ARR : installedIntegrations,
    error,
    isError,
    isLoading,
    isSuccess,
  }
}
