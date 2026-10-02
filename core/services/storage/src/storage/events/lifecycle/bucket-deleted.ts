import { multitenantPgExecutor } from '@internal/database'
import { ErrorCode, StorageBackendError } from '@internal/errors'
import { BasePayload } from '@internal/queue'
import { DeleteIcebergResources } from '@storage/events/iceberg/delete-iceberg-resources'
import { BucketType } from '@storage/limits'
import { PgMetastore } from '@storage/protocols/iceberg/pg'
import type { Storage } from '@storage/storage'
import { Job } from 'pg-boss'
import { getConfig } from '../../../config'
import { BaseEvent } from '../base-event'

interface BucketDeletedEvent extends BasePayload {
  bucketId: string
  type: BucketType
}

const { isMultitenant } = getConfig()

export class BucketDeleted extends BaseEvent<BucketDeletedEvent> {
  protected static queueName = 'bucket:deleted'

  static eventName() {
    return `Bucket:Deleted`
  }

  static async handle(job: Job<BucketDeletedEvent>) {
    if (job.data.type !== 'ANALYTICS') {
      return
    }

    const bucketId = job.data.bucketId

    let storage: Storage | undefined

    try {
      storage = await this.createStorage(job.data)
      const eventStorage = storage

      const metastore = new PgMetastore(
        isMultitenant ? multitenantPgExecutor : eventStorage.db.connection,
        {
          multiTenant: isMultitenant,
          schema: isMultitenant ? 'public' : 'storage',
        }
      )

      await metastore.transaction(async (metastoreTx) => {
        if (isMultitenant) {
          try {
            await metastoreTx.findCatalogById({
              id: bucketId,
              tenantId: job.data.tenant.ref,
              deleted: true,
            })
          } catch (e) {
            if (e instanceof StorageBackendError && e.code === ErrorCode.NoSuchCatalog) {
              await eventStorage.db.deleteAnalyticsBucket(bucketId)
              return
            }
            throw e
          }
        }

        await metastoreTx.dropCatalog({
          bucketId,
          tenantId: job.data.tenant.ref,
          soft: true,
        })

        await DeleteIcebergResources.send(
          {
            tenant: job.data.tenant,
            catalogId: job.data.bucketId,
            sbReqId: job.data.sbReqId,
          },
          {
            tnx: isMultitenant ? metastoreTx.getTnx() : undefined,
          }
        )

        if (isMultitenant) {
          await eventStorage.db.deleteAnalyticsBucket(bucketId, { soft: true })
        }
      })
    } finally {
      if (storage) {
        storage.db.destroyConnection()
      }
    }
  }
}
