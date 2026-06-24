import { useMutation } from '@tanstack/react-query'
import type { components } from 'api-types'

import { buildDucklakeApiConfig, DestinationConfig } from './create-destination-pipeline-mutation'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type ValidateDestinationParams = {
  projectRef: string
  destinationConfig: DestinationConfig
  sourceId?: number
  publicationName?: string
  maxFillMs?: number
  maxTableSyncWorkers?: number
  maxCopyConnectionsPerTable?: number
  invalidatedSlotBehavior?: 'error' | 'recreate'
}

type ValidateDestinationResponse = components['schemas']['ValidateDestinationResponse']
export type ValidationFailure = ValidateDestinationResponse['validation_failures'][number]

async function validateDestination(
  {
    projectRef,
    destinationConfig,
    sourceId,
    publicationName,
    maxFillMs,
    maxTableSyncWorkers,
    maxCopyConnectionsPerTable,
    invalidatedSlotBehavior,
  }: ValidateDestinationParams,
  signal?: AbortSignal
): Promise<ValidateDestinationResponse> {
  if (!projectRef) throw new Error('projectRef is required')

  // Build destination_config based on the type
  let config: components['schemas']['ValidateReplicationDestinationBody']['config']

  if ('bigQuery' in destinationConfig) {
    const { projectId, datasetId, serviceAccountKey, connectionPoolSize, maxStalenessMins } =
      destinationConfig.bigQuery

    config = {
      big_query: {
        project_id: projectId,
        dataset_id: datasetId,
        service_account_key: serviceAccountKey,
        connection_pool_size: connectionPoolSize,
        max_staleness_mins: maxStalenessMins,
      },
    } as components['schemas']['ValidateReplicationDestinationBody']['config']
  } else if ('iceberg' in destinationConfig) {
    const {
      projectRef: icebergProjectRef,
      namespace,
      warehouseName,
      catalogToken,
      s3AccessKeyId,
      s3SecretAccessKey,
      s3Region,
    } = destinationConfig.iceberg

    config = {
      iceberg: {
        supabase: {
          namespace,
          project_ref: icebergProjectRef,
          warehouse_name: warehouseName,
          catalog_token: catalogToken,
          s3_access_key_id: s3AccessKeyId,
          s3_secret_access_key: s3SecretAccessKey,
          s3_region: s3Region,
        },
      },
    }
  } else if ('ducklake' in destinationConfig) {
    config = buildDucklakeApiConfig(
      destinationConfig.ducklake
    ) as components['schemas']['ValidateReplicationDestinationBody']['config']
  } else if ('snowflake' in destinationConfig) {
    const { accountId, user, privateKey, privateKeyPassphrase, database, schema, role } =
      destinationConfig.snowflake

    config = {
      snowflake: {
        account_id: accountId,
        user,
        private_key: privateKey,
        private_key_passphrase: privateKeyPassphrase,
        database,
        schema,
        role,
      },
    } as unknown as components['schemas']['ValidateReplicationDestinationBody']['config']
  } else {
    throw new Error(
      'Invalid destination config: must specify bigQuery, iceberg, ducklake, or snowflake'
    )
  }

  const batchConfig = maxFillMs !== undefined ? { max_fill_ms: maxFillMs } : undefined
  const pipelineConfig =
    publicationName === undefined
      ? undefined
      : {
          publication_name: publicationName,
          max_table_sync_workers: maxTableSyncWorkers,
          max_copy_connections_per_table: maxCopyConnectionsPerTable,
          invalidated_slot_behavior: invalidatedSlotBehavior,
          batch: batchConfig,
        }

  const { data, error } = await post('/platform/replication/{ref}/destinations/validate', {
    params: { path: { ref: projectRef } },
    body: {
      config,
      source_id: sourceId,
      pipeline_config: pipelineConfig,
    },
    signal,
  })

  if (error) handleError(error)
  return data as ValidateDestinationResponse
}

type ValidateDestinationData = Awaited<ReturnType<typeof validateDestination>>

export const useValidateDestinationMutation = (
  options?: Omit<
    UseCustomMutationOptions<ValidateDestinationData, ResponseError, ValidateDestinationParams>,
    'mutationFn'
  >
) => {
  return useMutation<ValidateDestinationData, ResponseError, ValidateDestinationParams>({
    mutationFn: (vars) => validateDestination(vars),
    ...options,
  })
}
