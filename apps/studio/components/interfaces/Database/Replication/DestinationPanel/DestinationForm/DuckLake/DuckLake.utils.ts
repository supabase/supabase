import { type DestinationPanelSchemaType } from '../DestinationForm.schema'

export type DucklakeApiConfig = {
  catalog_url?: string
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

const DUCKLAKE_INPUT_FIELD_PATHS = [
  'ducklakeCatalogUrl',
  'ducklakeDataPath',
  'ducklakeS3AccessKeyId',
  'ducklakeS3SecretAccessKey',
  'ducklakeS3Region',
  'ducklakeS3Endpoint',
  'ducklakeMetadataSchema',
] as const

type DucklakeFieldPath = (typeof DUCKLAKE_INPUT_FIELD_PATHS)[number]

export type DucklakeValidationIssue = {
  path: DucklakeFieldPath
  message: string
}

type DucklakeValidationData = Pick<
  DestinationPanelSchemaType,
  (typeof DUCKLAKE_INPUT_FIELD_PATHS)[number]
>

const DUCKLAKE_REQUIRED_FIELDS: DucklakeValidationIssue[] = [
  { path: 'ducklakeCatalogUrl', message: 'Catalog URL is required.' },
  { path: 'ducklakeDataPath', message: 'Data path is required.' },
  { path: 'ducklakeS3AccessKeyId', message: 'S3 access key ID is required.' },
  { path: 'ducklakeS3SecretAccessKey', message: 'S3 secret access key is required.' },
  { path: 'ducklakeS3Region', message: 'S3 region is required.' },
  { path: 'ducklakeS3Endpoint', message: 'S3 endpoint is required.' },
]

const DUCKLAKE_SECRET_FIELDS = new Set<DucklakeFieldPath>([
  'ducklakeCatalogUrl',
  'ducklakeS3AccessKeyId',
  'ducklakeS3SecretAccessKey',
])

// Catalog metadata schema is optional, but must be a valid Postgres identifier when set.
const METADATA_SCHEMA_PATTERN = /^[A-Za-z0-9_]+$/
const METADATA_SCHEMA_ISSUE: DucklakeValidationIssue = {
  path: 'ducklakeMetadataSchema',
  message: 'DuckLake metadata schema must contain only letters, numbers, and underscores.',
}

const getMissingRequiredFieldIssues = (
  data: DucklakeValidationData,
  requiredFields: DucklakeValidationIssue[]
) => requiredFields.filter(({ path }) => !data[path]?.trim().length)

export const getDucklakeValidationIssues = (
  data: DucklakeValidationData,
  options: { secretsOptional?: boolean } = {}
): DucklakeValidationIssue[] => {
  const requiredFields = options.secretsOptional
    ? DUCKLAKE_REQUIRED_FIELDS.filter(({ path }) => !DUCKLAKE_SECRET_FIELDS.has(path))
    : DUCKLAKE_REQUIRED_FIELDS
  const issues = getMissingRequiredFieldIssues(data, requiredFields)

  if (
    options.secretsOptional &&
    data.ducklakeS3SecretAccessKey?.trim().length &&
    !data.ducklakeS3AccessKeyId?.trim().length
  ) {
    issues.push({
      path: 'ducklakeS3AccessKeyId',
      message: 'S3 access key ID is required.',
    })
  }

  if (
    options.secretsOptional &&
    data.ducklakeS3AccessKeyId?.trim().length &&
    !data.ducklakeS3SecretAccessKey?.trim().length
  ) {
    issues.push({
      path: 'ducklakeS3SecretAccessKey',
      message: 'S3 secret access key is required.',
    })
  }

  // Format checks only apply once a value is present; missing values are already flagged above.
  if (
    data.ducklakeCatalogUrl?.trim().length &&
    !data.ducklakeCatalogUrl.startsWith('postgres://') &&
    !data.ducklakeCatalogUrl.startsWith('postgresql://')
  ) {
    issues.push({
      path: 'ducklakeCatalogUrl',
      message: 'DuckLake catalog URL must be a PostgreSQL-compatible URL.',
    })
  }

  if (
    data.ducklakeDataPath?.trim().length &&
    (!data.ducklakeDataPath.startsWith('s3://') || data.ducklakeDataPath.includes('file://'))
  ) {
    issues.push({
      path: 'ducklakeDataPath',
      message: 'DuckLake data path must start with s3:// and cannot contain file://.',
    })
  }

  if (
    data.ducklakeS3Endpoint?.trim().length &&
    (data.ducklakeS3Endpoint.startsWith('http://') ||
      data.ducklakeS3Endpoint.startsWith('https://'))
  ) {
    issues.push({
      path: 'ducklakeS3Endpoint',
      message: 'S3 endpoint must not contain the protocol scheme.',
    })
  }

  if (data.ducklakeMetadataSchema && !METADATA_SCHEMA_PATTERN.test(data.ducklakeMetadataSchema)) {
    issues.push(METADATA_SCHEMA_ISSUE)
  }

  return issues
}
