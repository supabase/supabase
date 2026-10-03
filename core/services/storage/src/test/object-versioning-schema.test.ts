import { randomUUID } from 'node:crypto'
import { useStorage, withDeleteEnabled } from './utils/storage'

describe('object versioning dark schema', () => {
  const tHelper = useStorage()
  let bucketId: string

  beforeEach(async () => {
    bucketId = `versioning-schema-${randomUUID()}`
    await tHelper.database.createBucket({ id: bucketId, name: bucketId })
  })

  afterEach(async () => {
    await withDeleteEnabled(tHelper.database.connection, async (transaction) => {
      await transaction.query('DELETE FROM storage.objects WHERE bucket_id = $1', [bucketId])
      await transaction.query('DELETE FROM storage.buckets WHERE id = $1', [bucketId])
    })
  })

  it('keeps versioning dark', async () => {
    const bucket = await tHelper.database.connection.query<{
      versioning_status: string
    }>(
      `SELECT versioning_status
       FROM storage.buckets
       WHERE id = $1`,
      [bucketId]
    )

    expect(bucket.rows[0]).toEqual({
      versioning_status: 'DISABLED',
    })

    const objectName = 'legacy-writer.txt'
    const inserted = await tHelper.database.connection.query<{
      version: string | null
      archived_at: string | null
      is_delete_marker: boolean
      is_versioned: boolean
    }>(
      `INSERT INTO storage.objects (bucket_id, name)
       VALUES ($1, $2)
       RETURNING version, archived_at, is_delete_marker, is_versioned`,
      [bucketId, objectName]
    )

    expect(inserted.rows[0]).toEqual({
      version: null,
      archived_at: null,
      is_delete_marker: false,
      is_versioned: false,
    })

    await expect(
      tHelper.database.connection.query(
        `UPDATE storage.buckets
         SET versioning_status = 'ENABLED'
         WHERE id = $1`,
        [bucketId]
      )
    ).rejects.toMatchObject({
      code: '23514',
      constraint: 'buckets_versioning_dark_check',
    })

    const bucketVersioningColumns = await tHelper.database.connection.query<{
      attname: string
      attnotnull: boolean
      default_value: string | null
    }>(`
      SELECT
        attribute.attname,
        attribute.attnotnull,
        pg_get_expr(default_value.adbin, default_value.adrelid) AS default_value
      FROM pg_catalog.pg_attribute AS attribute
      LEFT JOIN pg_catalog.pg_attrdef AS default_value
        ON default_value.adrelid = attribute.attrelid
       AND default_value.adnum = attribute.attnum
      WHERE attribute.attrelid = 'storage.buckets'::regclass
        AND attribute.attnum > 0
        AND NOT attribute.attisdropped
        AND attribute.attname = 'versioning_status'
      ORDER BY attribute.attname
    `)
    expect(bucketVersioningColumns.rows).toEqual([
      {
        attname: 'versioning_status',
        attnotnull: true,
        default_value: "'DISABLED'::text",
      },
    ])

    const bucketConstraints = await tHelper.database.connection.query<{ conname: string }>(`
      SELECT conname
      FROM pg_catalog.pg_constraint
      WHERE conrelid = 'storage.buckets'::regclass
        AND conname = ANY(ARRAY[
          'buckets_versioning_dark_check',
          'buckets_versioning_standard_only_check',
          'buckets_versioning_status_check'
        ])
      ORDER BY conname
    `)
    expect(bucketConstraints.rows.map((row) => row.conname)).toEqual([
      'buckets_versioning_dark_check',
      'buckets_versioning_standard_only_check',
      'buckets_versioning_status_check',
    ])
  })
})
