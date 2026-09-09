import { useMutation, useQueryClient } from '@tanstack/react-query'
import { components } from 'api-types'
import { toast } from 'sonner'

import { optionalSecret } from './destination-secret-utils'
import { replicationKeys } from './keys'
import type {
  BigQueryDestinationConfig,
  BigQueryTableOption,
  DestinationConfig,
  DucklakeDestinationConfig,
  PipelineConfig,
} from './types'
import {
  buildBigQueryTableOptionApiConfig,
  buildPipelineApiConfig,
  getConfiguredBigQueryTableOptions,
  isDucklakeSupabaseConfig,
} from './utils'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type UpdateDestinationPipelineBody =
  components['schemas']['UpdateReplicationDestinationPipelineBody']
type UpdateDestinationApiConfig = UpdateDestinationPipelineBody['destination_config']

type UpdateBigQueryApiConfig = Extract<UpdateDestinationApiConfig, { big_query: unknown }>
type UpdateDucklakeApiConfig = Extract<UpdateDestinationApiConfig, { ducklake: unknown }>

const buildBigQueryTableOptionsUpdateApiConfig = (
  tableOptions: BigQueryTableOption[] | undefined
) => {
  const configuredTableOptions = getConfiguredBigQueryTableOptions(tableOptions)
  if (tableOptions === undefined) return undefined
  if (configuredTableOptions.length === 0) return null
  return { tables: configuredTableOptions.map(buildBigQueryTableOptionApiConfig) }
}

export function buildBigQueryUpdateApiConfig(
  config: BigQueryDestinationConfig
): UpdateBigQueryApiConfig {
  return {
    big_query: {
      project_id: config.projectId,
      dataset_id: config.datasetId,
      service_account_key: optionalSecret(config.serviceAccountKey),
      connection_pool_size: config.connectionPoolSize,
      max_staleness_mins: config.maxStalenessMins,
      table_options: buildBigQueryTableOptionsUpdateApiConfig(config.tableOptions),
    },
  }
}

export function buildDucklakeUpdateApiConfig(
  config: DucklakeDestinationConfig
): UpdateDucklakeApiConfig {
  if (isDucklakeSupabaseConfig(config)) {
    return {
      ducklake: {
        catalog: {
          type: 'supabase_project',
          project_ref: config.catalogProjectRef,
          pool_size: config.poolSize,
          metadata_schema: config.metadataSchema,
        },
        storage: {
          type: 'supabase_storage',
          project_ref: config.storageProjectRef,
          bucket: config.bucket,
          ...(config.path ? { path: config.path } : {}),
        },
      },
    }
  }

  return {
    ducklake: {
      catalog_url: optionalSecret(config.catalogUrl),
      data_path: config.dataPath,
      pool_size: config.poolSize,
      s3_access_key_id: optionalSecret(config.s3AccessKeyId),
      s3_secret_access_key: optionalSecret(config.s3SecretAccessKey),
      s3_region: config.s3Region,
      s3_endpoint: config.s3Endpoint,
      s3_url_style: config.s3UrlStyle,
      s3_use_ssl: config.s3UseSsl,
      metadata_schema: config.metadataSchema,
    },
  }
}

export const buildUpdateDestinationApiConfig = (
  destinationConfig: DestinationConfig
): UpdateDestinationApiConfig => {
  if ('bigQuery' in destinationConfig) {
    return buildBigQueryUpdateApiConfig(destinationConfig.bigQuery)
  }

  if ('iceberg' in destinationConfig) {
    const {
      projectRef,
      warehouseName,
      namespace,
      catalogToken,
      s3AccessKeyId,
      s3SecretAccessKey,
      s3Region,
    } = destinationConfig.iceberg

    return {
      iceberg: {
        supabase: {
          project_ref: projectRef,
          warehouse_name: warehouseName,
          namespace,
          catalog_token: optionalSecret(catalogToken),
          s3_access_key_id: optionalSecret(s3AccessKeyId),
          s3_secret_access_key: optionalSecret(s3SecretAccessKey),
          s3_region: s3Region,
        },
      },
    }
  }

  if ('ducklake' in destinationConfig) {
    return buildDucklakeUpdateApiConfig(destinationConfig.ducklake)
  }

  if ('snowflake' in destinationConfig) {
    const { accountId, user, privateKey, privateKeyPassphrase, database, schema, role } =
      destinationConfig.snowflake

    return {
      snowflake: {
        account_id: accountId,
        user,
        private_key: optionalSecret(privateKey),
        private_key_passphrase: optionalSecret(privateKeyPassphrase),
        database,
        schema,
        role,
      },
    }
  }

  if ('clickHouse' in destinationConfig) {
    const { url, user, password, database, engine } = destinationConfig.clickHouse

    return {
      clickhouse: {
        url,
        user,
        password: optionalSecret(password),
        database,
        engine,
      },
    }
  }

  throw new Error(
    'Invalid destination config: must specify bigQuery, iceberg, ducklake, snowflake, or clickHouse'
  )
}

export type UpdateDestinationPipelineParams = {
  destinationId: number
  pipelineId: number
  projectRef: string
  destinationName: string
  destinationConfig: DestinationConfig
  sourceId: number
  pipelineConfig: PipelineConfig
}

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

  const destination_config = buildUpdateDestinationApiConfig(destinationConfig)

  const pipeline_config = buildPipelineApiConfig(pipelineConfig)

  const { data, error } = await post(
    '/platform/replication/{ref}/destinations-pipelines/{destination_id}/{pipeline_id}',
    {
      params: { path: { ref: projectRef, destination_id: destinationId, pipeline_id: pipelineId } },
      body: {
        destination_config,
        source_id: sourceId,
        destination_name: destinationName,
        pipeline_config,
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
