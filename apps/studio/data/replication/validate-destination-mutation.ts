import { useMutation } from '@tanstack/react-query'

import type { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'

type DestinationConfig =
  | {
      bigQuery: {
        projectId: string
        datasetId: string
        serviceAccountKey: string
        maxStalenessMins?: number
      }
    }
  | {
      iceberg: {
        projectRef: string
        warehouseName: string
        namespace?: string
        catalogToken: string
        s3AccessKeyId: string
        s3SecretAccessKey: string
        s3Region: string
      }
    }

export type ValidateDestinationParams = {
  projectRef: string
  destinationConfig: DestinationConfig
}

export type ValidationFailure = {
  name: string
  reason: string
  failure_type: 'critical' | 'warning'
}

export type ValidateDestinationResponse = {
  validation_failures: ValidationFailure[]
}

async function validateDestination(
  { projectRef, destinationConfig }: ValidateDestinationParams,
  signal?: AbortSignal
): Promise<ValidateDestinationResponse> {
  if (!projectRef) throw new Error('projectRef is required')

  // Build destination_config based on the type
  let config: components['schemas']['ValidateReplicationDestinationBody']['config']

  if ('bigQuery' in destinationConfig) {
    const { projectId, datasetId, serviceAccountKey, maxStalenessMins } = destinationConfig.bigQuery

    config = {
      big_query: {
        project_id: projectId,
        dataset_id: datasetId,
        service_account_key: serviceAccountKey,
        ...(maxStalenessMins !== undefined ? { max_staleness_mins: maxStalenessMins } : {}),
      },
    }
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
  } else {
    throw new Error('Invalid destination config: must specify either bigQuery or iceberg')
  }

  const { data, error } = await post('/platform/replication/{ref}/destinations/validate', {
    params: { path: { ref: projectRef } },
    body: { config },
    signal,
  })

  if (error) {
    handleError(error)
  }

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
