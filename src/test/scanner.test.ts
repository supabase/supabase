import { eachParallel } from '@internal/testing/generators/array'
import { withOptionalVersion } from '@storage/backend'
import { randomUUID } from 'crypto'
import { Readable } from 'stream'
import { getConfig } from '../config'
import { useStorage } from './utils/storage'

const { storageS3Bucket, tenantId } = getConfig()

describe('ObjectScanner', () => {
  const storage = useStorage()

  it('Will list orphaned objects', async () => {
    const bucketId = 'test-' + Date.now()
    const bucket = await storage.storage.createBucket({
      id: bucketId,
      name: bucketId,
    })

    const maxUploads = 20

    // Create uploads
    const result = await eachParallel(maxUploads, async (i) => {
      const upload = await storage.uploader.upload({
        bucketId: bucket.id,
        objectName: randomUUID() + `-test-${i}.text`,
        uploadType: 'standard',
        file: {
          body: Readable.from(Buffer.from('test')),
          mimeType: 'text/plain',
          cacheControl: 'no-cache',
          isTruncated: () => false,
        },
      })

      return { name: upload.obj.name, version: upload.obj.version }
    })

    const numToDelete = 5
    const objectsToDelete = result.slice(0, numToDelete)
    await storage.database.deleteObjects(
      bucket.id,
      objectsToDelete.map((o) => o.name),
      'name'
    )

    const s3ToDelete = result.slice(5, 5 + numToDelete)
    await storage.adapter.deleteObjects(
      storageS3Bucket,
      s3ToDelete.map((o) => `${tenantId}/${bucket.id}/${o.name}/${o.version}`)
    )

    const objectsAfterDel = await storage.database.listObjects(bucket.id, 'name', 10000)
    expect(objectsAfterDel).toHaveLength(maxUploads - numToDelete)

    const orphaned = storage.scanner.listOrphaned(bucket.id, {
      signal: new AbortController().signal,
    })

    const deleted = { s3OrphanedKeys: [] as object[], dbOrphanedKeys: [] as object[] }
    for await (const result of orphaned) {
      if (result.type === 'dbOrphans') {
        deleted.dbOrphanedKeys = [...deleted.dbOrphanedKeys, ...result.value]
      }

      if (result.type === 's3Orphans') {
        deleted.s3OrphanedKeys = [...deleted.s3OrphanedKeys, ...result.value]
      }
    }
    expect(deleted.s3OrphanedKeys).toHaveLength(numToDelete)
    expect(deleted.dbOrphanedKeys).toHaveLength(numToDelete)
  })

  it('Will delete S3 objects, if no records exists in the database', async () => {
    const bucketId = 'test-' + Date.now()
    const bucket = await storage.storage.createBucket({
      id: bucketId,
      name: bucketId,
    })
    const options = {
      deleteDbKeys: false,
      deleteS3Keys: true,
      signal: new AbortController().signal,
    }

    const maxUploads = 300

    // Create uploads
    const result = await eachParallel(maxUploads, async (i) => {
      const upload = await storage.uploader.upload({
        bucketId: bucket.id,
        objectName: randomUUID() + `-test-${i}.text`,
        uploadType: 'standard',
        file: {
          body: Readable.from(Buffer.from('test')),
          mimeType: 'text/plain',
          cacheControl: 'no-cache',
          isTruncated: () => false,
        },
      })

      return { name: upload.obj.name, version: upload.obj.version }
    })

    const numToDelete = 10
    const objectsToDelete = result.slice(0, numToDelete)
    await storage.database.deleteObjects(
      bucket.id,
      objectsToDelete.map((o) => o.name),
      'name'
    )

    const objectsAfterDel = await storage.database.listObjects(bucket.id, 'name', 10000)
    expect(objectsAfterDel).toHaveLength(maxUploads - numToDelete)

    const orphaned = storage.scanner.deleteOrphans(bucket.id, options)

    const deleted = { dbOrphans: [] as object[], s3Orphans: [] as object[] }
    for await (const result of orphaned) {
      if (result.type === 'dbOrphans') {
        deleted.dbOrphans = [...deleted.dbOrphans, ...result.value]
      }

      if (result.type === 's3Orphans') {
        deleted.s3Orphans = [...deleted.s3Orphans, ...result.value]
      }
    }
    expect(deleted.s3Orphans).toHaveLength(numToDelete)
    expect(deleted.dbOrphans).toHaveLength(0)

    // Compare number of items in the bucket
    const s3ObjectAll = []
    let nextToken = ''

    do {
      const s3Objects = await storage.adapter.list(storageS3Bucket, {
        prefix: `${tenantId}/${bucket.id}`,
        nextToken,
      })
      s3ObjectAll.push(...s3Objects.keys)
      nextToken = s3Objects.nextToken ?? ''
    } while (nextToken)

    // Check s3 files are deleted
    expect(s3ObjectAll).toHaveLength(maxUploads - numToDelete)
    // Compare the keys names
    expect(s3ObjectAll.map((o) => o.name)).not.toEqual(
      expect.arrayContaining(objectsToDelete.map((o) => withOptionalVersion(o.name, o.version)))
    )

    // Check files are backed-up
    const backupFiles = await storage.adapter.list(storageS3Bucket, {
      prefix: `__internal/${tenantId}/${bucket.id}`,
    })

    expect(backupFiles.keys).toHaveLength(numToDelete)
  }, 30000)
})
