import { createStorageBackend, StorageBackendAdapter } from '@storage/backend'
import type { Database } from '@storage/database'
import { StoragePgDB } from '@storage/database'
import { PassThroughLocation, TenantLocation } from '@storage/locator'
import { Storage } from '@storage/storage'
import fastifyPlugin from 'fastify-plugin'
import { getConfig } from '../../config'

declare module 'fastify' {
  interface FastifyRequest {
    storage: Storage
    backend: StorageBackendAdapter
  }
}

const { storageBackendType, storageS3Bucket } = getConfig()

const storageBackend = createStorageBackend(storageBackendType)

// TenantLocation is immutable so singleton not to allocate per request.
const tenantLocation = new TenantLocation(storageS3Bucket)

export const storage = fastifyPlugin(
  async function storagePlugin(fastify) {
    fastify.decorateRequest('storage')
    fastify.addHook('preHandler', (request, _reply, done) => {
      const databaseOptions = {
        tenantId: request.tenantId,
        host: request.headers['x-forwarded-host'] as string,
        reqId: request.id,
        sbReqId: request.sbReqId,
        latestMigration: request.latestMigration,
      }

      const database: Database = new StoragePgDB(request.db, databaseOptions)

      const location = request.isIcebergBucket
        ? new PassThroughLocation(request.internalIcebergBucketName!)
        : tenantLocation

      request.backend = storageBackend
      request.storage = new Storage(storageBackend, database, location)
      done()
    })

    fastify.addHook('onClose', (_instance, done) => {
      storageBackend.close()
      done()
    })
  },
  { name: 'storage-init' }
)
