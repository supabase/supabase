import { PermissionAction } from '@supabase/shared-types/out/constants'

import { WRAPPERS } from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import {
  getCatalogURI,
  getConnectionURL,
} from 'components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import {
  useIsProjectActive,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { FDWCreateVariables, useFDWCreateMutation } from 'data/fdw/fdw-create-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { snakeCase } from 'lodash'
import { useS3AccessKeyCreateMutation } from './s3-access-key-create-mutation'

export const useIcebergWrapperCreateMutation = () => {
  const { project } = useProjectContext()

  const { data: apiKeys } = useAPIKeysQuery({ projectRef: project?.ref })
  const { serviceKey } = getKeys(apiKeys)

  const { data: settings } = useProjectSettingsV2Query({ projectRef: project?.ref })
  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint

  const serviceApiKey = serviceKey?.api_key ?? 'SUPABASE_CLIENT_SERVICE_KEY'

  const wrapperMeta = WRAPPERS.find((wrapper) => wrapper.name === 'iceberg_wrapper')

  const isProjectActive = useIsProjectActive()

  const canCreateCredentials = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  const { data: config } = useProjectStorageConfigQuery({ projectRef: project?.ref })
  const isS3ConnectionEnabled = config?.features.s3Protocol.enabled
  const disableCreation = !isProjectActive || !canCreateCredentials || !isS3ConnectionEnabled

  const { mutateAsync: createS3AccessKey, isLoading: isCreatingS3AccessKey } =
    useS3AccessKeyCreateMutation()

  const { mutateAsync: createFDW, isLoading: isCreatingFDW } = useFDWCreateMutation()

  const mutateAsync = async ({ bucketName }: { bucketName: string }) => {
    const createS3KeyData = await createS3AccessKey({
      projectRef: project?.ref,
      description: `${snakeCase(bucketName)}_keys`,
    })

    const wrapperName = `${snakeCase(bucketName)}_fdw`

    const params: FDWCreateVariables = {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      wrapperMeta: wrapperMeta!,
      formState: {
        wrapper_name: wrapperName,
        server_name: `${wrapperName}_server`,
        vault_aws_access_key_id: createS3KeyData?.access_key,
        vault_aws_secret_access_key: createS3KeyData?.secret_key,
        vault_token: serviceApiKey,
        warehouse: bucketName,
        's3.endpoint': getConnectionURL(project?.ref ?? '', protocol, endpoint),
        catalog_uri: getCatalogURI(project?.ref ?? '', protocol, endpoint),
      },
      mode: 'skip',
      tables: [],
      sourceSchema: '',
      targetSchema: '',
    }

    await createFDW(params)
  }

  return {
    mutateAsync,
    isLoading: isCreatingFDW || isCreatingS3AccessKey,
    hasPermission: canCreateCredentials,
  }
}
