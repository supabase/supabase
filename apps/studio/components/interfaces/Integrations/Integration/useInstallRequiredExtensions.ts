import { useMemo } from 'react'

import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { getExtensionDefaultSchema } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/IntegrationOverviewTabV2.utils'
import { useIntegrationDetail } from '@/components/interfaces/Integrations/Landing/useIntegrationDetail'
import { getRequiredExtensionsToInstall } from '@/components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { useDatabaseExtensionEnableMutation } from '@/data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

/**
 * Tracks which of the current integration's required extensions are not yet installed, and
 * exposes a function to install them. Only active when the marketplace flag is on.
 */
export const useInstallRequiredExtensions = () => {
  const isMarketplaceEnabled = useIsMarketplaceEnabled()
  const { integration } = useIntegrationDetail()
  const { data: project } = useSelectedProjectQuery()

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  // null while the query is in flight — distinct from [] which means "all installed"
  const requiredExtensionsToInstall = useMemo(
    () => getRequiredExtensionsToInstall(extensions, integration?.requiredExtensions ?? []),
    [extensions, integration?.requiredExtensions]
  )

  const needsExtensions = isMarketplaceEnabled && (requiredExtensionsToInstall?.length ?? 0) > 0
  const isExtensionDataLoading = isMarketplaceEnabled && requiredExtensionsToInstall === null

  const { mutateAsync: enableExtension } = useDatabaseExtensionEnableMutation({ onError: () => {} })

  const installRequiredExtensions = async () => {
    if (!project) return
    const { ref: projectRef, connectionString } = project
    const results = await Promise.allSettled(
      (requiredExtensionsToInstall ?? []).map((ext) => {
        const schema = getExtensionDefaultSchema(ext) ?? 'extensions'
        return enableExtension({
          projectRef,
          connectionString,
          schema,
          name: ext.name,
          version: ext.default_version,
          cascade: true,
          createSchema: false,
        })
      })
    )
    const failure = results.find((r) => r.status === 'rejected')
    if (failure) throw new Error((failure as PromiseRejectedResult).reason.message)
  }

  return {
    requiredExtensionsToInstall,
    needsExtensions,
    isExtensionDataLoading,
    installRequiredExtensions,
  }
}
