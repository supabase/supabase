import { wrapperMetaComparator } from 'components/interfaces/Database/Wrappers/Wrappers.utils'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { INTEGRATIONS } from './Integrations.constants'

export const useInstalledIntegrations = () => {
  const project = useSelectedProject()
  const { data, isLoading: isFDWLoading } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: extensions, isLoading: isExtensionsLoading } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: schemas, isLoading: isSchemasLoading } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isHooksEnabled = schemas?.some((schema) => schema.name === 'supabase_functions')

  const wrappers = data?.result || []

  const installedIntegrationsIds = INTEGRATIONS.filter((i) => {
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
  }).map((i) => i.id)

  return {
    installedIntegrations: installedIntegrationsIds,
    isLoading: isSchemasLoading || isFDWLoading || isExtensionsLoading,
  }
}
