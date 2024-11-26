import { useMemo } from 'react'

import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { EMPTY_ARR } from 'lib/void'
import { wrapperMetaComparator } from '../Wrappers/Wrappers.utils'
import { INTEGRATIONS } from './Integrations.constants'

export const useInstalledIntegrations = () => {
  const project = useSelectedProject()

  const {
    data,
    error: fdwError,
    isError: isErrorFDWs,
    isLoading: isFDWLoading,
    isSuccess: isSuccessFDWs,
  } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const {
    data: extensions,
    error: extensionsError,
    isError: isErrorExtensions,
    isLoading: isExtensionsLoading,
    isSuccess: isSuccessExtensions,
  } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const {
    data: schemas,
    error: schemasError,
    isError: isErrorSchemas,
    isLoading: isSchemasLoading,
    isSuccess: isSuccessSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isHooksEnabled = schemas?.some((schema) => schema.name === 'supabase_functions')
  const wrappers = useMemo(() => data ?? EMPTY_ARR, [data])

  const installedIntegrations = useMemo(() => {
    return INTEGRATIONS.filter((i) => {
      // special handling for supabase webhooks
      if (i.id === 'webhooks') {
        return isHooksEnabled
      }
      if (i.type === 'wrapper') {
        return wrappers.find((w) => wrapperMetaComparator(i.meta, w))
      }
      if (i.type === 'postgres_extension') {
        return i.requiredExtensions.every((extName) => {
          const foundExtension = (extensions ?? []).find((ext) => ext.name === extName)
          return !!foundExtension?.installed_version
        })
      }
      return false
    }).sort((a, b) => a.name.localeCompare(b.name))
  }, [wrappers, extensions, isHooksEnabled])

  // available integrations are all integrations that can be installed. If an extension is on available to be installed
  // on the project, that integration is hidden.
  const availableIntegrations = useMemo(() => {
    return INTEGRATIONS.filter((i) => {
      // special handling for supabase webhooks
      if (i.id === 'webhooks') {
        return true
      }
      if (i.type === 'wrapper') {
        return true
      }
      if (i.type === 'postgres_extension') {
        return i.requiredExtensions.every((extName) => {
          const foundExtension = (extensions ?? []).find((ext) => ext.name === extName)
          return !!foundExtension
        })
      }
      return false
    }).sort((a, b) => a.name.localeCompare(b.name))
  }, [extensions])

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
