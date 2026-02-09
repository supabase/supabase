import { PermissionAction } from '@supabase/shared-types/out/constants'

import { WRAPPERS } from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import { getVectorURI } from 'components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import {
  getVectorBucketFDWName,
  getVectorBucketFDWServerName,
  getVectorBucketS3KeyName,
} from 'components/interfaces/Storage/VectorBuckets/VectorBuckets.utils'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { FDWCreateVariables, useFDWCreateMutation } from 'data/fdw/fdw-create-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useS3AccessKeyCreateMutation } from './s3-access-key-create-mutation'

export const useS3VectorsWrapperCreateMutation = () => {
  const { data: project } = useSelectedProjectQuery()

  const { data: settings } = useProjectSettingsV2Query({ projectRef: project?.ref })
  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.storage_endpoint || settings?.app_config?.endpoint

  const wrapperMeta = WRAPPERS.find((wrapper) => wrapper.name === 's3_vectors_wrapper')

  const { can: canCreateCredentials } = useAsyncCheckPermissions(
    PermissionAction.STORAGE_ADMIN_WRITE,
    '*'
  )

  const { mutateAsync: createS3AccessKey, isPending: isCreatingS3AccessKey } =
    useS3AccessKeyCreateMutation()

  const { mutateAsync: createFDW, isPending: isCreatingFDW } = useFDWCreateMutation()

  const mutateAsync = async ({ bucketName }: { bucketName: string }) => {
    const createS3KeyData = await createS3AccessKey({
      projectRef: project?.ref,
      description: getVectorBucketS3KeyName(bucketName),
    })

    const wrapperName = getVectorBucketFDWName(bucketName)
    const serverName = getVectorBucketFDWServerName(bucketName)

    const params: FDWCreateVariables = {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      wrapperMeta: wrapperMeta!,
      formState: {
        wrapper_name: wrapperName,
        server_name: serverName,
        vault_access_key_id: createS3KeyData?.access_key,
        vault_secret_access_key: createS3KeyData?.secret_key,
        aws_region: settings!.region,
        endpoint_url: getVectorURI(project?.ref ?? '', protocol, endpoint),
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
    isPending: isCreatingFDW || isCreatingS3AccessKey,
    hasPermission: canCreateCredentials,
  }
}
