import { describe, expect, test } from 'vitest'

import {
  getDuckLakeSetupScript,
  parseWarehouseCatalogUrl,
  type WarehouseCatalogConnection,
} from './warehouse'

const CREDENTIALS = {
  data_path: 's3://warehouse/',
  metadata_schema: 'ducklake',
  s3_access_key_id: '9bca431b472accc23f8eb6de9f36259b',
  s3_endpoint: 'fcdidtxgcaijqkrrngdt.storage.supabase.red/storage/v1/s3',
  s3_region: 'ap-southeast-1',
}

const CONNECTION: WarehouseCatalogConnection = {
  host: 'db.fcdidtxgcaijqkrrngdt.supabase.co',
  port: '5432',
  database: 'postgres',
  user: 'postgres',
  password: 'catalog-password',
}

describe('parseWarehouseCatalogUrl', () => {
  test('splits a full Postgres URL into its parts', () => {
    expect(
      parseWarehouseCatalogUrl('postgres://postgres:pwd@db.example.supabase.co:5432/postgres')
    ).toEqual({
      host: 'db.example.supabase.co',
      port: '5432',
      database: 'postgres',
      user: 'postgres',
      password: 'pwd',
    })
  })

  test('falls back to the default port and database when omitted', () => {
    expect(parseWarehouseCatalogUrl('postgres://postgres:pwd@db.example.supabase.co')).toEqual({
      host: 'db.example.supabase.co',
      port: '5432',
      database: 'postgres',
      user: 'postgres',
      password: 'pwd',
    })
  })

  test('decodes percent-encoded credentials', () => {
    const parsed = parseWarehouseCatalogUrl(
      'postgres://user%40name:p%40ss%3Aword@db.example.supabase.co:5432/postgres'
    )
    expect(parsed?.user).toBe('user@name')
    expect(parsed?.password).toBe('p@ss:word')
  })

  test('keeps a non-default database name', () => {
    expect(parseWarehouseCatalogUrl('postgres://u:p@host:5432/catalog_db')?.database).toBe(
      'catalog_db'
    )
  })

  test('returns null for values that are not URLs', () => {
    expect(parseWarehouseCatalogUrl('')).toBeNull()
    expect(parseWarehouseCatalogUrl('not a url')).toBeNull()
  })
})

describe('getDuckLakeSetupScript', () => {
  const script = getDuckLakeSetupScript({ credentials: CREDENTIALS, connection: CONNECTION })

  test('creates all three secrets and attaches via the secret identifier', () => {
    expect(script).toContain('CREATE OR REPLACE SECRET ducklake_s3 (')
    expect(script).toContain('CREATE OR REPLACE SECRET ducklake_metadata (')
    expect(script).toContain('CREATE OR REPLACE SECRET ducklake_warehouse (')
    expect(script).toContain("ATTACH 'ducklake:ducklake_warehouse' AS warehouse;")
  })

  test('reads both passwords from environment variables instead of inlining them', () => {
    expect(script).toContain("SECRET getenv('DUCKLAKE_S3_SECRET')")
    expect(script).toContain("PASSWORD getenv('DUCKLAKE_METADATA_PASSWORD')")
    expect(script).not.toContain(CONNECTION.password)
  })

  test('inlines the non-secret catalog and storage values', () => {
    expect(script).toContain(`KEY_ID '${CREDENTIALS.s3_access_key_id}'`)
    expect(script).toContain(`REGION '${CREDENTIALS.s3_region}'`)
    expect(script).toContain(`ENDPOINT '${CREDENTIALS.s3_endpoint}'`)
    expect(script).toContain(`HOST '${CONNECTION.host}'`)
    expect(script).toContain(`PORT ${CONNECTION.port}`)
    expect(script).toContain(`DATABASE '${CONNECTION.database}'`)
    expect(script).toContain(`USER '${CONNECTION.user}'`)
    expect(script).toContain(`DATA_PATH '${CREDENTIALS.data_path}'`)
  })

  test('sets METADATA_SCHEMA explicitly, since DuckLake defaults it to main', () => {
    expect(script).toContain(`METADATA_SCHEMA '${CREDENTIALS.metadata_schema}'`)
  })

  test('binds the metadata secret into the DuckLake secret', () => {
    expect(script).toContain("'SECRET': 'ducklake_metadata'")
    expect(script).toContain("METADATA_PATH ''")
  })
})
