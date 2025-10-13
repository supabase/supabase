import { WRAPPERS } from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import { wrapperMetaComparator } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
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

  // Check if Iceberg Wrapper integration is installed
  const icebergWrapperMeta = WRAPPERS.find((w) => w.name === 'iceberg_wrapper')
  const isIcebergWrapperInstalled = icebergWrapperMeta
    ? fdws?.some((fdw) => wrapperMetaComparator(icebergWrapperMeta, fdw))
    : false

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

    if (needsWrappersExtension) {
      return {
        canAutoInstall: context === 'modal', // Only modal can auto-install
        requiresUserAction: context !== 'modal', // Pages require user action
        installationMessage:
          context === 'modal'
            ? 'Supabase will install these on your behalf.'
            : 'Please install the required extensions to continue.',
      }
    }

    if (needsIcebergWrapper) {
      return {
        canAutoInstall: context === 'modal',
        requiresUserAction: context !== 'modal',
        installationMessage:
          context === 'modal'
            ? 'Supabase will install it on your behalf.'
            : 'Please install the Iceberg Wrapper integration to continue.',
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
