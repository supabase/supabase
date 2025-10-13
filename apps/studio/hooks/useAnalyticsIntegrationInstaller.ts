import { useParams } from 'common'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useIcebergWrapperCreateMutation } from 'data/storage/iceberg-wrapper-create-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
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

  const installIntegrations = async () => {
    if (!ref) {
      toast.error('Project reference is required')
      return
    }

    try {
      // Find the wrappers extension
      const wrappersExtension = extensions?.find((ext) => ext.name === 'wrappers')

      // Install wrappers extension if not already installed
      if (!wrappersExtension?.installed_version) {
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

      // Install Iceberg Wrapper integration
      await createIcebergWrapper({ bucketName: 'default' })

      toast.success('Successfully installed analytics integrations')
    } catch (error: any) {
      toast.error(`Failed to install integrations: ${error.message}`)
    }
  }

  return {
    installIntegrations,
    isLoading: isEnablingExtension || isCreatingIcebergWrapper,
  }
}
