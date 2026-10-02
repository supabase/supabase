import assert from 'node:assert'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { isS3Error } from '@internal/errors'
import { DeleteIcebergResources } from '@storage/events/iceberg/delete-iceberg-resources'
import {
  CreateTableResponse,
  LoadTableResult,
  RestCatalogClient,
} from '@storage/protocols/iceberg/catalog'
import { Metastore } from '@storage/protocols/iceberg/metastore'
import { PgMetastore } from '@storage/protocols/iceberg/pg'
import { FastifyInstance } from 'fastify'
import { getConfig, mergeConfig } from '../config'
import { createBucketIfNotExists, useStorage } from './utils/storage'

const {
  serviceKeyAsync,
  storageS3Region,
  storageS3Endpoint,
  s3ProtocolAccessKeyId,
  s3ProtocolAccessKeySecret,
} = getConfig()

const icebergLimitOverrides = {
  icebergMaxCatalogsCount: 1e8,
  icebergMaxNamespaceCount: 1e8,
}

describe('Iceberg Catalog', () => {
  const t = useStorage()

  let app: FastifyInstance
  let icebergMetastore: Metastore
  beforeAll(async () => {
    mergeConfig(icebergLimitOverrides)

    const { default: makeApp } = await import('../app')
    app = makeApp()
    icebergMetastore = new PgMetastore(t.database.connection, {
      multiTenant: false,
      schema: 'storage',
    })
  })

  afterEach(async () => {
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    await app.close()
    t.database.connection.dispose()
  })

  it('can create an analytic bucket', async () => {
    const bucketName = t.random.name('ice-bucket')

    const response = await app.inject({
      method: 'POST',
      url: '/iceberg/bucket',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await serviceKeyAsync}`,
      },
      payload: {
        name: bucketName,
      },
    })

    const resp = await response.json()
    expect(response.statusCode).toBe(200)
    expect(resp.id).toBe(bucketName)
  })

  it('can list analytic buckets', async () => {
    const bucketName = t.random.name('ice-bucket')
    await t.storage.createIcebergBucket({
      name: bucketName,
    })

    const response = await app.inject({
      method: 'GET',
      url: '/iceberg/bucket',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await serviceKeyAsync}`,
      },
    })

    const resp = await response.json()
    expect(response.statusCode).toBe(200)
    expect(resp.length).toBeGreaterThan(0)
  })

  it('can delete analytic bucket', async () => {
    const bucketName = t.random.name('ice-bucket')
    const bucket = await t.storage.createIcebergBucket({
      name: bucketName,
    })

    const response = await app.inject({
      method: 'DELETE',
      url: `/iceberg/bucket/${bucketName}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await serviceKeyAsync}`,
      },
    })

    expect(response.statusCode).toBe(200)

    const deletedCatalog = await t.database.connection.query<{
      deleted_at: Date | string | null
    }>({
      text: `
        SELECT deleted_at
        FROM storage.buckets_analytics
        WHERE id = $1
        LIMIT 1
      `,
      values: [bucket.id],
    })

    expect(deletedCatalog.rows[0]?.deleted_at).toBeTruthy()
  })

  it('can empty analytic bucket resources after deletion starts', async () => {
    const bucketName = t.random.name('ice-bucket')
    const bucket = await t.storage.createIcebergBucket({
      name: bucketName,
    })

    const namespaceName = t.random.name('namespace')
    const namespace = await icebergMetastore.createNamespace({
      name: namespaceName,
      bucketName: bucket.name,
      bucketId: bucket.id,
      tenantId: '',
      metadata: {},
    })

    const tableName = t.random.name('table')
    await icebergMetastore.createTable({
      name: tableName,
      bucketName: bucket.name,
      bucketId: bucket.id,
      location: `s3://${bucketName}/tables/${tableName}`,
      namespaceId: namespace.id,
      shardId: 'my-warehouse',
      shardKey: 'my-warehouse',
    })

    await t.database.deleteAnalyticsBucket(bucket.id, { soft: true })

    const dropTable = vi.spyOn(RestCatalogClient.prototype, 'dropTable').mockResolvedValue()
    const listTables = vi.spyOn(RestCatalogClient.prototype, 'listTables').mockResolvedValue({
      identifiers: [],
    })
    const dropNamespace = vi.spyOn(RestCatalogClient.prototype, 'dropNamespace').mockResolvedValue()
    vi.spyOn(
      DeleteIcebergResources as unknown as {
        createStorage(payload: unknown): Promise<typeof t.storage>
      },
      'createStorage'
    ).mockResolvedValue({
      ...t.storage,
      db: {
        ...t.storage.db,
        connection: t.storage.db.connection,
        destroyConnection: vi.fn(),
      },
    } as unknown as typeof t.storage)

    await DeleteIcebergResources.handle({
      id: 'test-delete-iceberg-resources',
      name: DeleteIcebergResources.getQueueName(),
      data: {
        catalogId: bucket.id,
        tenant: {
          ref: '',
          host: 'localhost',
        },
      },
    } as Parameters<typeof DeleteIcebergResources.handle>[0])

    expect(dropTable).toHaveBeenCalledWith({
      namespace: namespace.name,
      table: tableName,
      purgeRequested: true,
      warehouse: 'my-warehouse',
    })
    expect(listTables).toHaveBeenCalledWith({
      namespace: `_${namespace.id.replaceAll('-', '_')}`,
      pageSize: 1,
      warehouse: 'my-warehouse',
    })
    expect(dropNamespace).toHaveBeenCalledWith({
      namespace: namespace.name,
      warehouse: 'my-warehouse',
    })

    await expect(
      icebergMetastore.findCatalogById({
        id: bucket.id,
        tenantId: '',
        deleted: true,
      })
    ).rejects.toThrow()

    await expect(
      icebergMetastore.findNamespaceByName({
        name: namespace.name,
        catalogId: bucket.id,
        tenantId: '',
      })
    ).rejects.toThrow()
  })

  it('can create a table bucket', async () => {
    const bucketName = t.random.name('ice-bucket')

    const response = await app.inject({
      method: 'POST',
      url: '/bucket',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await serviceKeyAsync}`,
      },
      payload: {
        name: bucketName,
        type: 'ANALYTICS',
      },
    })

    const resp = await response.json()
    expect(response.statusCode).toBe(200)
    expect(resp.name).toBe(bucketName)
  })

  it('can get catalog config', async () => {
    const bucketName = t.random.name('ice-bucket')
    await t.storage.createIcebergBucket({
      name: bucketName,
    })

    vi.spyOn(RestCatalogClient.prototype, 'getConfig').mockResolvedValue({
      defaults: {
        prefix: bucketName,
      },
      overrides: {
        prefix: bucketName,
      },
    })

    const response = await app.inject({
      method: 'GET',
      url: `/iceberg/v1/config?warehouse=${bucketName}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await serviceKeyAsync}`,
      },
    })

    const resp = await response.json()
    expect(response.statusCode).toBe(200)
    expect(resp.defaults).toEqual({
      'io-impl': 'org.apache.iceberg.aws.s3.S3FileIO',
      prefix: bucketName,
      'rest-metrics-reporting-enabled': 'false',
      's3.delete-enabled': 'false',
      'write.object-storage.enabled': 'true',
      'write.object-storage.partitioned-paths': 'false',
    })
    expect(resp.overrides).toEqual({
      prefix: bucketName,
    })
  })

  describe('Namespace', () => {
    it('can create namespaces', async () => {
      const bucketName = t.random.name('ice-bucket')
      await t.storage.createIcebergBucket({
        name: bucketName,
      })

      const namespaceName = t.random.name('namespace')

      vi.spyOn(RestCatalogClient.prototype, 'createNamespace').mockResolvedValue({
        namespace: [namespaceName],
        properties: {
          test: 'hello',
        },
      })

      const response = await app.inject({
        method: 'POST',
        url: `/iceberg/v1/${bucketName}/namespaces`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await serviceKeyAsync}`,
        },
        payload: {
          namespace: [namespaceName],
          properties: {
            test: 'hello',
          },
        },
      })

      expect(response.statusCode, response.body).toBe(200)
      const resp = await response.json()
      expect(resp).toEqual({
        namespace: [namespaceName],
        properties: {
          test: 'hello',
        },
      })
    })

    it('updates namespace properties when creating an existing namespace', async () => {
      const bucketName = t.random.name('ice-bucket')
      await t.storage.createIcebergBucket({
        name: bucketName,
      })

      const namespaceName = t.random.name('namespace')

      const createResponse = await app.inject({
        method: 'POST',
        url: `/iceberg/v1/${bucketName}/namespaces`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await serviceKeyAsync}`,
        },
        payload: {
          namespace: namespaceName,
          properties: {
            stable: 'kept',
            overwrite: 'old',
          },
        },
      })

      expect(createResponse.statusCode, createResponse.body).toBe(200)
      expect(await createResponse.json()).toEqual({
        namespace: [namespaceName],
        properties: {
          stable: 'kept',
          overwrite: 'old',
        },
      })

      const updateResponse = await app.inject({
        method: 'POST',
        url: `/iceberg/v1/${bucketName}/namespaces`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await serviceKeyAsync}`,
        },
        payload: {
          namespace: namespaceName,
          properties: {
            overwrite: 'new',
            added: 'value',
          },
        },
      })

      expect(updateResponse.statusCode).toBe(200)
      expect(await updateResponse.json()).toEqual({
        namespace: [namespaceName],
        properties: {
          stable: 'kept',
          overwrite: 'new',
          added: 'value',
        },
      })

      const loadResponse = await app.inject({
        method: 'GET',
        url: `/iceberg/v1/${bucketName}/namespaces/${namespaceName}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(loadResponse.statusCode).toBe(200)
      expect(await loadResponse.json()).toEqual({
        namespace: [namespaceName],
        properties: {
          stable: 'kept',
          overwrite: 'new',
          added: 'value',
        },
      })
    })

    it('returns InvalidParameter for invalid namespace names', async () => {
      const bucketName = t.random.name('ice-bucket')
      await t.storage.createIcebergBucket({
        name: bucketName,
      })

      const response = await app.inject({
        method: 'POST',
        url: `/iceberg/v1/${bucketName}/namespaces`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await serviceKeyAsync}`,
        },
        payload: {
          namespace: 'awsnamespace',
        },
      })

      expect(response.statusCode).toBe(400)
      expect(await response.json()).toEqual({
        error: {
          code: 400,
          message: 'Resource name must not start with the reserved prefix "aws"',
          type: 'InvalidParameter',
        },
      })
    })

    it('can list namespaces', async () => {
      const bucketName = t.random.name('ice-bucket')

      const bucket = await t.storage.createIcebergBucket({
        name: bucketName,
      })

      const namespaceName = t.random.name('namespace')

      const namespace = await icebergMetastore.createNamespace({
        name: namespaceName,
        bucketName: bucket.name,
        bucketId: bucket.id,
        tenantId: '',
        metadata: {},
      })

      vi.spyOn(RestCatalogClient.prototype, 'listNamespaces').mockResolvedValue({
        namespaces: [[namespaceName]],
      })

      const response = await app.inject({
        method: 'GET',
        url: `/iceberg/v1/${bucketName}/namespaces`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const resp = await response.json()
      expect(resp).toEqual({
        namespaces: [[namespace.name]],
      })
    })

    it('can drop namespaces', async () => {
      const bucketName = t.random.name('ice-bucket')

      const bucket = await t.storage.createIcebergBucket({
        name: bucketName,
      })

      const namespaceName = t.random.name('namespace')
      const namespace = await icebergMetastore.createNamespace({
        name: namespaceName,
        bucketName: bucket.name,
        bucketId: bucket.id,
        tenantId: '',
        metadata: {},
      })

      const initialNamespaces = await icebergMetastore.listNamespaces({
        catalogId: bucket.id,
      })

      vi.spyOn(RestCatalogClient.prototype, 'dropNamespace').mockResolvedValue(undefined)

      const response = await app.inject({
        method: 'DELETE',
        url: `/iceberg/v1/${bucketName}/namespaces/${namespace.name}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(204)
      const resp = response.body
      expect(resp).toEqual('')

      const afterDropNamespaces = await icebergMetastore.listNamespaces({
        tenantId: '',
        catalogId: bucket.id,
      })

      expect(afterDropNamespaces.length).toEqual(initialNamespaces.length - 1)
    })

    it('can load namespace metadata', async () => {
      const bucketName = t.random.name('ice-bucket')

      const bucket = await t.storage.createIcebergBucket({
        name: bucketName,
      })

      const namespaceName = t.random.name('namespace')
      const namespace = await icebergMetastore.createNamespace({
        name: namespaceName,
        bucketName: bucket.name,
        bucketId: bucket.id,
        tenantId: '',
        metadata: {
          test: 'hello',
        },
      })

      vi.spyOn(RestCatalogClient.prototype, 'loadNamespaceMetadata').mockResolvedValue({
        namespace: [namespace.name],
        properties: {
          test: 'hello',
        },
      })

      const response = await app.inject({
        method: 'GET',
        url: `/iceberg/v1/${bucketName}/namespaces/${namespace.name}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const resp = await response.json()
      expect(resp).toEqual({
        namespace: [namespace.name],
        properties: {
          test: 'hello',
        },
      })
    })

    it('check if namespace exists', async () => {
      const bucketName = t.random.name('ice-bucket')

      const bucket = await t.storage.createIcebergBucket({
        name: bucketName,
      })

      const namespaceName = t.random.name('namespace')
      const namespace = await icebergMetastore.createNamespace({
        name: namespaceName,
        bucketName: bucket.name,
        bucketId: bucket.id,
        tenantId: '',
        metadata: {},
      })

      vi.spyOn(RestCatalogClient.prototype, 'namespaceExists').mockResolvedValue(undefined)

      const response = await app.inject({
        method: 'HEAD',
        url: `/iceberg/v1/${bucketName}/namespaces/${namespace.name}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(204)
    })
  })

  describe('Table', () => {
    it('can create a table', async () => {
      const bucketName = t.random.name('ice-bucket')
      const bucket = await t.storage.createIcebergBucket({
        name: bucketName,
      })

      const namespaceName = t.random.name('namespace')
      const namespace = await icebergMetastore.createNamespace({
        name: namespaceName,
        bucketName: bucket.name,
        bucketId: bucket.id,
        tenantId: '',
        metadata: {},
      })

      const tableName = t.random.name('table')
      const tableLocation = `s3://${bucketName}/tables/${tableName}`
      const tableMetadataLocation = `${tableLocation}/metadata/00000-2eed5277-661d-47b5-84c0-30ce9dbad149.metadata.json`
      const loadTable: CreateTableResponse = {
        metadata: {
          'current-schema-id': 0,
          'default-spec-id': 0,
          'format-version': 2,
          'last-column-id': 2,
          'last-updated-ms': 1752062419286,
          location: tableLocation,
          'metadata-log': Array.from([]),
          'partition-specs': Array.from([
            {
              fields: Array.from([]),
              'spec-id': 0,
            },
          ]),
          properties: {
            'write.parquet.compression-codec': 'zstd',
          },
          schemas: Array.from([
            {
              fields: Array.from([
                {
                  id: 1,
                  name: 'id',
                  required: false,
                  type: 'long',
                },
                {
                  id: 2,
                  name: 'name',
                  required: false,
                  type: 'string',
                },
              ]),
              'schema-id': 0,
              type: 'struct',
            },
          ]),
          'table-uuid': 'b734865e-f9a5-4654-8b0b-e15683fcb195',
        },
        'metadata-location': tableMetadataLocation,
      } as const

      vi.spyOn(RestCatalogClient.prototype, 'createTable').mockResolvedValue(loadTable)

      vi.spyOn(RestCatalogClient.prototype, 'createNamespace').mockResolvedValue({
        namespace: [namespace.name],
        properties: {},
      })

      const response = await app.inject({
        method: 'POST',
        url: `/iceberg/v1/${bucketName}/namespaces/${namespace.name}/tables`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await serviceKeyAsync}`,
        },
        payload: {
          name: tableName,
          schema: {
            type: 'struct',
            fields: [
              {
                id: 1,
                name: 'id',
                type: 'long',
                required: false,
              },
              {
                id: 2,
                name: 'name',
                type: 'string',
                required: false,
              },
            ],
            'schema-id': 0,
            'identifier-field-ids': [],
          },
          'partition-spec': {
            'spec-id': 0,
            fields: [],
          },
          'write-order': {
            'order-id': 0,
            fields: [],
          },
          'stage-create': false,
          properties: {},
        },
      })

      expect(response.statusCode).toBe(200)
      const resp = await response.json()
      expect(resp).toEqual(loadTable)
    })

    it('can list tables in a namespace', async () => {
      const bucketName = t.random.name('ice-bucket')
      const bucket = await t.storage.createIcebergBucket({
        name: bucketName,
      })

      const namespaceName = t.random.name('namespace')
      const namespace = await icebergMetastore.createNamespace({
        name: namespaceName,
        bucketName: bucket.name,
        bucketId: bucket.id,
        tenantId: '',
        metadata: {},
      })

      const tableName = t.random.name('table')
      await icebergMetastore.createTable({
        name: tableName,
        location: `s3://${bucketName}/tables/${tableName}`,
        namespaceId: namespace.id,
        bucketName: bucket.name,
        bucketId: bucket.id,
      })

      vi.spyOn(RestCatalogClient.prototype, 'listTables').mockResolvedValue({
        identifiers: [
          {
            namespace: [namespace.name],
            name: tableName,
          },
        ],
      })

      const response = await app.inject({
        method: 'GET',
        url: `/iceberg/v1/${bucketName}/namespaces/${namespace.name}/tables`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const resp = await response.json()
      expect(resp).toEqual({
        identifiers: [
          {
            namespace: [namespace.name],
            name: tableName,
          },
        ],
      })

      const newTable = await icebergMetastore.findTableByName({
        name: tableName,
        namespaceId: namespace.id,
      })

      expect(newTable.name).toEqual(tableName)
    })

    it('check if table exists', async () => {
      const bucketName = t.random.name('ice-bucket')
      const bucket = await t.storage.createIcebergBucket({
        name: bucketName,
      })

      const namespaceName = t.random.name('namespace')
      const namespace = await icebergMetastore.createNamespace({
        name: namespaceName,
        bucketName: bucket.name,
        bucketId: bucket.id,
        tenantId: '',
        metadata: {},
      })

      const tableName = t.random.name('table')
      await icebergMetastore.createTable({
        name: tableName,
        bucketName: bucket.name,
        bucketId: bucket.id,
        location: `s3://${bucketName}/tables/${tableName}`,
        namespaceId: namespace.id,
        shardId: 'my-warehouse',
        shardKey: 'my-warehouse',
      })

      vi.spyOn(RestCatalogClient.prototype, 'tableExists').mockResolvedValue(undefined)

      const response = await app.inject({
        method: 'HEAD',
        url: `/iceberg/v1/${bucketName}/namespaces/${namespace.name}/tables/${tableName}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(204)
    })

    it('can drop a table', async () => {
      const bucketName = t.random.name('ice-bucket')
      const bucket = await t.storage.createIcebergBucket({
        name: bucketName,
      })

      const namespaceName = t.random.name('namespace')
      const namespace = await icebergMetastore.createNamespace({
        name: namespaceName,
        bucketName: bucket.name,
        bucketId: bucket.id,
        tenantId: '',
        metadata: {},
      })

      const tableName = t.random.name('table')
      await icebergMetastore.createTable({
        name: tableName,
        bucketName: bucket.name,
        bucketId: bucket.id,
        location: `s3://${bucketName}/tables/${tableName}`,
        namespaceId: namespace.id,
        shardId: 'my-warehouse',
        shardKey: 'my-warehouse',
      })

      vi.spyOn(RestCatalogClient.prototype, 'dropTable').mockResolvedValue(undefined)
      vi.spyOn(RestCatalogClient.prototype, 'listTables').mockResolvedValue({ identifiers: [] })

      vi.spyOn(RestCatalogClient.prototype, 'dropNamespace').mockResolvedValue(undefined)

      const response = await app.inject({
        method: 'DELETE',
        url: `/iceberg/v1/${bucketName}/namespaces/${namespace.name}/tables/${tableName}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(204)
      expect(response.body).toEqual('')
    })

    it('can load table metadata', async () => {
      const bucketName = t.random.name('ice-bucket')
      const bucket = await t.storage.createIcebergBucket({
        name: bucketName,
      })

      const namespaceName = t.random.name('namespace')
      const namespace = await icebergMetastore.createNamespace({
        name: namespaceName,
        bucketName: bucket.name,
        bucketId: bucket.id,
        tenantId: '',
        metadata: {},
      })

      const tableName = t.random.name('table')
      await icebergMetastore.createTable({
        name: tableName,
        bucketName: bucket.name,
        bucketId: bucket.id,
        location: `s3://${bucketName}/tables/${tableName}`,
        namespaceId: namespace.id,
        shardId: 'my-warehouse',
        shardKey: 'my-warehouse',
      })

      const tableMetadata: LoadTableResult = {
        metadata: {
          'current-schema-id': 0,
          'default-spec-id': 0,
          'format-version': 2,
          'last-column-id': 2,
          'last-updated-ms': 1752062419286,
          location: `s3://${bucketName}/tables/${tableName}`,
          'metadata-log': [],
          'partition-specs': [
            {
              fields: [],
              'spec-id': 0,
            },
          ],
          properties: {
            'write.parquet.compression-codec': 'zstd',
          },
          schemas: [
            {
              fields: [
                {
                  id: 1,
                  name: 'id',
                  required: false,
                  type: 'long',
                },
                {
                  id: 2,
                  name: 'name',
                  required: false,
                  type: 'string',
                },
              ],
              'schema-id': 0,
              type: 'struct',
            },
          ],
          'table-uuid': 'b734865e-f9a5-4654-8b0b-e15683fcb195',
        },
        'metadata-location': `s3://${bucketName}/tables/${tableName}/metadata/00000-2eed5277-661d-47b5-84c0-30ce9dbad149.metadata.json`,
      }

      vi.spyOn(RestCatalogClient.prototype, 'loadTable').mockResolvedValue(tableMetadata)

      const response = await app.inject({
        method: 'GET',
        url: `/iceberg/v1/${bucketName}/namespaces/${namespace.name}/tables/${tableName}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await serviceKeyAsync}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const resp = await response.json()
      expect(resp).toEqual(tableMetadata)

      const table = await icebergMetastore.findTableByName({
        name: tableName,
        tenantId: '',
        namespaceId: namespace.id,
      })

      expect(table.name).toEqual(tableName)
    })
  })

  describe('S3 Protocol Iceberg Bucket Detection', () => {
    let client: S3Client
    let rustfsClient: S3Client

    beforeAll(async () => {
      const listener = await app.listen()

      client = new S3Client({
        endpoint: `${listener.replace('[::1]', 'localhost')}/s3`,
        forcePathStyle: true,
        region: storageS3Region,
        credentials: {
          accessKeyId: s3ProtocolAccessKeyId!,
          secretAccessKey: s3ProtocolAccessKeySecret!,
        },
      })

      rustfsClient = new S3Client({
        endpoint: storageS3Endpoint,
        forcePathStyle: true,
        region: storageS3Region,
      })
    })

    it('will NOT upload the given s3 location if the bucket location is NOT an iceberg table location', async () => {
      const namespace = t.random.name('ice-namespace')
      const tableName = t.random.name('ice-table')
      const internalBucketName = `internal-${Date.now()}--table-s3`

      await createBucketIfNotExists(internalBucketName, rustfsClient)

      const uploadFile = new PutObjectCommand({
        Bucket: internalBucketName,
        Key: `${namespace}/${tableName}/data.parquet`,
        Body: Buffer.from('test data'),
      })

      try {
        await client.send(uploadFile)
        throw new Error('Expected error not thrown')
      } catch (e) {
        assert(e instanceof Error)
        expect(e.message).not.toContain('Expected error not thrown')

        if (!isS3Error(e)) {
          throw new Error('Expected S3 error but got a different error type')
        }

        expect(e.$metadata.httpStatusCode).toBe(404)
      }
    })

    it('will upload the given s3 location if the bucket location is an iceberg table location', async () => {
      const bucketName = t.random.name('ice-bucket')
      const internalBucketName = `internal-${Date.now()}--table-s3`

      await createBucketIfNotExists(internalBucketName, rustfsClient)

      const bucket = await t.storage.createIcebergBucket({
        name: bucketName,
      })

      const tableName = t.random.name('table')
      const namespaceName = t.random.name('namespace')

      const namespace = await icebergMetastore.createNamespace({
        name: namespaceName,
        bucketName: bucket.name,
        bucketId: bucket.id,
        tenantId: '',
        metadata: {},
      })

      await icebergMetastore.createTable({
        name: tableName,
        bucketName: bucket.name,
        bucketId: bucket.id,
        location: `s3://${internalBucketName}`,
        namespaceId: namespace.id,
      })

      const uploadFile = new PutObjectCommand({
        Bucket: internalBucketName,
        Key: `${namespaceName}/${tableName}/data.parquet`,
        Body: Buffer.from('test data'),
      })

      const response = await client.send(uploadFile)

      expect(response.$metadata.httpStatusCode).toBe(200)
    })
  })
})
