import { useParams } from 'common'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useIcebergWrapperCreateMutation } from 'data/storage/iceberg-wrapper-create-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useAnalyticsIntegrationStatus } from 'hooks/useAnalyticsIntegrationStatus'
import { toast } from 'sonner'

export const useAnalyticsIntegrationInstaller = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: ref,
    connectionString: project?.connectionString,
  })

  const { mutateAsync: enableExtension, isLoading: isEnablingExtension } =
    useDatabaseExtensionEnableMutation()
  const { mutateAsync: createIcebergWrapper, isLoading: isCreatingIcebergWrapper } =
    useIcebergWrapperCreateMutation()

  // Get current integration status to determine what needs to be installed
  const { needsWrappersExtension, needsIcebergWrapper } = useAnalyticsIntegrationStatus('page')

  const installIntegrations = async () => {
    if (!ref) {
      toast.error('Project reference is required')
      return
    }

    try {
      // Install wrappers extension if needed
      if (needsWrappersExtension) {
        const wrappersExtension = extensions?.find((ext) => ext.name === 'wrappers')

        await enableExtension({
          projectRef: ref,
          connectionString: undefined,
          name: 'wrappers',
          schema: 'extensions',
          version: wrappersExtension?.default_version || '1.0',
          cascade: true,
          createSchema: false,
        })
        toast.success('Successfully installed wrappers extension')
      }

      // Install Iceberg Wrapper integration if needed
      if (needsIcebergWrapper) {
        await createIcebergWrapper({ bucketName: 'default' })
        toast.success('Successfully installed Iceberg Wrapper integration')
      }

      // Show appropriate success message based on what was installed
      if (needsWrappersExtension && needsIcebergWrapper) {
        toast.success('Successfully installed all required analytics integrations')
      } else if (needsWrappersExtension) {
        toast.success('Successfully installed wrappers extension')
      } else if (needsIcebergWrapper) {
        toast.success('Successfully installed Iceberg Wrapper integration')
      }
    } catch (error: any) {
      toast.error(`Failed to install integrations: ${error.message}`)
    }
  }

  return {
    installIntegrations,
    isLoading: isEnablingExtension || isCreatingIcebergWrapper,
  }
}
