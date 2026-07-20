import { describe, expect, it } from 'vitest'

import {
  buildDuckDbCatalogConnectionString,
  getWarehouseCatalogEngineContent,
} from './warehouseCatalog.constants'
import type { WarehouseCatalogCredentials } from '@/data/warehouse/warehouse-catalog-query'

describe('buildDuckDbCatalogConnectionString', () => {
  it('converts a postgres:// URI with an IPv6 host to libpq keyword/value form', () => {
    expect(
      buildDuckDbCatalogConnectionString(
        'postgres://postgres:JkYH1lMOZzIKBlWH@[2406:da18:1b99:be01::3ecf]:5432/postgres?sslmode=prefer'
      )
    ).toBe(
      'postgres:host=2406:da18:1b99:be01::3ecf password=JkYH1lMOZzIKBlWH port=5432 user=postgres dbname=postgres sslmode=prefer'
    )
  })

  it('decodes percent-encoded credentials and handles a plain hostname', () => {
    expect(
      buildDuckDbCatalogConnectionString(
        'postgresql://user:p%40ss@db.abc.supabase.co:5432/postgres'
      )
    ).toBe('postgres:host=db.abc.supabase.co password=p@ss port=5432 user=user dbname=postgres')
  })

  it('passes through an unparseable value unchanged', () => {
    expect(buildDuckDbCatalogConnectionString('not-a-valid-url')).toBe('not-a-valid-url')
  })
})

describe('getWarehouseCatalogEngineContent (duckdb)', () => {
  const creds: WarehouseCatalogCredentials = {
    catalogUrl:
      'postgres://postgres:JkYH1lMOZzIKBlWH@[2406:da18:1b99:be01::3ecf]:5432/postgres?sslmode=prefer',
    dataPath: 's3://warehouse/',
    s3Endpoint: 'abc.storage.supabase.co/storage/v1/s3',
    s3Region: 'us-east-1',
    s3AccessKeyId: 'key',
    s3SecretAccessKey: 'secret',
    metadataSchema: 'ducklake',
  }

  it('attaches the catalog via a libpq keyword/value connection string, not the raw URI', () => {
    const { value } = getWarehouseCatalogEngineContent('duckdb', creds)
    expect(value).toContain(
      "ATTACH 'ducklake:postgres:host=2406:da18:1b99:be01::3ecf password=JkYH1lMOZzIKBlWH port=5432 user=postgres dbname=postgres sslmode=prefer' AS warehouse"
    )
    expect(value).not.toContain('ducklake:postgres://')
  })
})
