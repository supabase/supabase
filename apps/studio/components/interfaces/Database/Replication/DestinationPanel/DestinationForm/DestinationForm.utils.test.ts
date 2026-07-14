import { describe, expect, it, vi } from 'vitest'

import { getAnalyticsBucketValidationIssues } from './AnalyticsBucket/AnalyticsBucket.utils'
import { getBigQueryValidationIssues } from './BigQuery/BigQuery.utils'
import { CREATE_NEW_KEY, CREATE_NEW_NAMESPACE } from './DestinationForm.constants'
import {
  buildDestinationConfig,
  buildDestinationConfigForValidation,
} from './DestinationForm.utils'
import { getDucklakeValidationIssues } from './DuckLake/DuckLake.utils'
import { getSnowflakeValidationIssues } from './Snowflake/Snowflake.utils'

const baseDucklakeFormData = {
  name: 'DuckLake Destination',
  publicationName: 'pub',
  maxFillMs: undefined,
  maxTableSyncWorkers: undefined,
  maxCopyConnectionsPerTable: undefined,
  invalidatedSlotBehavior: undefined,
  projectId: undefined,
  datasetId: undefined,
  serviceAccountKey: undefined,
  connectionPoolSize: undefined,
  maxStalenessMins: undefined,
  warehouseName: undefined,
  namespace: undefined,
  newNamespaceName: undefined,
  catalogToken: undefined,
  s3AccessKeyId: undefined,
  s3SecretAccessKey: undefined,
  s3Region: undefined,
  ducklakeCatalogUrl: 'postgres://user:pass@host:5432/catalog',
  ducklakeDataPath: 's3://bucket/path',
  ducklakePoolSize: 4,
  ducklakeS3AccessKeyId: ' access-key ',
  ducklakeS3SecretAccessKey: ' secret-key ',
  ducklakeS3Region: ' eu-west-1 ',
  ducklakeS3Endpoint: ' s3.example.com ',
  ducklakeS3UrlStyle: 'path' as const,
  ducklakeS3UseSsl: true,
  ducklakeMetadataSchema: ' ducklake_metadata ',
}

const baseSnowflakeFormData = {
  name: 'Snowflake Destination',
  publicationName: 'pub',
  maxFillMs: undefined,
  maxTableSyncWorkers: undefined,
  maxCopyConnectionsPerTable: undefined,
  invalidatedSlotBehavior: undefined,
  projectId: undefined,
  datasetId: undefined,
  serviceAccountKey: undefined,
  connectionPoolSize: undefined,
  maxStalenessMins: undefined,
  warehouseName: undefined,
  namespace: undefined,
  newNamespaceName: undefined,
  catalogToken: undefined,
  s3AccessKeyId: undefined,
  s3SecretAccessKey: undefined,
  s3Region: undefined,
  ducklakeCatalogUrl: undefined,
  ducklakeDataPath: undefined,
  ducklakePoolSize: undefined,
  ducklakeS3AccessKeyId: undefined,
  ducklakeS3SecretAccessKey: undefined,
  ducklakeS3Region: undefined,
  ducklakeS3Endpoint: undefined,
  ducklakeS3UrlStyle: undefined,
  ducklakeS3UseSsl: undefined,
  ducklakeMetadataSchema: undefined,
  snowflakeAccountId: ' MYORG-MYACCOUNT ',
  snowflakeUser: ' PIPELINES_USER ',
  snowflakePrivateKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
  snowflakePrivateKeyPassphrase: ' secret passphrase ',
  snowflakeDatabase: ' ANALYTICS ',
  snowflakeSchema: ' PUBLIC ',
  snowflakeRole: ' PIPELINES_ROLE ',
}

describe('DestinationForm.utils DuckLake', () => {
  it('builds DuckLake validation config with required fields trimmed and blank optionals removed', () => {
    const config = buildDestinationConfigForValidation({
      projectRef: 'project-ref',
      selectedType: 'DuckLake',
      data: {
        ...baseDucklakeFormData,
        ducklakeMetadataSchema: '   ',
      },
    })

    expect(config).toEqual({
      ducklake: {
        catalogUrl: 'postgres://user:pass@host:5432/catalog',
        dataPath: 's3://bucket/path',
        poolSize: 4,
        s3AccessKeyId: 'access-key',
        s3SecretAccessKey: 'secret-key',
        s3Region: 'eu-west-1',
        s3Endpoint: 's3.example.com',
        s3UrlStyle: 'path',
        s3UseSsl: true,
        metadataSchema: undefined,
      },
    })
  })

  it('builds DuckLake submit config with normalized values', async () => {
    const createS3AccessKey = vi.fn()
    const resolveNamespace = vi.fn()

    const config = await buildDestinationConfig({
      projectRef: 'project-ref',
      selectedType: 'DuckLake',
      data: baseDucklakeFormData,
      createS3AccessKey,
      resolveNamespace,
    })

    expect(config).toEqual({
      ducklake: {
        catalogUrl: 'postgres://user:pass@host:5432/catalog',
        dataPath: 's3://bucket/path',
        poolSize: 4,
        s3AccessKeyId: 'access-key',
        s3SecretAccessKey: 'secret-key',
        s3Region: 'eu-west-1',
        s3Endpoint: 's3.example.com',
        s3UrlStyle: 'path',
        s3UseSsl: true,
        metadataSchema: 'ducklake_metadata',
      },
    })
    expect(createS3AccessKey).not.toHaveBeenCalled()
    expect(resolveNamespace).not.toHaveBeenCalled()
  })

  it('returns required-field errors for missing DuckLake settings', () => {
    const issues = getDucklakeValidationIssues({
      ducklakeCatalogUrl: '',
      ducklakeDataPath: '',
      ducklakeS3AccessKeyId: '',
      ducklakeS3SecretAccessKey: '',
      ducklakeS3Region: '',
      ducklakeS3Endpoint: '',
      ducklakeMetadataSchema: '',
    })

    expect(issues).toEqual([
      { path: 'ducklakeCatalogUrl', message: 'Catalog URL is required' },
      { path: 'ducklakeDataPath', message: 'Data path is required' },
      { path: 'ducklakeS3AccessKeyId', message: 'S3 Access Key ID is required' },
      { path: 'ducklakeS3SecretAccessKey', message: 'S3 Secret Access Key is required' },
      { path: 'ducklakeS3Region', message: 'S3 Region is required' },
      { path: 'ducklakeS3Endpoint', message: 'S3 Endpoint is required' },
    ])
  })

  it('allows omitted DuckLake secrets in edit mode', () => {
    const issues = getDucklakeValidationIssues(
      {
        ducklakeCatalogUrl: '',
        ducklakeDataPath: 's3://bucket/path',
        ducklakeS3AccessKeyId: '',
        ducklakeS3SecretAccessKey: '',
        ducklakeS3Region: 'eu-west-1',
        ducklakeS3Endpoint: 's3.example.com',
        ducklakeMetadataSchema: '',
      },
      { secretsOptional: true }
    )

    expect(issues).toEqual([])
  })

  it('requires both DuckLake S3 key fields when replacing one secret in edit mode', () => {
    const issues = getDucklakeValidationIssues(
      {
        ducklakeCatalogUrl: '',
        ducklakeDataPath: 's3://bucket/path',
        ducklakeS3AccessKeyId: 'access-key',
        ducklakeS3SecretAccessKey: '',
        ducklakeS3Region: 'eu-west-1',
        ducklakeS3Endpoint: 's3.example.com',
        ducklakeMetadataSchema: '',
      },
      { secretsOptional: true }
    )

    expect(issues).toEqual([
      { path: 'ducklakeS3SecretAccessKey', message: 'S3 Secret Access Key is required' },
    ])
  })

  it('treats whitespace-only values as missing', () => {
    const issues = getDucklakeValidationIssues({
      ducklakeCatalogUrl: '   ',
      ducklakeDataPath: '\t',
      ducklakeS3AccessKeyId: ' ',
      ducklakeS3SecretAccessKey: '  ',
      ducklakeS3Region: '\n',
      ducklakeS3Endpoint: ' ',
      ducklakeMetadataSchema: '',
    })

    expect(issues).toEqual([
      { path: 'ducklakeCatalogUrl', message: 'Catalog URL is required' },
      { path: 'ducklakeDataPath', message: 'Data path is required' },
      { path: 'ducklakeS3AccessKeyId', message: 'S3 Access Key ID is required' },
      { path: 'ducklakeS3SecretAccessKey', message: 'S3 Secret Access Key is required' },
      { path: 'ducklakeS3Region', message: 'S3 Region is required' },
      { path: 'ducklakeS3Endpoint', message: 'S3 Endpoint is required' },
    ])
  })

  it('returns format errors for invalid DuckLake values', () => {
    const issues = getDucklakeValidationIssues({
      ducklakeCatalogUrl: 'mysql://catalog',
      ducklakeDataPath: 'file://bucket/path',
      ducklakeS3AccessKeyId: 'access-key',
      ducklakeS3SecretAccessKey: 'secret-key',
      ducklakeS3Region: 'eu-west-1',
      ducklakeS3Endpoint: 'https://s3.example.com',
      ducklakeMetadataSchema: 'ducklake-schema',
    })

    expect(issues).toEqual([
      {
        path: 'ducklakeCatalogUrl',
        message: 'DuckLake catalog URL must be a PostgreSQL-compatible URL',
      },
      {
        path: 'ducklakeDataPath',
        message: 'DuckLake data path must start with s3:// and cannot contain file://',
      },
      {
        path: 'ducklakeS3Endpoint',
        message: 'S3 endpoint should not contain the protocol scheme',
      },
      {
        path: 'ducklakeMetadataSchema',
        message: 'DuckLake metadata schema must contain only letters, numbers, and underscores',
      },
    ])
  })

  it('accepts a valid DuckLake configuration', () => {
    expect(
      getDucklakeValidationIssues({
        ducklakeCatalogUrl: 'postgresql://user:pass@host:5432/catalog',
        ducklakeDataPath: 's3://bucket/path',
        ducklakeS3AccessKeyId: 'access-key',
        ducklakeS3SecretAccessKey: 'secret-key',
        ducklakeS3Region: 'eu-west-1',
        ducklakeS3Endpoint: 's3.example.com',
        ducklakeMetadataSchema: 'ducklake_schema_1',
      })
    ).toEqual([])
  })
})

const baseDucklakeSupabaseFormData = {
  ...baseDucklakeFormData,
  ducklakeMode: 'supabase' as const,
  ducklakeCatalogProjectRef: 'catalog-ref',
  ducklakeStorageProjectRef: 'storage-ref',
  ducklakeStorageBucket: 'ducklake-data',
}

describe('DestinationForm.utils DuckLake (Use Supabase)', () => {
  it('builds DuckLake validation config from project refs in supabase mode', () => {
    const config = buildDestinationConfigForValidation({
      projectRef: 'project-ref',
      selectedType: 'DuckLake',
      data: baseDucklakeSupabaseFormData,
    })

    expect(config).toEqual({
      ducklake: {
        catalogProjectRef: 'catalog-ref',
        storageProjectRef: 'storage-ref',
        bucket: 'ducklake-data',
        poolSize: 4,
        metadataSchema: 'ducklake_metadata',
      },
    })
  })

  it('builds DuckLake submit config from project refs in supabase mode', async () => {
    const createS3AccessKey = vi.fn()
    const resolveNamespace = vi.fn()

    const config = await buildDestinationConfig({
      projectRef: 'project-ref',
      selectedType: 'DuckLake',
      data: baseDucklakeSupabaseFormData,
      createS3AccessKey,
      resolveNamespace,
    })

    expect(config).toEqual({
      ducklake: {
        catalogProjectRef: 'catalog-ref',
        storageProjectRef: 'storage-ref',
        bucket: 'ducklake-data',
        poolSize: 4,
        metadataSchema: 'ducklake_metadata',
      },
    })
    expect(createS3AccessKey).not.toHaveBeenCalled()
    expect(resolveNamespace).not.toHaveBeenCalled()
  })

  it('returns required-field errors for missing supabase selections, ignoring custom fields', () => {
    const issues = getDucklakeValidationIssues({
      ducklakeMode: 'supabase',
      ducklakeCatalogProjectRef: '',
      ducklakeStorageProjectRef: '',
      ducklakeStorageBucket: '',
      // Custom-mode fields are intentionally blank and must not be validated in supabase mode
      ducklakeCatalogUrl: '',
      ducklakeDataPath: '',
      ducklakeS3AccessKeyId: '',
      ducklakeS3SecretAccessKey: '',
      ducklakeS3Region: '',
      ducklakeS3Endpoint: '',
      ducklakeMetadataSchema: '',
    })

    expect(issues).toEqual([
      { path: 'ducklakeCatalogProjectRef', message: 'Catalog project is required' },
      { path: 'ducklakeStorageProjectRef', message: 'Storage project is required' },
      { path: 'ducklakeStorageBucket', message: 'Bucket is required' },
    ])
  })

  it('accepts a complete supabase configuration', () => {
    expect(
      getDucklakeValidationIssues({
        ducklakeMode: 'supabase',
        ducklakeCatalogProjectRef: 'catalog-ref',
        ducklakeStorageProjectRef: 'storage-ref',
        ducklakeStorageBucket: 'ducklake-data',
        ducklakeCatalogUrl: '',
        ducklakeDataPath: '',
        ducklakeS3AccessKeyId: '',
        ducklakeS3SecretAccessKey: '',
        ducklakeS3Region: '',
        ducklakeS3Endpoint: '',
        ducklakeMetadataSchema: '',
      })
    ).toEqual([])
  })
})

describe('DestinationForm.utils Snowflake', () => {
  it('builds Snowflake validation config with identifiers trimmed and secrets preserved', () => {
    const config = buildDestinationConfigForValidation({
      projectRef: 'project-ref',
      selectedType: 'Snowflake',
      data: {
        ...baseSnowflakeFormData,
        snowflakePrivateKeyPassphrase: '',
        snowflakeRole: '   ',
      },
    })

    expect(config).toEqual({
      snowflake: {
        accountId: 'MYORG-MYACCOUNT',
        user: 'PIPELINES_USER',
        privateKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
        privateKeyPassphrase: undefined,
        database: 'ANALYTICS',
        schema: 'PUBLIC',
        role: undefined,
      },
    })
  })

  it('builds Snowflake submit config with normalized values', async () => {
    const createS3AccessKey = vi.fn()
    const resolveNamespace = vi.fn()

    const config = await buildDestinationConfig({
      projectRef: 'project-ref',
      selectedType: 'Snowflake',
      data: baseSnowflakeFormData,
      createS3AccessKey,
      resolveNamespace,
    })

    expect(config).toEqual({
      snowflake: {
        accountId: 'MYORG-MYACCOUNT',
        user: 'PIPELINES_USER',
        privateKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
        privateKeyPassphrase: ' secret passphrase ',
        database: 'ANALYTICS',
        schema: 'PUBLIC',
        role: 'PIPELINES_ROLE',
      },
    })
    expect(createS3AccessKey).not.toHaveBeenCalled()
    expect(resolveNamespace).not.toHaveBeenCalled()
  })

  it('returns required-field errors for missing Snowflake settings', () => {
    const issues = getSnowflakeValidationIssues({
      snowflakeAccountId: '',
      snowflakeUser: '',
      snowflakePrivateKey: '',
      snowflakeDatabase: '',
      snowflakeSchema: '',
    })

    expect(issues).toEqual([
      { path: 'snowflakeAccountId', message: 'Account ID is required' },
      { path: 'snowflakeUser', message: 'User is required' },
      { path: 'snowflakePrivateKey', message: 'Private key is required' },
      { path: 'snowflakeDatabase', message: 'Database is required' },
      { path: 'snowflakeSchema', message: 'Schema is required' },
    ])
  })

  it('allows an omitted Snowflake private key in edit mode', () => {
    const issues = getSnowflakeValidationIssues(
      {
        snowflakeAccountId: 'MYORG-MYACCOUNT',
        snowflakeUser: 'PIPELINES_USER',
        snowflakePrivateKey: '',
        snowflakeDatabase: 'ANALYTICS',
        snowflakeSchema: 'PUBLIC',
      },
      { secretsOptional: true }
    )

    expect(issues).toEqual([])
  })
})

describe('DestinationForm.utils BigQuery', () => {
  it('returns required-field errors for missing BigQuery settings', () => {
    const issues = getBigQueryValidationIssues({
      projectId: '',
      datasetId: '',
      serviceAccountKey: '',
    })

    expect(issues).toEqual([
      { path: 'projectId', message: 'Project ID is required' },
      { path: 'datasetId', message: 'Dataset ID is required' },
      { path: 'serviceAccountKey', message: 'Service Account Key is required' },
    ])
  })

  it('treats whitespace-only values as missing', () => {
    const issues = getBigQueryValidationIssues({
      projectId: '   ',
      datasetId: '\t',
      serviceAccountKey: '\n',
    })

    expect(issues).toEqual([
      { path: 'projectId', message: 'Project ID is required' },
      { path: 'datasetId', message: 'Dataset ID is required' },
      { path: 'serviceAccountKey', message: 'Service Account Key is required' },
    ])
  })

  it('returns no issues for a complete configuration', () => {
    const issues = getBigQueryValidationIssues({
      projectId: 'my-project',
      datasetId: 'my_dataset',
      serviceAccountKey: '{ "type": "service_account" }',
    })

    expect(issues).toEqual([])
  })

  it('allows an omitted BigQuery service account key in edit mode', () => {
    const issues = getBigQueryValidationIssues(
      {
        projectId: 'my-project',
        datasetId: 'my_dataset',
        serviceAccountKey: '',
      },
      { secretsOptional: true }
    )

    expect(issues).toEqual([])
  })
})

describe('DestinationForm.utils Analytics Bucket', () => {
  it('returns required-field errors for an empty configuration', () => {
    const issues = getAnalyticsBucketValidationIssues({
      warehouseName: '',
      namespace: '',
      newNamespaceName: '',
      s3Region: '',
      s3AccessKeyId: '',
      s3SecretAccessKey: '',
    })

    expect(issues).toEqual([
      { path: 'warehouseName', message: 'Bucket is required' },
      { path: 's3Region', message: 'S3 Region is required' },
      { path: 's3AccessKeyId', message: 'S3 Access Key ID is required' },
      { path: 'namespace', message: 'Namespace is required' },
      { path: 's3SecretAccessKey', message: 'S3 Secret Access Key is required' },
    ])
  })

  it('treats whitespace-only values as missing', () => {
    const issues = getAnalyticsBucketValidationIssues({
      warehouseName: '   ',
      namespace: '  ',
      newNamespaceName: '',
      s3Region: '\t',
      s3AccessKeyId: ' ',
      s3SecretAccessKey: '  ',
    })

    expect(issues).toEqual([
      { path: 'warehouseName', message: 'Bucket is required' },
      { path: 's3Region', message: 'S3 Region is required' },
      { path: 's3AccessKeyId', message: 'S3 Access Key ID is required' },
      { path: 'namespace', message: 'Namespace is required' },
      { path: 's3SecretAccessKey', message: 'S3 Secret Access Key is required' },
    ])
  })

  it('requires a name when creating a new namespace', () => {
    const issues = getAnalyticsBucketValidationIssues({
      warehouseName: 'bucket',
      namespace: CREATE_NEW_NAMESPACE,
      newNamespaceName: '',
      s3Region: 'us-east-1',
      s3AccessKeyId: 'key',
      s3SecretAccessKey: 'secret',
    })

    expect(issues).toEqual([{ path: 'newNamespaceName', message: 'Namespace name is required' }])
  })

  it('skips the S3 secret when creating a new access key', () => {
    const issues = getAnalyticsBucketValidationIssues({
      warehouseName: 'bucket',
      namespace: 'analytics',
      newNamespaceName: '',
      s3Region: 'us-east-1',
      s3AccessKeyId: CREATE_NEW_KEY,
      s3SecretAccessKey: '',
    })

    expect(issues).toEqual([])
  })

  it('allows omitted S3 key fields in edit mode', () => {
    const issues = getAnalyticsBucketValidationIssues(
      {
        warehouseName: 'bucket',
        namespace: 'analytics',
        newNamespaceName: '',
        s3Region: 'us-east-1',
        s3AccessKeyId: '',
        s3SecretAccessKey: '',
      },
      { secretsOptional: true }
    )

    expect(issues).toEqual([])
  })

  it('allows an omitted S3 secret for an unchanged Analytics Bucket key in edit mode', () => {
    const issues = getAnalyticsBucketValidationIssues(
      {
        warehouseName: 'bucket',
        namespace: 'analytics',
        newNamespaceName: '',
        s3Region: 'us-east-1',
        s3AccessKeyId: 'stored-key',
        s3SecretAccessKey: '',
      },
      { secretsOptional: true, storedS3AccessKeyId: 'stored-key' }
    )

    expect(issues).toEqual([])
  })

  it('requires an S3 secret when replacing an Analytics Bucket key in edit mode', () => {
    const issues = getAnalyticsBucketValidationIssues(
      {
        warehouseName: 'bucket',
        namespace: 'analytics',
        newNamespaceName: '',
        s3Region: 'us-east-1',
        s3AccessKeyId: 'new-key',
        s3SecretAccessKey: '',
      },
      { secretsOptional: true, storedS3AccessKeyId: 'stored-key' }
    )

    expect(issues).toEqual([
      { path: 's3SecretAccessKey', message: 'S3 Secret Access Key is required' },
    ])
  })

  it('returns no issues for a complete configuration', () => {
    const issues = getAnalyticsBucketValidationIssues({
      warehouseName: 'bucket',
      namespace: CREATE_NEW_NAMESPACE,
      newNamespaceName: 'new_namespace',
      s3Region: 'us-east-1',
      s3AccessKeyId: 'key',
      s3SecretAccessKey: 'secret',
    })

    expect(issues).toEqual([])
  })
})
