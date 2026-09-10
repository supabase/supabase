import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from 'api-types'
import { toast } from 'sonner'

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

type CreateDestinationPipelineBody =
  components['schemas']['CreateReplicationDestinationPipelineBody']
type CreateDestinationApiConfig = CreateDestinationPipelineBody['destination_config']

type CreateBigQueryApiConfig = Extract<CreateDestinationApiConfig, { big_query: unknown }>
type CreateDucklakeApiConfig = Extract<CreateDestinationApiConfig, { ducklake: unknown }>

const buildBigQueryTableOptionsApiConfig = (tableOptions: BigQueryTableOption[] | undefined) => {
  const configuredTableOptions = getConfiguredBigQueryTableOptions(tableOptions)

  if (tableOptions === undefined || configuredTableOptions.length === 0) return undefined
  return { tables: configuredTableOptions.map(buildBigQueryTableOptionApiConfig) }
}

// Maps the studio-side BigQuery config to the snake_case `{ big_query: ... }` payload accepted
// by the platform API. Shared by the create and validate mutations.
export function buildBigQueryApiConfig(config: BigQueryDestinationConfig): CreateBigQueryApiConfig {
  return {
    big_query: {
      project_id: config.projectId,
      dataset_id: config.datasetId,
      service_account_key: config.serviceAccountKey,
      connection_pool_size: config.connectionPoolSize,
      max_staleness_mins: config.maxStalenessMins,
      table_options: buildBigQueryTableOptionsApiConfig(config.tableOptions),
    },
  }
}

// Maps the studio-side DuckLake config to the snake_case `{ ducklake: ... }` payload accepted
// by the platform API. Shared by the create / update / validate mutations.
export function buildDucklakeApiConfig(config: DucklakeDestinationConfig): CreateDucklakeApiConfig {
  if (isDucklakeSupabaseConfig(config)) {
    return {
      ducklake: {
        // pool_size / metadata_schema live on the catalog so they apply to the selected
        // Supabase Postgres catalog (the API resolves catalog-level values over top-level).
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
      catalog_url: config.catalogUrl,
      data_path: config.dataPath,
      pool_size: config.poolSize,
      s3_access_key_id: config.s3AccessKeyId,
      s3_secret_access_key: config.s3SecretAccessKey,
      s3_region: config.s3Region,
      s3_endpoint: config.s3Endpoint,
      s3_url_style: config.s3UrlStyle,
      s3_use_ssl: config.s3UseSsl,
      metadata_schema: config.metadataSchema,
    },
  }
}

export const buildCreateDestinationApiConfig = (
  destinationConfig: DestinationConfig
): CreateDestinationApiConfig => {
  if ('bigQuery' in destinationConfig) {
    return buildBigQueryApiConfig(destinationConfig.bigQuery)
  }

  if ('iceberg' in destinationConfig) {
    const {
      projectRef,
      namespace,
      warehouseName,
      catalogToken,
      s3AccessKeyId,
      s3SecretAccessKey,
      s3Region,
    } = destinationConfig.iceberg

    return {
      iceberg: {
        supabase: {
          namespace,
          project_ref: projectRef,
          warehouse_name: warehouseName,
          catalog_token: catalogToken,
          s3_access_key_id: s3AccessKeyId,
          s3_secret_access_key: s3SecretAccessKey,
          s3_region: s3Region,
        },
      },
    }
  }

  if ('ducklake' in destinationConfig) {
    return buildDucklakeApiConfig(destinationConfig.ducklake)
  }

  if ('snowflake' in destinationConfig) {
    const { accountId, user, privateKey, privateKeyPassphrase, database, schema, role } =
      destinationConfig.snowflake

    return {
      snowflake: {
        account_id: accountId,
        user,
        private_key: privateKey,
        private_key_passphrase: privateKeyPassphrase,
        database,
        schema,
        role,
      },
    }
  }

  if ('clickHouse' in destinationConfig) {
    const { url, user, password, database, engine } = destinationConfig.clickHouse

    return { clickhouse: { url, user, password, database, engine } }
  }

  throw new Error(
    'Invalid destination config: must specify bigQuery, iceberg, ducklake, snowflake, or clickHouse'
  )
}

export type CreateDestinationPipelineParams = {
  projectRef: string
  destinationName: string
  destinationConfig: DestinationConfig
  sourceId: number
  pipelineConfig: PipelineConfig
}

async function createDestinationPipeline(
  {
    projectRef,
    destinationName: destinationName,
    destinationConfig,
    pipelineConfig,
    sourceId,
  }: CreateDestinationPipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const destination_config = buildCreateDestinationApiConfig(destinationConfig)

  const pipeline_config = buildPipelineApiConfig(pipelineConfig)

  const { data, error } = await post('/platform/replication/{ref}/destinations-pipelines', {
    params: { path: { ref: projectRef } },
    body: {
      source_id: sourceId,
      destination_name: destinationName,
      destination_config,
      pipeline_config,
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

type CreateDestinationPipelineData = Awaited<ReturnType<typeof createDestinationPipeline>>

export const useCreateDestinationPipelineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    CreateDestinationPipelineData,
    ResponseError,
    CreateDestinationPipelineParams
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CreateDestinationPipelineData, ResponseError, CreateDestinationPipelineParams>(
    {
      mutationFn: (vars) => createDestinationPipeline(vars),
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: replicationKeys.destinations(projectRef) }),
          queryClient.invalidateQueries({ queryKey: replicationKeys.pipelines(projectRef) }),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create destination or pipeline: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
