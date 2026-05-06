import { describe, expect, it, vi } from 'vitest'

import {
  buildDestinationConfig,
  buildDestinationConfigForValidation,
  getDucklakeValidationIssues,
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
  ducklakeExpireSnapshotsOlderThan: ' 7 days ',
}

describe('DestinationForm.utils DuckLake', () => {
  it('builds DuckLake validation config with required fields trimmed and blank optionals removed', () => {
    const config = buildDestinationConfigForValidation({
      projectRef: 'project-ref',
      selectedType: 'DuckLake',
      data: {
        ...baseDucklakeFormData,
        ducklakeMetadataSchema: '   ',
        ducklakeExpireSnapshotsOlderThan: '   ',
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
        expireSnapshotsOlderThan: undefined,
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
        expireSnapshotsOlderThan: '7 days',
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
