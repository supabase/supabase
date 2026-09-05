import { describe, expect, it } from 'vitest'

import {
  buildBigQueryApiConfig,
  buildBigQueryUpdateApiConfig,
  buildDucklakeApiConfig,
  buildDucklakeUpdateApiConfig,
  buildPipelineApiConfig,
} from './create-destination-pipeline-mutation'

describe('buildPipelineApiConfig', () => {
  it('maps selective initial-copy configuration to the ETL API shape', () => {
    expect(
      buildPipelineApiConfig({
        publicationName: 'analytics',
        batch: { maxFillMs: 500, maxBytes: 8_388_608, memoryBudgetRatio: 0.2 },
        maxTableSyncWorkers: 4,
        maxCopyConnectionsPerTable: 2,
        invalidatedSlotBehavior: 'recreate',
        tableSyncCopy: { type: 'skip_tables', table_ids: [101, 202] },
      })
    ).toEqual({
      publication_name: 'analytics',
      batch: { max_fill_ms: 500, max_bytes: 8_388_608, memory_budget_ratio: 0.2 },
      max_table_sync_workers: 4,
      max_copy_connections_per_table: 2,
      invalidated_slot_behavior: 'recreate',
      table_sync_copy: { type: 'skip_tables', table_ids: [101, 202] },
    })
  })
})

describe('buildBigQueryApiConfig', () => {
  const baseConfig = {
    projectId: 'my-project',
    datasetId: 'analytics',
    serviceAccountKey: '{}',
  }

  it('maps the destination config to the API shape', () => {
    expect(buildBigQueryApiConfig(baseConfig)).toEqual({
      big_query: {
        project_id: 'my-project',
        dataset_id: 'analytics',
        service_account_key: '{}',
        connection_pool_size: undefined,
        max_staleness_mins: undefined,
      },
    })
  })

  it('omits blank service_account_key on update, but not on create', () => {
    const config = { ...baseConfig, serviceAccountKey: '' }

    expect(buildBigQueryApiConfig(config).big_query.service_account_key).toBe('')
    expect(buildBigQueryUpdateApiConfig(config).big_query.service_account_key).toBeUndefined()
  })
})

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
      buildDucklakeUpdateApiConfig({
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
      })
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
