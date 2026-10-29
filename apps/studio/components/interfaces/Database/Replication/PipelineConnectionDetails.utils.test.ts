import { describe, expect, test } from 'vitest'

import { getDestinationStorageRegion } from './PipelineConnectionDetails.utils'

describe('getDestinationStorageRegion', () => {
  test('uses the configured DuckLake storage region, including custom region names', () => {
    expect(
      getDestinationStorageRegion({
        ducklake: { data_path: 's3://bucket/', s3_region: 'custom-region' },
      })
    ).toBe('custom-region')
  })

  test('uses the Analytics Bucket storage region', () => {
    expect(
      getDestinationStorageRegion({
        iceberg: {
          supabase: { project_ref: 'project', warehouse_name: 'bucket', s3_region: 'us-east-1' },
        },
      })
    ).toBe('us-east-1')
  })

  test('omits a missing Analytics Bucket region in older stored configurations', () => {
    const config = {
      iceberg: {
        supabase: { project_ref: 'project', warehouse_name: 'bucket', s3_region: 'us-east-1' },
      },
    }
    Reflect.deleteProperty(config.iceberg.supabase, 's3_region')
    expect(getDestinationStorageRegion(config)).toBeUndefined()
  })

  test('does not infer storage region from a catalog or storage endpoint', () => {
    expect(
      getDestinationStorageRegion({
        ducklake: { data_path: 's3://bucket/', s3_endpoint: 's3.eu-central-1.amazonaws.com' },
      })
    ).toBeUndefined()
    expect(
      getDestinationStorageRegion({
        iceberg: {
          rest: {
            catalog_uri: 'https://eu-central-1.example.com',
            s3_endpoint: 'https://s3.example.com',
            warehouse_name: 'bucket',
          },
        },
      })
    ).toBeUndefined()
  })

  test('omits missing or empty regions', () => {
    expect(getDestinationStorageRegion()).toBeUndefined()
    expect(
      getDestinationStorageRegion({ ducklake: { data_path: 's3://bucket/', s3_region: ' ' } })
    ).toBeUndefined()
    expect(
      getDestinationStorageRegion({ big_query: { project_id: 'project', dataset_id: 'dataset' } })
    ).toBeUndefined()
  })
})
