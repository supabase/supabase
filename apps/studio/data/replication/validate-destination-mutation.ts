import { useMutation } from '@tanstack/react-query'
import type { components } from 'api-types'

import { DestinationConfig } from './create-destination-pipeline-mutation'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type ValidateDestinationParams = {
  projectRef: string
  destinationConfig: DestinationConfig
}

type ValidateDestinationResponse = components['schemas']['ValidateDestinationResponse']
export type ValidationFailure = ValidateDestinationResponse['validation_failures'][number]

async function validateDestination(
  { projectRef, destinationConfig }: ValidateDestinationParams,
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
    const {
      catalogUrl,
      dataPath,
      poolSize,
      s3AccessKeyId,
      s3SecretAccessKey,
      s3Region,
      s3Endpoint,
      s3UrlStyle,
      s3UseSsl,
      metadataSchema,
      expireSnapshotsOlderThan,
    } = destinationConfig.ducklake

    config = {
      ducklake: {
        catalog_url: catalogUrl,
        data_path: dataPath,
        pool_size: poolSize,
        s3_access_key_id: s3AccessKeyId,
        s3_secret_access_key: s3SecretAccessKey,
        s3_region: s3Region,
        s3_endpoint: s3Endpoint,
        s3_url_style: s3UrlStyle,
        s3_use_ssl: s3UseSsl,
        metadata_schema: metadataSchema,
        expire_snapshots_older_than: expireSnapshotsOlderThan,
      },
    } as unknown as components['schemas']['ValidateReplicationDestinationBody']['config']
  } else {
    throw new Error('Invalid destination config: must specify bigQuery, iceberg, or ducklake')
  }

  const { data, error } = await post('/platform/replication/{ref}/destinations/validate', {
    params: { path: { ref: projectRef } },
    body: { config },
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
