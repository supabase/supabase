import { describe, expect, it, vi } from 'vitest'

import {
  buildDestinationConfig,
  buildDestinationConfigForValidation,
  getDucklakeValidationIssues,
  getSnowflakeValidationIssues,
} from './DestinationForm.utils'

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
  snowflakeUser: ' ETL_USER ',
  snowflakePrivateKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
  snowflakePrivateKeyPassphrase: ' secret passphrase ',
  snowflakeDatabase: ' ANALYTICS ',
  snowflakeSchema: ' PUBLIC ',
  snowflakeRole: ' ETL_ROLE ',
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
        user: 'ETL_USER',
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
        user: 'ETL_USER',
        privateKey: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
        privateKeyPassphrase: ' secret passphrase ',
        database: 'ANALYTICS',
        schema: 'PUBLIC',
        role: 'ETL_ROLE',
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
})
