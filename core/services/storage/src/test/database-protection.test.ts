import type { TenantConnection } from '@internal/database'
import { DatabaseError } from 'pg'
import { useStorage, withDeleteEnabled } from './utils/storage'

describe('Database Protection Triggers', () => {
  const tHelper = useStorage()
  const testBucketName = `test-db-protection-${Date.now()}`

  beforeAll(async () => {
    await tHelper.database.createBucket({
      id: testBucketName,
      name: testBucketName,
    })
  })

  afterAll(async () => {
    tHelper.database.connection.dispose()
  })

  describe('Direct DELETE protection (migration 0050)', () => {
    it('should prevent direct DELETE on storage.buckets without storage.allow_delete_query', async () => {
      const db = tHelper.database.connection
      const testBucket = `temp-bucket-${Date.now()}`

      // Create a test bucket
      await db.query('INSERT INTO storage.buckets (id, name) VALUES ($1, $2)', [
        testBucket,
        testBucket,
      ])

      // Attempt to delete without setting storage.allow_delete_query
      try {
        await db.query('DELETE FROM storage.buckets WHERE id = $1', [testBucket])
        throw new Error('Expected DELETE to be blocked by trigger')
      } catch (error) {
        const dbError = error as DatabaseError
        expect(dbError.code).toBe('42501') // PostgreSQL error code for insufficient privilege
        expect(dbError.message).toContain('Direct deletion from storage tables is not allowed')
      }

      // Verify bucket still exists
      const result = await db.query('SELECT id FROM storage.buckets WHERE id = $1', [testBucket])
      expect(result.rows).toHaveLength(1)

      // Cleanup: delete with proper config
      await withDeleteEnabled(db, async (db) => {
        await db.query('DELETE FROM storage.buckets WHERE id = $1', [testBucket])
      })
    })

    it('should prevent direct DELETE on storage.objects without storage.allow_delete_query', async () => {
      const db = tHelper.database.connection
      const testObjectName = `test-object-${Date.now()}.txt`

      // Create a test object
      await db.query(
        'INSERT INTO storage.objects (bucket_id, name, owner, version) VALUES ($1, $2, $3, $4)',
        [testBucketName, testObjectName, null, '1']
      )

      // Attempt to delete without setting storage.allow_delete_query
      try {
        await db.query('DELETE FROM storage.objects WHERE bucket_id = $1 AND name = $2', [
          testBucketName,
          testObjectName,
        ])
        throw new Error('Expected DELETE to be blocked by trigger')
      } catch (error) {
        const dbError = error as DatabaseError
        expect(dbError.code).toBe('42501')
        expect(dbError.message).toContain('Direct deletion from storage tables is not allowed')
      }

      // Verify object still exists
      const result = await db.query(
        'SELECT name FROM storage.objects WHERE bucket_id = $1 AND name = $2',
        [testBucketName, testObjectName]
      )
      expect(result.rows).toHaveLength(1)

      // Cleanup: delete with proper config
      await withDeleteEnabled(db, async (db) => {
        await db.query('DELETE FROM storage.objects WHERE bucket_id = $1 AND name = $2', [
          testBucketName,
          testObjectName,
        ])
      })
    })

    it('should allow DELETE on storage.buckets when storage.allow_delete_query is set', async () => {
      const db = tHelper.database.connection
      const testBucket = `temp-bucket-allow-${Date.now()}`

      await withDeleteEnabled(db, async (db) => {
        // Create a test bucket
        await db.query('INSERT INTO storage.buckets (id, name) VALUES ($1, $2)', [
          testBucket,
          testBucket,
        ])

        // Delete with proper config should succeed
        await db.query('DELETE FROM storage.buckets WHERE id = $1', [testBucket])

        // Verify bucket is deleted
        const result = await db.query('SELECT id FROM storage.buckets WHERE id = $1', [testBucket])
        expect(result.rows).toHaveLength(0)
      })
    })

    it('should allow DELETE on storage.objects when storage.allow_delete_query is set', async () => {
      const db = tHelper.database.connection
      const testObjectName = `test-object-allow-${Date.now()}.txt`

      await withDeleteEnabled(db, async (db) => {
        // Create a test object
        await db.query(
          'INSERT INTO storage.objects (bucket_id, name, owner, version) VALUES ($1, $2, $3, $4)',
          [testBucketName, testObjectName, null, '1']
        )

        // Delete with proper config should succeed
        await db.query('DELETE FROM storage.objects WHERE bucket_id = $1 AND name = $2', [
          testBucketName,
          testObjectName,
        ])

        // Verify object is deleted
        const result = await db.query(
          'SELECT name FROM storage.objects WHERE bucket_id = $1 AND name = $2',
          [testBucketName, testObjectName]
        )
        expect(result.rows).toHaveLength(0)
      })
    })
  })

  describe('Table privilege restrictions (migration 0073)', () => {
    const crudTables = ['objects', 'buckets', 'buckets_analytics']
    const selectOnlyTables = ['buckets_vectors', 'vector_indexes']
    const restrictedRoles = ['anon', 'authenticated']

    let checkedPrivileges: string[]

    beforeAll(async () => {
      const db = tHelper.database.connection
      const result = await db.query<{ server_version_num: string }>(
        `SELECT current_setting('server_version_num') AS server_version_num`
      )
      const supportsMaintain = Number(result.rows[0].server_version_num) >= 170000

      checkedPrivileges = [
        'SELECT',
        'INSERT',
        'UPDATE',
        'DELETE',
        'TRUNCATE',
        'REFERENCES',
        'TRIGGER',
        ...(supportsMaintain ? ['MAINTAIN'] : []),
      ]
    })

    async function getGrantedPrivileges(
      db: TenantConnection,
      role: string,
      table: string
    ): Promise<string[]> {
      const result = await db.query<{ privilege: string }>(
        `SELECT p AS privilege
         FROM unnest($1::text[]) AS p
         WHERE has_table_privilege($2, $3, p)`,
        [checkedPrivileges, role, `storage.${table}`]
      )

      return result.rows.map((row) => row.privilege)
    }

    it.each(
      restrictedRoles
    )('should only grant SELECT, INSERT, UPDATE, DELETE to %s on CRUD storage tables', async (role) => {
      const db = tHelper.database.connection

      for (const table of crudTables) {
        const granted = await getGrantedPrivileges(db, role, table)

        expect(granted.sort(), `unexpected privileges for ${role} on storage.${table}`).toEqual(
          ['DELETE', 'INSERT', 'SELECT', 'UPDATE'].sort()
        )
      }
    })

    it.each(
      restrictedRoles
    )('should only grant SELECT to %s on vector storage tables', async (role) => {
      const db = tHelper.database.connection

      for (const table of selectOnlyTables) {
        const granted = await getGrantedPrivileges(db, role, table)

        expect(granted, `unexpected privileges for ${role} on storage.${table}`).toEqual(['SELECT'])
      }
    })
  })
})
