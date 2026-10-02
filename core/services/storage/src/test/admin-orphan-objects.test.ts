import { closeMultitenantPg } from '@internal/database'
import * as migrations from '@internal/database/migrations'
import { randomUUID } from 'crypto'
import { Client } from 'pg'
import { getConfig } from '../config'
import { adminApp } from './common'

const { tenantId } = getConfig()
const bucketId = `admin-orphan-validation-${randomUUID()}`

describe('admin orphan-objects routes', () => {
  beforeAll(async () => {
    await migrations.runMultitenantMigrations()
  })

  afterAll(async () => {
    await adminApp.close()
    await closeMultitenantPg()
  })

  describe('GET /tenants/:tenantId/buckets/:bucketId/orphan-objects', () => {
    it('returns 400 when the before query parameter is not a valid date', async () => {
      const response = await adminApp.inject({
        method: 'GET',
        url: `/tenants/${tenantId}/buckets/${bucketId}/orphan-objects?before=not-a-date`,
        headers: {
          apikey: process.env.ADMIN_API_KEYS!,
        },
      })

      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body).error).toBe('Invalid date format')
    })
  })

  describe('DELETE /tenants/:tenantId/buckets/:bucketId/orphan-objects', () => {
    it('requires the admin API key even when a service key is supplied as Bearer', async () => {
      const response = await adminApp.inject({
        method: 'DELETE',
        url: `/tenants/${tenantId}/buckets/${bucketId}/orphan-objects`,
        headers: {
          authorization: `Bearer ${process.env.SERVICE_KEY}`,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ deleteDbKeys: true }),
      })

      expect(response.statusCode).toBe(401)
    })

    it('rejects a trailing payload after a valid scratch table name', async () => {
      const response = await adminApp.inject({
        method: 'DELETE',
        url: `/tenants/${tenantId}/buckets/${bucketId}/orphan-objects`,
        headers: {
          apikey: process.env.ADMIN_API_KEYS!,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({
          deleteDbKeys: true,
          tmpTable: 'storage._s3_remote_keys_1234567890123; SELECT 1; --',
        }),
      })

      expect(response.statusCode).toBe(400)
    })

    it('does not drop a table unrelated to scanner scratch data', async () => {
      const tableName = `storage.advisory_probe_${randomUUID().replaceAll('-', '_')}`
      const client = new Client({ connectionString: getConfig().databaseURL })
      await client.connect()

      try {
        await client.query(`CREATE TABLE ${tableName} (id integer)`)

        const response = await adminApp.inject({
          method: 'DELETE',
          url: `/tenants/${tenantId}/buckets/${bucketId}/orphan-objects`,
          headers: {
            apikey: process.env.ADMIN_API_KEYS!,
            'content-type': 'application/json',
          },
          payload: JSON.stringify({
            deleteDbKeys: true,
            deleteS3Keys: false,
            tmpTable: tableName,
          }),
        })

        const table = await client.query('SELECT to_regclass($1) AS name', [tableName])
        expect(table.rows[0].name).toBe(tableName)
        expect(response.statusCode).toBe(400)
      } finally {
        await client.query(`DROP TABLE IF EXISTS ${tableName}`)
        await client.end()
      }
    })

    it('accepts a scanner scratch table name and removes it after cleanup', async () => {
      const tableName = `storage._s3_remote_keys_${Date.now()}_${randomUUID().replaceAll('-', '_')}`
      const client = new Client({ connectionString: getConfig().databaseURL })
      await client.connect()

      try {
        await client.query(`CREATE TABLE ${tableName} (key text PRIMARY KEY, size bigint NOT NULL)`)

        const response = await adminApp.inject({
          method: 'DELETE',
          url: `/tenants/${tenantId}/buckets/${bucketId}/orphan-objects`,
          headers: {
            apikey: process.env.ADMIN_API_KEYS!,
            'content-type': 'application/json',
          },
          payload: JSON.stringify({
            deleteDbKeys: true,
            tmpTable: tableName,
          }),
        })

        expect(response.statusCode).toBe(200)
        expect(response.body).not.toContain('"event":"error"')
        const table = await client.query('SELECT to_regclass($1) AS name', [tableName])
        expect(table.rows[0].name).toBeNull()
      } finally {
        await client.query(`DROP TABLE IF EXISTS ${tableName}`)
        await client.end()
      }
    })

    it('treats an empty scanner table name as omitted', async () => {
      const response = await adminApp.inject({
        method: 'DELETE',
        url: `/tenants/${tenantId}/buckets/${bucketId}/orphan-objects`,
        headers: {
          apikey: process.env.ADMIN_API_KEYS!,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ deleteDbKeys: true, tmpTable: '' }),
      })

      expect(response.statusCode).toBe(200)
      expect(response.body).not.toContain('"event":"error"')
    })

    it('returns 400 when the before body field is not a valid date', async () => {
      const response = await adminApp.inject({
        method: 'DELETE',
        url: `/tenants/${tenantId}/buckets/${bucketId}/orphan-objects`,
        headers: {
          apikey: process.env.ADMIN_API_KEYS!,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({
          deleteDbKeys: true,
          deleteS3Keys: false,
          before: 'not-a-date',
        }),
      })

      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body).error).toBe('Invalid date format')
    })

    it('returns 400 when neither deleteDbKeys nor deleteS3Keys is set', async () => {
      const response = await adminApp.inject({
        method: 'DELETE',
        url: `/tenants/${tenantId}/buckets/${bucketId}/orphan-objects`,
        headers: {
          apikey: process.env.ADMIN_API_KEYS!,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({
          deleteDbKeys: false,
          deleteS3Keys: false,
        }),
      })

      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body).error).toContain(
        'At least one of deleteDbKeys or deleteS3Keys'
      )
    })
  })
})
