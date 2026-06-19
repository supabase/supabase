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
  ClickHouseDestinationConfig,
  DestinationConfig,
  DucklakeDestinationConfig,
  IcebergDestinationConfig,
  SnowflakeDestinationConfig,
} from '@/data/replication/create-destination-pipeline-mutation'
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

type SnowflakeFieldPath =
  | 'snowflakeAccountId'
  | 'snowflakeUser'
  | 'snowflakePrivateKey'
  | 'snowflakeDatabase'
  | 'snowflakeSchema'

export type SnowflakeValidationIssue = {
  path: SnowflakeFieldPath
  message: string
}

export const getSnowflakeValidationIssues = (
  data: Pick<
    DestinationPanelSchemaType,
    | 'snowflakeAccountId'
    | 'snowflakeUser'
    | 'snowflakePrivateKey'
    | 'snowflakeDatabase'
    | 'snowflakeSchema'
  >
): SnowflakeValidationIssue[] => {
  const issues: SnowflakeValidationIssue[] = []

  if (!data.snowflakeAccountId?.trim().length) {
    issues.push({ path: 'snowflakeAccountId', message: 'Account ID is required' })
  }

  if (!data.snowflakeUser?.trim().length) {
    issues.push({ path: 'snowflakeUser', message: 'User is required' })
  }

  if (!data.snowflakePrivateKey?.trim().length) {
    issues.push({ path: 'snowflakePrivateKey', message: 'Private key is required' })
  }

  if (!data.snowflakeDatabase?.trim().length) {
    issues.push({ path: 'snowflakeDatabase', message: 'Database is required' })
  }

  if (!data.snowflakeSchema?.trim().length) {
    issues.push({ path: 'snowflakeSchema', message: 'Schema is required' })
  }

  return issues
}

type ClickHouseFieldPath = 'clickhouseUrl' | 'clickhouseUser' | 'clickhouseDatabase'

export type ClickHouseValidationIssue = {
  path: ClickHouseFieldPath
  message: string
}

/**
 * Client-side check that the URL does not target an obviously internal address.
 * This is a UX-level guard to surface mistakes before the validate round-trip;
 * server-side validation remains authoritative.
 */
const isClickHouseHostInternal = (host: string): boolean => {
  if (host === '' || host === 'localhost' || host.endsWith('.localhost')) return true

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)

  if (ipv4) {
    const a = Number(ipv4[1])
    const b = Number(ipv4[2])

    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT (RFC 6598)
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) || // benchmarking (RFC 2544)
      a >= 224
    )
  }

  if (host.includes(':')) {
    const lower = host.toLowerCase()

    return (
      lower === '::1' ||
      lower === '::' ||
      /^fe[89ab][0-9a-f]?:/.test(lower) ||
      /^f[cd][0-9a-f]{2}:/.test(lower) ||
      lower.startsWith('::ffff:') ||
      lower.startsWith('64:ff9b:') // NAT64 (RFC 6052 well-known + RFC 8215 local-use)
    )
  }

  return false
}

export const getClickHouseValidationIssues = (
  data: Pick<DestinationPanelSchemaType, 'clickhouseUrl' | 'clickhouseUser' | 'clickhouseDatabase'>
): ClickHouseValidationIssue[] => {
  const issues: ClickHouseValidationIssue[] = []

  if (!data.clickhouseUrl?.length) {
    issues.push({ path: 'clickhouseUrl', message: 'URL is required' })
  } else {
    let parsed: URL | undefined

    try {
      parsed = new URL(data.clickhouseUrl)
    } catch {
      issues.push({ path: 'clickhouseUrl', message: 'ClickHouse URL must be a valid URL' })
    }

    if (parsed) {
      if (parsed.protocol !== 'https:') {
        issues.push({ path: 'clickhouseUrl', message: 'ClickHouse URL must use https://' })
      } else {
        const host = parsed.hostname.replace(/^\[|\]$/g, '')

        if (isClickHouseHostInternal(host)) {
          issues.push({
            path: 'clickhouseUrl',
            message: 'ClickHouse URL must not target an internal address',
          })
        }
      }
    }
  }

  if (!data.clickhouseUser?.length) {
    issues.push({ path: 'clickhouseUser', message: 'User is required' })
  }

  if (!data.clickhouseDatabase?.length) {
    issues.push({ path: 'clickhouseDatabase', message: 'Database is required' })
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
      },
    }
  } else if (selectedType === 'Snowflake') {
    return {
      snowflake: {
        accountId: normalizeRequiredString(data.snowflakeAccountId),
        user: normalizeRequiredString(data.snowflakeUser),
        privateKey: data.snowflakePrivateKey ?? '',
        privateKeyPassphrase: normalizeOptionalUntrimmedString(data.snowflakePrivateKeyPassphrase),
        database: normalizeRequiredString(data.snowflakeDatabase),
        schema: normalizeRequiredString(data.snowflakeSchema),
        role: normalizeOptionalString(data.snowflakeRole),
      },
    }
  } else if (selectedType === 'ClickHouse') {
    return {
      clickHouse: {
        url: normalizeRequiredString(data.clickhouseUrl),
        user: normalizeRequiredString(data.clickhouseUser),
        password: normalizeOptionalString(data.clickhousePassword),
        database: normalizeRequiredString(data.clickhouseDatabase),
        engine: data.clickhouseEngine,
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
    }
    destinationConfig = { ducklake: ducklakeConfig }
  } else if (selectedType === 'Snowflake') {
    const snowflakeConfig: SnowflakeDestinationConfig = {
      accountId: normalizeRequiredString(data.snowflakeAccountId),
      user: normalizeRequiredString(data.snowflakeUser),
      privateKey: data.snowflakePrivateKey ?? '',
      privateKeyPassphrase: normalizeOptionalUntrimmedString(data.snowflakePrivateKeyPassphrase),
      database: normalizeRequiredString(data.snowflakeDatabase),
      schema: normalizeRequiredString(data.snowflakeSchema),
      role: normalizeOptionalString(data.snowflakeRole),
    }
    destinationConfig = { snowflake: snowflakeConfig }
  } else if (selectedType === 'ClickHouse') {
    const clickHouseConfig: ClickHouseDestinationConfig = {
      url: normalizeRequiredString(data.clickhouseUrl),
      user: normalizeRequiredString(data.clickhouseUser),
      password: normalizeOptionalString(data.clickhousePassword),
      database: normalizeRequiredString(data.clickhouseDatabase),
      engine: data.clickhouseEngine,
    }
    destinationConfig = { clickHouse: clickHouseConfig }
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
