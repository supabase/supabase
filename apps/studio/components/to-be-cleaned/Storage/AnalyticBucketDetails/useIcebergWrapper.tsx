import { INTEGRATIONS } from 'components/interfaces/Integrations/Landing/Integrations.constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'

export const useIcebergWrapperExtension = () => {
  const { project } = useProjectContext()
  const { data: extensionsData, isLoading: isExtensionsLoading } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const integration = INTEGRATIONS.find((i) => i.id === 'iceberg_wrapper')

  if (!integration || integration.type !== 'wrapper') {
    // This should never happen
    return 'not-found'
  }

  const wrapperMeta = integration.meta

  const wrappersExtension = extensionsData?.find((ext) => ext.name === 'wrappers')
  const isWrappersExtensionInstalled = !!wrappersExtension?.installed_version
  const hasRequiredVersion =
    (wrappersExtension?.installed_version ?? '') >= (wrapperMeta?.minimumExtensionVersion ?? '')

  const state = isExtensionsLoading
    ? 'loading'
    : isWrappersExtensionInstalled
      ? hasRequiredVersion
        ? 'installed'
        : 'needs-upgrade'
      : ('not-installed' as const)

  return state
}
