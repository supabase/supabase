import { useMemo } from 'react'

import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { useFlag } from 'common'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import { EMPTY_ARR } from 'lib/void'
import {
  INSTALLATION_INSTALLED_SUFFIX,
  STRIPE_SCHEMA_COMMENT_PREFIX,
} from 'stripe-experiment-sync/supabase'
import { wrapperMetaComparator } from '../Wrappers/Wrappers.utils'
import { INTEGRATIONS } from './Integrations.constants'

export const useInstalledIntegrations = () => {
  const { data: project } = useSelectedProjectQuery()
  const { integrationsWrappers } = useIsFeatureEnabled(['integrations:wrappers'])
  const stripeSyncEnabled = useFlag('enableStripeSyncEngineIntegration')

  const allIntegrations = useMemo(() => {
    return INTEGRATIONS.filter((integration) => {
      if (
        !integrationsWrappers &&
        (integration.type === 'wrapper' || integration.id.endsWith('_wrapper'))
      ) {
        return false
      }
      if (!stripeSyncEnabled && integration.id === 'stripe_sync_engine') {
        return false
      }
      if (!IS_PLATFORM && integration.id === 'data_api') {
        return false
      }
      return true
    })
  }, [integrationsWrappers, stripeSyncEnabled])

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
          const stripeSchema = schemas?.find(({ name }) => name === 'stripe')
          return (
            !!stripeSchema?.comment?.startsWith(STRIPE_SCHEMA_COMMENT_PREFIX) &&
            !!stripeSchema.comment?.includes(INSTALLATION_INSTALLED_SUFFIX)
          )
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
        return false
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allIntegrations, wrappers, extensions, schemas, isHooksEnabled])

  // available integrations are all integrations that can be installed. If an integration can't be installed (needed
  // extensions are not available on this DB image), the UI will provide a tooltip explaining why.
  const availableIntegrations = useMemo(
    () => allIntegrations.sort((a, b) => a.name.localeCompare(b.name)),
    [allIntegrations]
  )

  const error = fdwError || extensionsError || schemasError
  const isLoading = isSchemasLoading || isFDWLoading || isExtensionsLoading
  const isError = isErrorFDWs || isErrorExtensions || isErrorSchemas
  const isSuccess = isSuccessFDWs && isSuccessExtensions && isSuccessSchemas

  return {
    // show all integrations at once instead of showing partial results
    installedIntegrations: isLoading ? EMPTY_ARR : installedIntegrations,
    availableIntegrations: isLoading ? EMPTY_ARR : availableIntegrations,
    error,
    isError,
    isLoading,
    isSuccess,
  }
}
