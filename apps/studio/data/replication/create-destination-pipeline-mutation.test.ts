import { describe, expect, it } from 'vitest'

import { buildDucklakeApiConfig } from './create-destination-pipeline-mutation'

describe('buildDucklakeApiConfig', () => {
  it('maps a "Use Supabase" config with catalog-level pool size + metadata schema', () => {
    expect(
      buildDucklakeApiConfig({
        catalogProjectRef: 'catalog-ref',
        storageProjectRef: 'storage-ref',
        bucket: 'ducklake-data',
        poolSize: 4,
        metadataSchema: 'ducklake',
      })
    ).toEqual({
      ducklake: {
        catalog: {
          type: 'supabase_project',
          project_ref: 'catalog-ref',
          pool_size: 4,
          metadata_schema: 'ducklake',
        },
        storage: {
          type: 'supabase_storage',
          project_ref: 'storage-ref',
          bucket: 'ducklake-data',
        },
      },
    })
  })

  it('includes the optional path prefix when provided', () => {
    const config = buildDucklakeApiConfig({
      catalogProjectRef: 'catalog-ref',
      storageProjectRef: 'storage-ref',
      bucket: 'ducklake-data',
      path: 'replication',
    })

    expect(config).toMatchObject({
      ducklake: {
        storage: {
          type: 'supabase_storage',
          project_ref: 'storage-ref',
          bucket: 'ducklake-data',
          path: 'replication',
        },
      },
    })
  })

  it('maps a "Custom parameters" config to the flat snake_case payload', () => {
    expect(
      buildDucklakeApiConfig({
        catalogUrl: 'postgres://user:pass@host:5432/catalog',
        dataPath: 's3://bucket/path',
        poolSize: 4,
        s3AccessKeyId: 'access-key',
        s3SecretAccessKey: 'secret-key',
        s3Region: 'eu-west-1',
        s3Endpoint: 's3.example.com',
        s3UrlStyle: 'path',
        s3UseSsl: true,
        metadataSchema: 'ducklake',
      })
    ).toEqual({
      ducklake: {
        catalog_url: 'postgres://user:pass@host:5432/catalog',
        data_path: 's3://bucket/path',
        pool_size: 4,
        s3_access_key_id: 'access-key',
        s3_secret_access_key: 'secret-key',
        s3_region: 'eu-west-1',
        s3_endpoint: 's3.example.com',
        s3_url_style: 'path',
        s3_use_ssl: true,
        metadata_schema: 'ducklake',
      },
    })
  })

  it('omits blank custom secret fields when requested', () => {
    expect(
      buildDucklakeApiConfig(
        {
          catalogUrl: '  ',
          dataPath: 's3://bucket/path',
          poolSize: 4,
          s3AccessKeyId: '',
          s3SecretAccessKey: '\n',
          s3Region: 'eu-west-1',
          s3Endpoint: 's3.example.com',
          s3UrlStyle: 'path',
          s3UseSsl: true,
          metadataSchema: 'ducklake',
        },
        { omitBlankSecrets: true }
      )
    ).toEqual({
      ducklake: {
        catalog_url: undefined,
        data_path: 's3://bucket/path',
        pool_size: 4,
        s3_access_key_id: undefined,
        s3_secret_access_key: undefined,
        s3_region: 'eu-west-1',
        s3_endpoint: 's3.example.com',
        s3_url_style: 'path',
        s3_use_ssl: true,
        metadata_schema: 'ducklake',
      },
    })
  })
})
