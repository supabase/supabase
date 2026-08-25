import { describe, expect, it } from 'vitest'

import {
  buildBigQueryApiConfig,
  buildDucklakeApiConfig,
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

  it('omits table_options when none are configured', () => {
    expect(buildBigQueryApiConfig(baseConfig)).toEqual({
      big_query: {
        project_id: 'my-project',
        dataset_id: 'analytics',
        service_account_key: '{}',
        connection_pool_size: undefined,
        max_staleness_mins: undefined,
        table_options: undefined,
      },
    })
  })

  it('maps per-table partitioning and clustering to the API shape', () => {
    expect(
      buildBigQueryApiConfig({
        ...baseConfig,
        tableOptions: [
          {
            tableId: 16_408,
            partitionBy: { kind: 'time_column', column: 'created_at', granularity: 'day' },
            clusterBy: ['customer_id', 'region'],
          },
          {
            tableId: 16_409,
            partitionBy: {
              kind: 'integer_range',
              column: 'shard',
              start: 0,
              end: 100,
              interval: 10,
            },
          },
        ],
      })
    ).toMatchObject({
      big_query: {
        table_options: {
          tables: [
            {
              table_id: 16_408,
              partition_by: { kind: 'time_column', column: 'created_at', granularity: 'day' },
              cluster_by: ['customer_id', 'region'],
            },
            {
              table_id: 16_409,
              partition_by: {
                kind: 'integer_range',
                column: 'shard',
                start: 0,
                end: 100,
                interval: 10,
              },
              cluster_by: undefined,
            },
          ],
        },
      },
    })
  })

  it('omits a table entry that has neither partitioning nor clustering set', () => {
    expect(
      buildBigQueryApiConfig({
        ...baseConfig,
        tableOptions: [
          { tableId: 16_408, partitionBy: undefined, clusterBy: [] },
          {
            tableId: 16_409,
            partitionBy: { kind: 'ingestion_time', granularity: 'day' },
          },
        ],
      })
    ).toMatchObject({
      big_query: {
        table_options: {
          tables: [
            {
              table_id: 16_409,
              partition_by: { kind: 'ingestion_time', granularity: 'day' },
            },
          ],
        },
      },
    })
  })

  it('sends table_options: null on update when every configured table is removed or blank', () => {
    expect(
      buildBigQueryApiConfig(
        { ...baseConfig, tableOptions: [{ tableId: 16_408, clusterBy: [] }] },
        { omitBlankSecrets: true }
      )
    ).toMatchObject({ big_query: { table_options: null } })
  })

  it('sends table_options: null on update when every configured table is removed', () => {
    expect(
      buildBigQueryApiConfig({ ...baseConfig, tableOptions: [] }, { omitBlankSecrets: true })
    ).toMatchObject({ big_query: { table_options: null } })
  })

  it('omits blank service_account_key on update, but not on create', () => {
    const config = { ...baseConfig, serviceAccountKey: '' }

    expect(buildBigQueryApiConfig(config).big_query.service_account_key).toBe('')
    expect(
      buildBigQueryApiConfig(config, { omitBlankSecrets: true }).big_query.service_account_key
    ).toBeUndefined()
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
