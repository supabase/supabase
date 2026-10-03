import { randomUUID } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ListPartsCommand, S3Client } from '@aws-sdk/client-s3'
import { PgMetastore } from '@storage/protocols/iceberg/pg'
import { FastifyInstance } from 'fastify'
import { getConfig } from '../config'
import { useStorage } from './utils/storage'

const {
  icebergBucketDetectionSuffix,
  s3ProtocolAccessKeyId,
  s3ProtocolAccessKeySecret,
  storageS3Region,
} = getConfig()

async function createFileBackedApp(fileBackendPath: string) {
  vi.resetModules()

  const configModule = await import('../config')

  configModule.getConfig({ reload: true })
  configModule.mergeConfig({
    storageBackendType: 'file',
    storageFilePath: fileBackendPath,
  })

  return (await import('../app')).default()
}

describe('S3 protocol error code', () => {
  const t = useStorage()

  let testApp: FastifyInstance
  let client: S3Client
  let icebergMetastore: PgMetastore
  let fileBackendPath: string

  beforeAll(async () => {
    fileBackendPath = await mkdtemp(join(tmpdir(), 'storage-file-backend-'))
    testApp = await createFileBackedApp(fileBackendPath)
    icebergMetastore = new PgMetastore(t.database.connection, {
      multiTenant: false,
      schema: 'storage',
    })

    const listener = await testApp.listen()

    client = new S3Client({
      endpoint: `${listener.replace('[::1]', 'localhost')}/s3`,
      forcePathStyle: true,
      region: storageS3Region,
      credentials: {
        accessKeyId: s3ProtocolAccessKeyId!,
        secretAccessKey: s3ProtocolAccessKeySecret!,
      },
    })
  })

  afterAll(async () => {
    client?.destroy()
    await testApp?.close()

    vi.resetModules()
    await rm(fileBackendPath, { recursive: true, force: true })
  })

  it('returns NotSupported for iceberg list-parts on non-S3 backends', async () => {
    const nonce = randomUUID().replaceAll('-', '')
    const analyticsBucket = await t.storage.createIcebergBucket({
      name: `ice_bucket_${nonce}`,
    })
    const namespaceName = `namespace${nonce}`
    const tableName = `table${nonce}`
    const internalBucketName = `internal-${nonce}${icebergBucketDetectionSuffix}`

    const namespace = await icebergMetastore.createNamespace({
      name: namespaceName,
      bucketName: analyticsBucket.name,
      bucketId: analyticsBucket.id,
      tenantId: '',
      metadata: {},
    })

    await icebergMetastore.createTable({
      name: tableName,
      bucketName: analyticsBucket.name,
      bucketId: analyticsBucket.id,
      location: `s3://${internalBucketName}`,
      namespaceId: namespace.id,
    })

    await expect(
      client.send(
        new ListPartsCommand({
          Bucket: internalBucketName,
          Key: `${namespaceName}/${tableName}/data.parquet`,
          UploadId: 'upload-id',
        })
      )
    ).rejects.toMatchObject({
      $metadata: expect.objectContaining({ httpStatusCode: 409 }),
      name: 'NotSupported',
    })
  })
})
