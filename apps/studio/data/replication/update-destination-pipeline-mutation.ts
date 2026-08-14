import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from 'api-types'
import { toast } from 'sonner'

import {
  buildDucklakeApiConfig,
  buildPipelineApiConfig,
  DestinationConfig,
  PipelineConfig,
} from './create-destination-pipeline-mutation'
import { optionalSecret } from './destination-secret-utils'
import { replicationKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type UpdateDestinationPipelineParams = {
  destinationId: number
  pipelineId: number
  projectRef: string
  destinationName: string
  destinationConfig: DestinationConfig
  sourceId: number
  pipelineConfig: PipelineConfig
}

type UpdateDestinationPipelineBody =
  components['schemas']['UpdateReplicationDestinationPipelineBody']
type UpdateDestinationConfig = UpdateDestinationPipelineBody['destination_config']
type UpdatePipelineConfig = UpdateDestinationPipelineBody['pipeline_config']

async function updateDestinationPipeline(
  {
    destinationId: destinationId,
    pipelineId,
    projectRef,
    destinationName: destinationName,
    destinationConfig,
    pipelineConfig,
    sourceId,
  }: UpdateDestinationPipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  // Build destination_config based on the type
  let destination_config: UpdateDestinationConfig

  if ('bigQuery' in destinationConfig) {
    const { projectId, datasetId, serviceAccountKey, connectionPoolSize, maxStalenessMins } =
      destinationConfig.bigQuery
    destination_config = {
      big_query: {
        project_id: projectId,
        dataset_id: datasetId,
        service_account_key: optionalSecret(serviceAccountKey),
        connection_pool_size: connectionPoolSize,
        max_staleness_mins: maxStalenessMins,
      },
    } as UpdateDestinationConfig
  } else if ('iceberg' in destinationConfig) {
    const {
      projectRef: icebergProjectRef,
      warehouseName,
      namespace,
      catalogToken,
      s3AccessKeyId,
      s3SecretAccessKey,
      s3Region,
    } = destinationConfig.iceberg
    destination_config = {
      iceberg: {
        supabase: {
          project_ref: icebergProjectRef,
          warehouse_name: warehouseName,
          namespace: namespace,
          catalog_token: optionalSecret(catalogToken),
          s3_access_key_id: optionalSecret(s3AccessKeyId),
          s3_secret_access_key: optionalSecret(s3SecretAccessKey),
          s3_region: s3Region,
        },
      },
    } as UpdateDestinationConfig
  } else if ('ducklake' in destinationConfig) {
    destination_config = buildDucklakeApiConfig(destinationConfig.ducklake, {
      omitBlankSecrets: true,
    }) as UpdateDestinationConfig
  } else if ('snowflake' in destinationConfig) {
    const { accountId, user, privateKey, privateKeyPassphrase, database, schema, role } =
      destinationConfig.snowflake
    destination_config = {
      snowflake: {
        account_id: accountId,
        user,
        private_key: optionalSecret(privateKey),
        private_key_passphrase: optionalSecret(privateKeyPassphrase),
        database,
        schema,
        role,
      },
    } as UpdateDestinationConfig
  } else if ('clickHouse' in destinationConfig) {
    const { url, user, password, database, engine } = destinationConfig.clickHouse
    destination_config = {
      clickhouse: {
        url,
        user,
        password: optionalSecret(password),
        database,
        engine,
      },
    } as UpdateDestinationConfig
  } else {
    throw new Error(
      'Invalid destination config: must specify bigQuery, iceberg, ducklake, snowflake, or clickHouse'
    )
  }

  const pipeline_config = buildPipelineApiConfig(pipelineConfig)

  const { data, error } = await post(
    '/platform/replication/{ref}/destinations-pipelines/{destination_id}/{pipeline_id}',
    {
      params: { path: { ref: projectRef, destination_id: destinationId, pipeline_id: pipelineId } },
      body: {
        destination_config,
        source_id: sourceId,
        destination_name: destinationName,
        pipeline_config: pipeline_config as UpdatePipelineConfig,
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

type UpdateDestinationPipelineData = Awaited<ReturnType<typeof updateDestinationPipeline>>

export const useUpdateDestinationPipelineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    UpdateDestinationPipelineData,
    ResponseError,
    UpdateDestinationPipelineParams
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdateDestinationPipelineData, ResponseError, UpdateDestinationPipelineParams>(
    {
      mutationFn: (vars) => updateDestinationPipeline(vars),
      async onSuccess(data, variables, context) {
        const { projectRef, destinationId, pipelineId } = variables

        await Promise.all([
          // Invalidate lists
          queryClient.invalidateQueries({ queryKey: replicationKeys.destinations(projectRef) }),
          queryClient.invalidateQueries({ queryKey: replicationKeys.pipelines(projectRef) }),
          // Invalidate item-level caches used by the editor panel
          queryClient.invalidateQueries({
            queryKey: replicationKeys.destinationById(projectRef, destinationId),
          }),
          queryClient.invalidateQueries({
            queryKey: replicationKeys.pipelineById(projectRef, pipelineId),
          }),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update destination or pipeline: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
