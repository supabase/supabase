import { type DestinationPanelSchemaType } from '../DestinationForm.schema'
import { DUCKLAKE_MODE_SUPABASE } from './DuckLake.constants'

export type DucklakeApiConfig = {
  catalog_url: string
  data_path: string
  pool_size?: number
  s3_access_key_id?: string
  s3_secret_access_key?: string
  s3_region?: string
  s3_endpoint?: string
  s3_url_style?: 'path' | 'vhost'
  s3_use_ssl?: boolean
  metadata_schema?: string
}

// Fields entered when configuring DuckLake manually (always present in the validation data).
const DUCKLAKE_INPUT_FIELD_PATHS = [
  'ducklakeCatalogUrl',
  'ducklakeDataPath',
  'ducklakeS3AccessKeyId',
  'ducklakeS3SecretAccessKey',
  'ducklakeS3Region',
  'ducklakeS3Endpoint',
  'ducklakeMetadataSchema',
] as const

// Fields entered only in "Use Supabase" mode (optional in the validation data).
const DUCKLAKE_SUPABASE_FIELD_PATHS = [
  'ducklakeCatalogProjectRef',
  'ducklakeStorageProjectRef',
  'ducklakeStorageBucket',
] as const

type DucklakeFieldPath =
  | (typeof DUCKLAKE_INPUT_FIELD_PATHS)[number]
  | (typeof DUCKLAKE_SUPABASE_FIELD_PATHS)[number]

export type DucklakeValidationIssue = {
  path: DucklakeFieldPath
  message: string
}

type DucklakeValidationData = Pick<
  DestinationPanelSchemaType,
  (typeof DUCKLAKE_INPUT_FIELD_PATHS)[number]
> &
  Partial<
    Pick<
      DestinationPanelSchemaType,
      'ducklakeMode' | (typeof DUCKLAKE_SUPABASE_FIELD_PATHS)[number]
    >
  >

export const getDucklakeValidationIssues = (
  data: DucklakeValidationData
): DucklakeValidationIssue[] => {
  // "Use Supabase" mode only needs project refs + a bucket; the catalog URL and S3 credentials
  // are resolved by the platform API.
  if (data.ducklakeMode === DUCKLAKE_MODE_SUPABASE) {
    const supabaseIssues: DucklakeValidationIssue[] = []

    if (!data.ducklakeCatalogProjectRef?.length) {
      supabaseIssues.push({
        path: 'ducklakeCatalogProjectRef',
        message: 'Catalog project is required',
      })
    }

    if (!data.ducklakeStorageProjectRef?.length) {
      supabaseIssues.push({
        path: 'ducklakeStorageProjectRef',
        message: 'Storage project is required',
      })
    }

    if (!data.ducklakeStorageBucket?.length) {
      supabaseIssues.push({ path: 'ducklakeStorageBucket', message: 'Bucket is required' })
    }

    // Catalog metadata schema is optional, but must be a valid Postgres identifier when set.
    if (data.ducklakeMetadataSchema && !/^[A-Za-z0-9_]+$/.test(data.ducklakeMetadataSchema)) {
      supabaseIssues.push({
        path: 'ducklakeMetadataSchema',
        message: 'DuckLake metadata schema must contain only letters, numbers, and underscores',
      })
    }

    return supabaseIssues
  }

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
