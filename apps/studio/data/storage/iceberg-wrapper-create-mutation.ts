import { useQuery } from '@tanstack/react-query'

import { useS3AccessKeyCreateMutation } from './s3-access-key-create-mutation'
import { WRAPPERS } from '@/components/interfaces/Integrations/Wrappers/Wrappers.constants'
import {
  getAnalyticsBucketFDWServerName,
  getAnalyticsBucketS3KeyName,
} from '@/components/interfaces/Storage/AnalyticsBuckets/AnalyticsBucketDetails/AnalyticsBucketDetails.utils'
import {
  getCatalogURI,
  getConnectionURL,
} from '@/components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import { getKeys, revealedApiKeysQueryOptions } from '@/data/api-keys/api-keys-query'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { FDWCreateVariables, useFDWCreateMutation } from '@/data/fdw/fdw-create-mutation'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useGrant } from '@/lib/grants'

type ApiKeyState = 'ready' | 'loading' | 'error' | 'missing'

function getApiKeyState({
  hasApiKey,
  isError,
  hasData,
}: {
  hasApiKey: boolean
  isError: boolean
  hasData: boolean
}): ApiKeyState {
  if (hasApiKey) return 'ready'
  if (isError) return 'error'
  if (hasData) return 'missing'
  return 'loading'
}

export const useIcebergWrapperCreateMutation = () => {
  const { data: project } = useSelectedProjectQuery()

  // The wrapper's catalog token is a secret API key, so it needs the `reveal` grant
  const apiKeysGrant = useGrant(
    'GET /v1/projects/{ref}/api-keys',
    { projectRef: project?.ref },
    { variant: 'reveal' }
  )
  const { data: apiKeysData, isError: isApiKeysError } = useQuery(
    revealedApiKeysQueryOptions(
      { projectRef: project?.ref, grant: apiKeysGrant.grant },
      { select: getKeys }
    )
  )
  const { secretKey, serviceKey } = apiKeysData ?? {}
  const { data: settings } = useProjectSettingsV2Query({ projectRef: project?.ref })
  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.storage_endpoint || settings?.app_config?.endpoint

  const apiKey = secretKey?.api_key ?? serviceKey?.api_key
  // Only meaningful once the grant is `granted`; before that the grant itself explains why
  const apiKeyState = getApiKeyState({
    hasApiKey: Boolean(apiKey),
    isError: isApiKeysError,
    hasData: Boolean(apiKeysData),
  })

  const wrapperMeta = WRAPPERS.find((wrapper) => wrapper.name === 'iceberg_wrapper')

  const { can: canCreateCredentials } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.STORAGE_CONFIG_WRITE
  )

  const { mutateAsync: createS3AccessKey, isPending: isCreatingS3AccessKey } =
    useS3AccessKeyCreateMutation()

  const { mutateAsync: createFDW, isPending: isCreatingFDW } = useFDWCreateMutation()

  const mutateAsync = async ({ bucketName }: { bucketName: string }) => {
    // Without the keys the wrapper would be saved with a placeholder token that never works
    if (apiKeysGrant.status !== 'granted') {
      throw new Error(
        'You need additional permissions to view API keys, which are needed to create an Iceberg wrapper.'
      )
    }

    // Never fall back to a placeholder token: the wrapper would be created but never work
    if (!apiKey) {
      throw new Error(
        'Unable to load a secret API key, which is needed to create an Iceberg wrapper.'
      )
    }

    const createS3KeyData = await createS3AccessKey({
      projectRef: project?.ref,
      description: getAnalyticsBucketS3KeyName(bucketName),
    })

    const params: FDWCreateVariables = {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      wrapperMeta: wrapperMeta!,
      formState: {
        server_name: getAnalyticsBucketFDWServerName(bucketName),
        vault_aws_access_key_id: createS3KeyData?.access_key,
        vault_aws_secret_access_key: createS3KeyData?.secret_key,
        vault_token: apiKey,
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
    isPending: isCreatingFDW || isCreatingS3AccessKey,
    hasPermission: canCreateCredentials,
    /** Callers should block creation and explain when this isn't `granted`. */
    apiKeysGrant,
    /** True once the grant is `granted` and a usable secret key has been revealed. */
    isApiKeyReady: apiKeysGrant.status === 'granted' && apiKeyState === 'ready',
    /** Progress of revealing the key, for callers that explain why creation is blocked. */
    apiKeyState,
  }
}
