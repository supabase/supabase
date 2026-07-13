import { UseMutateAsyncFunction } from '@tanstack/react-query'
import { snakeCase } from 'lodash'
import z from 'zod'

import { DestinationType } from '../DestinationPanel.types'
import {
  CREATE_NEW_KEY,
  CREATE_NEW_NAMESPACE,
  DEFAULT_CONNECTION_POOL_SIZE,
  DEFAULT_DUCKLAKE_POOL_SIZE,
  DEFAULT_MAX_COPY_CONNECTIONS_PER_TABLE,
  DEFAULT_MAX_FILL_MS,
  DEFAULT_MAX_TABLE_SYNC_WORKERS,
} from './DestinationForm.constants'
import {
  DestinationPanelFormSchema,
  type DestinationPanelSchemaType,
} from './DestinationForm.schema'
import {
  DUCKLAKE_MODE_CUSTOM,
  DUCKLAKE_MODE_SUPABASE,
  type DucklakeMode,
} from './DuckLake/DuckLake.constants'
import { type DucklakeApiConfig } from './DuckLake/DuckLake.utils'
import { type SnowflakeApiConfig } from './Snowflake/Snowflake.utils'
import {
  BigQueryDestinationConfig,
  DestinationConfig,
  DucklakeDestinationConfig,
  DucklakeManualDestinationConfig,
  DucklakeSupabaseDestinationConfig,
  IcebergDestinationConfig,
  SnowflakeDestinationConfig,
} from '@/data/replication/create-destination-pipeline-mutation'
import { type ReplicationDestinationByIdData } from '@/data/replication/destination-by-id-query'
import { type ReplicationPipelineByIdData } from '@/data/replication/pipeline-by-id-query'
import { type ValidationFailure } from '@/data/replication/validate-destination-mutation'
import {
  type CreateS3AccessKeyCredentialVariables,
  type S3AccessKeyCreateData,
} from '@/data/storage/s3-access-key-create-mutation'
import { type ResponseError } from '@/types'

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const normalizeRequiredString = (value?: string) => value?.trim() ?? ''

const normalizeOptionalUntrimmedString = (value?: string) => {
  return value && value.length > 0 ? value : undefined
}

// Builds the initial react-hook-form values for the destination form. New destinations fall back to
// sensible defaults; existing destinations are hydrated from the destination + pipeline configs.
export const generateDefaultValues = ({
  destinationData,
  pipelineData,
  catalogToken,
  region,
  projectRef,
  editMode,
}: {
  destinationData?: ReplicationDestinationByIdData
  pipelineData?: ReplicationPipelineByIdData
  catalogToken: string
  region?: string
  projectRef?: string
  editMode: boolean
}): DestinationPanelSchemaType => {
  const config = destinationData?.config
  const isBigQueryConfig = config && 'big_query' in config
  const isIcebergConfig = config && 'iceberg' in config
  const ducklakeConfigValue =
    config && 'ducklake' in (config as Record<string, unknown>)
      ? (config as Record<string, unknown>).ducklake
      : undefined
  const ducklakeConfig =
    ducklakeConfigValue && typeof ducklakeConfigValue === 'object'
      ? (ducklakeConfigValue as DucklakeApiConfig)
      : undefined
  const snowflakeConfigValue =
    config && 'snowflake' in (config as Record<string, unknown>)
      ? (config as Record<string, unknown>).snowflake
      : undefined
  const snowflakeConfig =
    snowflakeConfigValue && typeof snowflakeConfigValue === 'object'
      ? (snowflakeConfigValue as SnowflakeApiConfig)
      : undefined

  return {
    // Common fields
    name: destinationData?.name ?? '',
    publicationName: pipelineData?.config.publication_name ?? '',
    maxFillMs: pipelineData?.config?.batch?.max_fill_ms ?? DEFAULT_MAX_FILL_MS,
    maxTableSyncWorkers:
      pipelineData?.config?.max_table_sync_workers ?? DEFAULT_MAX_TABLE_SYNC_WORKERS,
    maxCopyConnectionsPerTable:
      pipelineData?.config?.max_copy_connections_per_table ??
      DEFAULT_MAX_COPY_CONNECTIONS_PER_TABLE,
    invalidatedSlotBehavior:
      (pipelineData?.config as { invalidated_slot_behavior?: 'error' | 'recreate' } | undefined)
        ?.invalidated_slot_behavior ?? undefined,
    // BigQuery fields
    projectId: isBigQueryConfig ? config.big_query.project_id : '',
    datasetId: isBigQueryConfig ? config.big_query.dataset_id : '',
    serviceAccountKey: isBigQueryConfig ? config.big_query.service_account_key : '',
    connectionPoolSize:
      (config as { big_query?: { connection_pool_size?: number } } | undefined)?.big_query
        ?.connection_pool_size ?? DEFAULT_CONNECTION_POOL_SIZE,
    maxStalenessMins: isBigQueryConfig ? config.big_query.max_staleness_mins : undefined, // Default: null
    // Analytics Bucket fields
    warehouseName: isIcebergConfig ? config.iceberg.supabase.warehouse_name : '',
    namespace: isIcebergConfig ? config.iceberg.supabase.namespace : '',
    newNamespaceName: '',
    catalogToken: isIcebergConfig ? config.iceberg.supabase.catalog_token : catalogToken,
    s3AccessKeyId: isIcebergConfig ? config.iceberg.supabase.s3_access_key_id : '',
    s3SecretAccessKey: isIcebergConfig ? config.iceberg.supabase.s3_secret_access_key : '',
    s3Region: region ?? (isIcebergConfig ? config.iceberg.supabase.s3_region : ''),
    // DuckLake fields
    // New destinations default to the managed "Use Supabase" mode with the current project
    // pre-selected as both catalog and storage. Existing destinations always read back as the
    // resolved/custom shape, so edit mode is locked to "Custom parameters".
    ducklakeMode: (editMode ? DUCKLAKE_MODE_CUSTOM : DUCKLAKE_MODE_SUPABASE) as DucklakeMode,
    ducklakeCatalogProjectRef: editMode ? '' : (projectRef ?? ''),
    ducklakeStorageProjectRef: editMode ? '' : (projectRef ?? ''),
    ducklakeStorageBucket: '',
    ducklakeCatalogUrl: ducklakeConfig?.catalog_url ?? '',
    ducklakeDataPath: ducklakeConfig?.data_path ?? '',
    ducklakePoolSize: ducklakeConfig?.pool_size ?? DEFAULT_DUCKLAKE_POOL_SIZE,
    ducklakeS3AccessKeyId: ducklakeConfig?.s3_access_key_id ?? '',
    ducklakeS3SecretAccessKey: ducklakeConfig?.s3_secret_access_key ?? '',
    ducklakeS3Region: ducklakeConfig?.s3_region ?? '',
    ducklakeS3Endpoint: ducklakeConfig?.s3_endpoint ?? '',
    ducklakeS3UrlStyle: ducklakeConfig?.s3_url_style ?? 'path',
    ducklakeS3UseSsl: ducklakeConfig?.s3_use_ssl ?? true,
    ducklakeMetadataSchema: ducklakeConfig?.metadata_schema ?? 'ducklake',
    // Snowflake fields
    snowflakeAccountId: snowflakeConfig?.account_id ?? '',
    snowflakeUser: snowflakeConfig?.user ?? '',
    snowflakePrivateKey: snowflakeConfig?.private_key ?? '',
    snowflakePrivateKeyPassphrase: snowflakeConfig?.private_key_passphrase ?? '',
    snowflakeDatabase: snowflakeConfig?.database ?? '',
    snowflakeSchema: snowflakeConfig?.schema ?? '',
    snowflakeRole: snowflakeConfig?.role ?? '',
  }
}

const buildBigQueryConfig = (
  data: z.infer<typeof DestinationPanelFormSchema>
): BigQueryDestinationConfig => ({
  projectId: data.projectId ?? '',
  datasetId: data.datasetId ?? '',
  serviceAccountKey: data.serviceAccountKey ?? '',
  connectionPoolSize: data.connectionPoolSize,
  maxStalenessMins: data.maxStalenessMins,
})

const buildSnowflakeConfig = (
  data: z.infer<typeof DestinationPanelFormSchema>
): SnowflakeDestinationConfig => ({
  accountId: normalizeRequiredString(data.snowflakeAccountId),
  user: normalizeRequiredString(data.snowflakeUser),
  privateKey: data.snowflakePrivateKey ?? '',
  privateKeyPassphrase: normalizeOptionalUntrimmedString(data.snowflakePrivateKeyPassphrase),
  database: normalizeRequiredString(data.snowflakeDatabase),
  schema: normalizeRequiredString(data.snowflakeSchema),
  role: normalizeOptionalString(data.snowflakeRole),
})

// Builds the studio-side DuckLake config from form data, picking the right shape for the
// selected mode. The create / update / validate mutations convert this to the API payload.
const buildDucklakeConfig = (
  data: z.infer<typeof DestinationPanelFormSchema>
): DucklakeDestinationConfig => {
  if (data.ducklakeMode === DUCKLAKE_MODE_SUPABASE) {
    const supabaseConfig: DucklakeSupabaseDestinationConfig = {
      catalogProjectRef: normalizeRequiredString(data.ducklakeCatalogProjectRef),
      storageProjectRef: normalizeRequiredString(data.ducklakeStorageProjectRef),
      bucket: normalizeRequiredString(data.ducklakeStorageBucket),
      poolSize: data.ducklakePoolSize,
      metadataSchema: normalizeOptionalString(data.ducklakeMetadataSchema),
    }
    return supabaseConfig
  }

  const manualConfig: DucklakeManualDestinationConfig = {
    catalogUrl: data.ducklakeCatalogUrl ?? '',
    dataPath: data.ducklakeDataPath ?? '',
    poolSize: data.ducklakePoolSize,
    s3AccessKeyId: normalizeRequiredString(data.ducklakeS3AccessKeyId),
    s3SecretAccessKey: normalizeRequiredString(data.ducklakeS3SecretAccessKey),
    s3Region: normalizeRequiredString(data.ducklakeS3Region),
    s3Endpoint: normalizeRequiredString(data.ducklakeS3Endpoint),
    s3UrlStyle: data.ducklakeS3UrlStyle,
    s3UseSsl: data.ducklakeS3UseSsl,
    metadataSchema: normalizeOptionalString(data.ducklakeMetadataSchema),
  }
  return manualConfig
}

// Helper function to build destination config for validation
export const buildDestinationConfigForValidation = ({
  projectRef,
  selectedType,
  data,
}: {
  projectRef?: string
  selectedType: DestinationType
  data: z.infer<typeof DestinationPanelFormSchema>
}) => {
  if (!projectRef) throw new Error('Project ref is required')

  if (selectedType === 'BigQuery') {
    return { bigQuery: buildBigQueryConfig(data) }
  } else if (selectedType === 'Analytics Bucket') {
    // For validation, use the namespace as-is (even if it's CREATE_NEW_NAMESPACE)
    // The actual creation will happen later in submitPipeline
    const validationNamespace =
      data.namespace === CREATE_NEW_NAMESPACE ? data.newNamespaceName : data.namespace

    // For validation purposes, if CREATE_NEW_KEY is selected, we skip S3 key validation
    // The actual key creation will happen later in submitPipeline
    // We'll use placeholder values for validation
    const s3Keys =
      data.s3AccessKeyId === CREATE_NEW_KEY
        ? { accessKey: 'placeholder', secretKey: 'placeholder' }
        : { accessKey: data.s3AccessKeyId ?? '', secretKey: data.s3SecretAccessKey ?? '' }

    return {
      iceberg: {
        projectRef,
        warehouseName: data.warehouseName ?? '',
        namespace: validationNamespace,
        catalogToken: data.catalogToken ?? '',
        s3AccessKeyId: s3Keys.accessKey,
        s3SecretAccessKey: s3Keys.secretKey,
        s3Region: data.s3Region ?? '',
      },
    }
  } else if (selectedType === 'DuckLake') {
    return { ducklake: buildDucklakeConfig(data) }
  } else if (selectedType === 'Snowflake') {
    return { snowflake: buildSnowflakeConfig(data) }
  } else {
    throw new Error('Invalid destination type')
  }
}

export const buildDestinationConfig = async ({
  projectRef,
  selectedType,
  data,
  createS3AccessKey,
  resolveNamespace,
}: {
  projectRef?: string
  selectedType: DestinationType
  data: z.infer<typeof DestinationPanelFormSchema>
  createS3AccessKey: UseMutateAsyncFunction<
    S3AccessKeyCreateData,
    ResponseError,
    CreateS3AccessKeyCredentialVariables,
    unknown
  >
  resolveNamespace: (
    data: z.infer<typeof DestinationPanelFormSchema>
  ) => Promise<string | undefined>
}) => {
  if (!projectRef) throw new Error('Project ref is required')

  let destinationConfig: DestinationConfig | undefined = undefined

  if (selectedType === 'BigQuery') {
    destinationConfig = { bigQuery: buildBigQueryConfig(data) }
  } else if (selectedType === 'Analytics Bucket') {
    let s3Keys = { accessKey: data.s3AccessKeyId, secretKey: data.s3SecretAccessKey }

    if (data.s3AccessKeyId === CREATE_NEW_KEY) {
      const newKeys = await createS3AccessKey({
        projectRef,
        description: `Autogenerated key for replication to ${snakeCase(data.warehouseName)}`,
      })
      s3Keys = { accessKey: newKeys.access_key, secretKey: newKeys.secret_key }
    }

    // Resolve namespace (create if needed)
    const finalNamespace = await resolveNamespace(data)

    const icebergConfig: IcebergDestinationConfig = {
      projectRef: projectRef,
      warehouseName: data.warehouseName ?? '',
      namespace: finalNamespace,
      catalogToken: data.catalogToken ?? '',
      s3AccessKeyId: s3Keys.accessKey ?? '',
      s3SecretAccessKey: s3Keys.secretKey ?? '',
      s3Region: data.s3Region ?? '',
    }
    destinationConfig = { iceberg: icebergConfig }
  } else if (selectedType === 'DuckLake') {
    destinationConfig = { ducklake: buildDucklakeConfig(data) }
  } else if (selectedType === 'Snowflake') {
    destinationConfig = { snowflake: buildSnowflakeConfig(data) }
  }

  return destinationConfig
}

const getValidationFailureKey = (failure: ValidationFailure) =>
  JSON.stringify([failure.failure_type, failure.name, failure.reason])

const getSortedValidationFailureKeys = (failures: ValidationFailure[]) =>
  failures.map(getValidationFailureKey).sort((a, b) => a.localeCompare(b))

export const areValidationFailuresEqual = (
  previousFailures: ValidationFailure[],
  nextFailures: ValidationFailure[]
) => {
  const previousKeys = getSortedValidationFailureKeys(previousFailures)
  const nextKeys = getSortedValidationFailureKeys(nextFailures)

  return (
    previousKeys.length === nextKeys.length &&
    previousKeys.every((key, index) => key === nextKeys[index])
  )
}
