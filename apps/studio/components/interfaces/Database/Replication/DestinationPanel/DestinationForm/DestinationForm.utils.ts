import { UseMutateAsyncFunction } from '@tanstack/react-query'
import { snakeCase } from 'lodash'
import z from 'zod'

import { DestinationType } from '../DestinationPanel.types'
import { CREATE_NEW_KEY, CREATE_NEW_NAMESPACE } from './DestinationForm.constants'
import {
  DestinationPanelFormSchema,
  type DestinationPanelSchemaType,
} from './DestinationForm.schema'
import {
  BigQueryDestinationConfig,
  DestinationConfig,
  DucklakeDestinationConfig,
  IcebergDestinationConfig,
} from '@/data/replication/create-destination-pipeline-mutation'
import {
  type CreateS3AccessKeyCredentialVariables,
  type S3AccessKeyCreateData,
} from '@/data/storage/s3-access-key-create-mutation'
import { ResponseError } from '@/types'

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const normalizeRequiredString = (value?: string) => value?.trim() ?? ''

type DucklakeFieldPath =
  | 'ducklakeCatalogUrl'
  | 'ducklakeDataPath'
  | 'ducklakeS3AccessKeyId'
  | 'ducklakeS3SecretAccessKey'
  | 'ducklakeS3Region'
  | 'ducklakeS3Endpoint'
  | 'ducklakeMetadataSchema'

export type DucklakeValidationIssue = {
  path: DucklakeFieldPath
  message: string
}

export const getDucklakeValidationIssues = (
  data: Pick<
    DestinationPanelSchemaType,
    | 'ducklakeCatalogUrl'
    | 'ducklakeDataPath'
    | 'ducklakeS3AccessKeyId'
    | 'ducklakeS3SecretAccessKey'
    | 'ducklakeS3Region'
    | 'ducklakeS3Endpoint'
    | 'ducklakeMetadataSchema'
  >
): DucklakeValidationIssue[] => {
  const issues: DucklakeValidationIssue[] = []

  if (!data.ducklakeCatalogUrl?.length) {
    issues.push({ path: 'ducklakeCatalogUrl', message: 'Catalog URL is required' })
  } else if (
    !data.ducklakeCatalogUrl.startsWith('postgres://') &&
    !data.ducklakeCatalogUrl.startsWith('postgresql://')
  ) {
    issues.push({
      path: 'ducklakeCatalogUrl',
      message: 'DuckLake catalog URL must be a PostgreSQL-compatible URL',
    })
  }

  if (!data.ducklakeDataPath?.length) {
    issues.push({ path: 'ducklakeDataPath', message: 'Data path is required' })
  } else if (
    !data.ducklakeDataPath.startsWith('s3://') ||
    data.ducklakeDataPath.includes('file://')
  ) {
    issues.push({
      path: 'ducklakeDataPath',
      message: 'DuckLake data path must start with s3:// and cannot contain file://',
    })
  }

  if (!data.ducklakeS3AccessKeyId?.length) {
    issues.push({ path: 'ducklakeS3AccessKeyId', message: 'S3 Access Key ID is required' })
  }

  if (!data.ducklakeS3SecretAccessKey?.length) {
    issues.push({
      path: 'ducklakeS3SecretAccessKey',
      message: 'S3 Secret Access Key is required',
    })
  }

  if (!data.ducklakeS3Region?.length) {
    issues.push({ path: 'ducklakeS3Region', message: 'S3 Region is required' })
  }

  if (!data.ducklakeS3Endpoint?.length) {
    issues.push({ path: 'ducklakeS3Endpoint', message: 'S3 Endpoint is required' })
  } else if (
    data.ducklakeS3Endpoint.startsWith('http://') ||
    data.ducklakeS3Endpoint.startsWith('https://')
  ) {
    issues.push({
      path: 'ducklakeS3Endpoint',
      message: 'S3 endpoint should not contain the protocol scheme',
    })
  }

  if (data.ducklakeMetadataSchema && !/^[A-Za-z0-9_]+$/.test(data.ducklakeMetadataSchema)) {
    issues.push({
      path: 'ducklakeMetadataSchema',
      message: 'DuckLake metadata schema must contain only letters, numbers, and underscores',
    })
  }

  return issues
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
    return {
      bigQuery: {
        projectId: data.projectId ?? '',
        datasetId: data.datasetId ?? '',
        serviceAccountKey: data.serviceAccountKey ?? '',
        connectionPoolSize: data.connectionPoolSize,
        maxStalenessMins: data.maxStalenessMins,
      },
    }
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
    return {
      ducklake: {
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
        expireSnapshotsOlderThan: normalizeOptionalString(data.ducklakeExpireSnapshotsOlderThan),
      },
    }
  } else {
    throw new Error('Invalid destination type')
  }
}

export const buildDestinationConfig = async ({
  projectRef,
  selectedType,
  data,
  warehouseName,
  createS3AccessKey,
  resolveNamespace,
}: {
  projectRef?: string
  selectedType: DestinationType
  data: z.infer<typeof DestinationPanelFormSchema>
  warehouseName?: string
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
    const bigQueryConfig: BigQueryDestinationConfig = {
      projectId: data.projectId ?? '',
      datasetId: data.datasetId ?? '',
      serviceAccountKey: data.serviceAccountKey ?? '',
      connectionPoolSize: data.connectionPoolSize,
      maxStalenessMins: data.maxStalenessMins,
    }
    destinationConfig = { bigQuery: bigQueryConfig }
  } else if (selectedType === 'Analytics Bucket') {
    let s3Keys = { accessKey: data.s3AccessKeyId, secretKey: data.s3SecretAccessKey }

    if (data.s3AccessKeyId === CREATE_NEW_KEY) {
      const newKeys = await createS3AccessKey({
        projectRef,
        description: `Autogenerated key for replication to ${snakeCase(warehouseName)}`,
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
    const ducklakeConfig: DucklakeDestinationConfig = {
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
      expireSnapshotsOlderThan: normalizeOptionalString(data.ducklakeExpireSnapshotsOlderThan),
    }
    destinationConfig = { ducklake: ducklakeConfig }
  }

  return destinationConfig
}
