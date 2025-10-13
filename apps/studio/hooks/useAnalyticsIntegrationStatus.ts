import { WRAPPERS } from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import { useIcebergWrapperExtension } from 'components/interfaces/Storage/AnalyticBucketDetails/useIcebergWrapper'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import { useMemo } from 'react'

export type AnalyticsIntegrationStatus = {
  isLoading: boolean
  icebergCatalogEnabled: boolean
  extensionState: 'loading' | 'installed' | 'not-installed' | 'needs-upgrade' | 'not-found'
  needsWrappersExtension: boolean
  needsIcebergWrapper: boolean
  canCreateBuckets: boolean
  canQueryData: boolean
  // Installation context
  installationContext: {
    canAutoInstall: boolean // Can we install automatically (new nodal bucket context)
    requiresUserAction: boolean // Does user need to explicitly install (other contexts)
    installationMessage: string // Contextual message about installation
  }
}

export const useAnalyticsIntegrationStatus = (
  context: 'modal' | 'page' | 'bucket' = 'page'
): AnalyticsIntegrationStatus => {
  const { data: project } = useSelectedProjectQuery()

  const { data: storageConfig } = useProjectStorageConfigQuery(
    { projectRef: project?.ref },
    { enabled: IS_PLATFORM }
  )

  const { data: extensions, isLoading: isExtensionsLoading } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: fdws, isLoading: isFDWsLoading } = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const extensionState = useIcebergWrapperExtension()

  const icebergCatalogEnabled = storageConfig?.features?.icebergCatalog?.enabled ?? false

  // Check if wrappers extension is installed
  const wrappersExtension = extensions?.find((ext) => ext.name === 'wrappers')
  const isWrappersExtensionInstalled = !!wrappersExtension?.installed_version
  // const isWrappersExtensionInstalled = false // Debugging

  // Check if Iceberg Wrapper integration is installed
  const icebergWrapperMeta = WRAPPERS.find((w) => w.name === 'iceberg_wrapper')
  const isIcebergWrapperInstalled = icebergWrapperMeta
    ? fdws?.some((fdw) => wrapperMetaComparator(icebergWrapperMeta, fdw))
    : false
  // const isIcebergWrapperInstalled = false // Debugging

  const isLoading = isExtensionsLoading || isFDWsLoading

  const needsWrappersExtension = !isWrappersExtensionInstalled
  const needsIcebergWrapper = !isIcebergWrapperInstalled

  const canCreateBuckets = icebergCatalogEnabled && extensionState === 'installed'
  const canQueryData = extensionState === 'installed'

  const installationContext = useMemo(() => {
    if (extensionState === 'installed') {
      return {
        canAutoInstall: false,
        requiresUserAction: false,
        installationMessage: '',
      }
    }

    // Determine what specifically needs to be installed
    const needsBoth = needsWrappersExtension && needsIcebergWrapper
    const needsOnlyWrappers = needsWrappersExtension && !needsIcebergWrapper
    const needsOnlyIceberg = !needsWrappersExtension && needsIcebergWrapper

    if (needsBoth) {
      return {
        canAutoInstall: context === 'modal',
        requiresUserAction: context !== 'modal',
        installationMessage:
          context === 'modal'
            ? 'Supabase will install the Wrappers extension and Iceberg Wrapper integration on your behalf.'
            : 'The Wrappers extension and Iceberg Wrapper integration are required for querying analytics tables.',
      }
    }

    if (needsOnlyWrappers) {
      return {
        canAutoInstall: context === 'modal',
        requiresUserAction: context !== 'modal',
        installationMessage:
          context === 'modal'
            ? 'Supabase will install the Wrappers extension on your behalf.'
            : 'The Wrappers extension is required to query analytics tables.',
      }
    }

    if (needsOnlyIceberg) {
      return {
        canAutoInstall: context === 'modal',
        requiresUserAction: context !== 'modal',
        installationMessage:
          context === 'modal'
            ? 'Supabase will install the Iceberg Wrapper integration on your behalf.'
            : 'The Iceberg Wrapper integration is required to query analytics tables.',
      }
    }

    return {
      canAutoInstall: false,
      requiresUserAction: false,
      installationMessage: '',
    }
  }, [extensionState, needsWrappersExtension, needsIcebergWrapper, context])

  return {
    isLoading,
    icebergCatalogEnabled,
    extensionState,
    needsWrappersExtension,
    needsIcebergWrapper,
    canCreateBuckets,
    canQueryData,
    installationContext,
  }
}
