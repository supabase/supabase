import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM } from 'common'

import { useLocalS3KeysQuery } from '../misc/local-s3-keys-query'
import { useS3AccessKeyCreateMutation } from './s3-access-key-create-mutation'
import { WRAPPERS } from '@/components/interfaces/Integrations/Wrappers/Wrappers.constants'
import { getVectorURI } from '@/components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import {
  getVectorBucketFDWName,
  getVectorBucketFDWServerName,
  getVectorBucketS3KeyName,
} from '@/components/interfaces/Storage/VectorBuckets/VectorBuckets.utils'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { FDWCreateVariables, useFDWCreateMutation } from '@/data/fdw/fdw-create-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useDeploymentMode } from '@/hooks/misc/useDeploymentMode'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const useS3VectorsWrapperCreateMutation = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: localKeys } = useLocalS3KeysQuery()
  const { isPlatform } = useDeploymentMode()

  const { data: settings } = useProjectSettingsV2Query({ projectRef: project?.ref })
  const protocol = settings?.app_config?.protocol ?? 'https'

  /**
   * [Joshen] Endpoint for vectors FDW needs to use docker domain
   * Not sure if this affects other areas of the dashboard hence why conditionally rendering here
   * instead of updating `lib/api/self-hosted/settings -> api_config`
   */
  const port =
    !isPlatform && !!settings
      ? new URL(`${protocol}://${settings.app_config?.endpoint}`).port
      : null
  const endpoint = !isPlatform
    ? `host.docker.internal:${port}`
    : settings?.app_config?.storage_endpoint || settings?.app_config?.endpoint

  const wrapperMeta = WRAPPERS.find((wrapper) => wrapper.name === 's3_vectors_wrapper')

  const { can: canCreateCredentials } = useAsyncCheckPermissions(
    PermissionAction.STORAGE_ADMIN_WRITE,
    '*'
  )

  const { mutateAsync: createS3AccessKey, isPending: isCreatingS3AccessKey } =
    useS3AccessKeyCreateMutation()

  // [Joshen] Silence the error, handled upstream
  const { mutateAsync: createFDW, isPending: isCreatingFDW } = useFDWCreateMutation({
    onError: () => {},
  })

  const mutateAsync = async ({ bucketName }: { bucketName: string }) => {
    let accessKey: string | undefined
    let secretKey: string | undefined

    if (IS_PLATFORM) {
      const createS3KeyData = await createS3AccessKey({
        projectRef: project?.ref,
        description: getVectorBucketS3KeyName(bucketName),
      })
      accessKey = createS3KeyData.access_key
      secretKey = createS3KeyData.secret_key
    } else {
      accessKey = localKeys?.accessKey
      secretKey = localKeys?.secretKey
    }

    if (!accessKey || !secretKey) {
      throw new Error(
        IS_PLATFORM ? 'Failed to obtain S3 keys from the API' : 'Local S3 keys are not configured'
      )
    }

    const wrapperName = getVectorBucketFDWName(bucketName)
    const serverName = getVectorBucketFDWServerName(bucketName)

    const params: FDWCreateVariables = {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      wrapperMeta: wrapperMeta!,
      formState: {
        wrapper_name: wrapperName,
        server_name: serverName,
        vault_access_key_id: accessKey,
        vault_secret_access_key: secretKey,
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
