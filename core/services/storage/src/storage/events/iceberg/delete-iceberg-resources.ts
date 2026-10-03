import { multitenantPgExecutor } from '@internal/database'
import { ERRORS, ErrorCode, isStorageError } from '@internal/errors'
import { BasePayload } from '@internal/queue'
import { PgShardStoreFactory, ShardCatalog } from '@internal/sharding'
import { getCatalogAuthStrategy, RestCatalogClient } from '@storage/protocols/iceberg/catalog'
import { IcebergError } from '@storage/protocols/iceberg/catalog/errors'
import { PgMetastore } from '@storage/protocols/iceberg/pg'
import type { Storage } from '@storage/storage'
import { Job, Queue as PgBossQueue, SendOptions, WorkOptions } from 'pg-boss'
import { getConfig } from '../../../config'
import { BaseEvent } from '../base-event'

const { icebergCatalogUrl, icebergCatalogAuthType, isMultitenant } = getConfig()

const catalogAuthType = getCatalogAuthStrategy(icebergCatalogAuthType)

interface DeleteIcebergResourcesPayload extends BasePayload {
  catalogId: string
}

export class DeleteIcebergResources extends BaseEvent<DeleteIcebergResourcesPayload> {
  static allowSync = false
  static queueName = 'delete-iceberg-resources'

  static getQueueOptions(): PgBossQueue {
    return {
      name: this.queueName,
      policy: 'exactly_once',
    } as const
  }

  static getWorkerOptions(): WorkOptions {
    return {
      includeMetadata: true,
    }
  }

  static getSendOptions(payload: DeleteIcebergResourcesPayload): SendOptions {
    return {
      expireInHours: 2,
      singletonKey: payload.catalogId,
      expireInMinutes: 120,
      singletonHours: 12,
      retryLimit: 3,
      retryDelay: 5,
      priority: 10,
    }
  }

  static async handle(job: Job<DeleteIcebergResourcesPayload>) {
    let eventStorage: Storage | undefined

    try {
      try {
        eventStorage = await this.createStorage(job.data)
      } catch (e) {
        // don't require tenant db for multitenant
        // if the tenant was removed we can still cleanup the resources and multitenant db
        if (!isMultitenant) {
          throw e
        }
      }

      const metastore = new PgMetastore(
        isMultitenant ? multitenantPgExecutor : eventStorage!.db.connection,
        {
          multiTenant: isMultitenant,
          schema: isMultitenant ? 'public' : 'storage',
        }
      )

      const restCatalog = new RestCatalogClient({
        catalogUrl: icebergCatalogUrl,
        auth: catalogAuthType,
      })

      await metastore.transaction(async (store) => {
        await store.lockResource('catalog', job.data.catalogId)

        const catalog = await store.findCatalogById({
          id: job.data.catalogId,
          deleted: true,
          tenantId: job.data.tenant.ref,
        })

        if (!catalog.deleted_at) {
          throw ERRORS.UnableToEmptyBucket(
            job.data.catalogId,
            `Catalog ${job.data.catalogId} is not marked for deletion`
          )
        }

        const namespaces = await store.listNamespaces({
          catalogId: job.data.catalogId,
          tenantId: job.data.tenant.ref,
        })

        // Delete all tables and namespaces in the catalog
        await Promise.all(
          namespaces.map(async (ns) => {
            const tables = await store.listTables({
              namespaceId: ns.id,
              pageSize: 1000,
              tenantId: job.data.tenant.ref,
            })

            for (const table of tables) {
              if (!table.shard_key || !table.shard_id) {
                continue
              }

              try {
                await restCatalog.dropTable({
                  namespace: ns.name,
                  table: table.name,
                  purgeRequested: true,
                  warehouse: table.shard_key,
                })
              } catch (e) {
                if (e instanceof IcebergError && e.code === 404) {
                  // Table not found in remote catalog, continue to delete metadata
                } else {
                  throw e
                }
              }

              await store.dropTable({
                name: table.name,
                namespaceId: ns.id, // namespace_id UUID
                catalogId: job.data.catalogId,
                tenantId: job.data.tenant.ref,
              })

              const listTables = await restCatalog.listTables({
                namespace: `${job.data.tenant.ref}_${ns.id.replaceAll('-', '_')}`,
                warehouse: table.shard_key,
                pageSize: 1,
              })

              if (listTables.identifiers.length === 0) {
                await restCatalog.dropNamespace({
                  namespace: ns.name,
                  warehouse: table.shard_key,
                })
                // Delete the namespace metadata after removing it from remote catalog
                await store.dropNamespace({
                  namespace: ns.name,
                  catalogId: job.data.catalogId,
                  tenantId: job.data.tenant.ref,
                })
              }

              if (isMultitenant) {
                const sharding = new ShardCatalog(new PgShardStoreFactory(multitenantPgExecutor))
                const sharder = sharding.withTnx(store.getTnx())
                await sharder.freeByResource(table.shard_id, {
                  kind: 'iceberg-table',
                  tenantId: job.data.tenant.ref,
                  bucketName: job.data.catalogId,
                  logicalName: `${ns.id}/${table.name}`,
                })
              }
            }
          })
        )

        // Finally, drop the catalog
        // Child rows are already deleted, so this won't trigger cascading deletes
        await store.dropCatalog({
          bucketId: job.data.catalogId,
          tenantId: job.data.tenant.ref,
          soft: false,
        })

        if (isMultitenant && eventStorage) {
          try {
            // Delete the underlying bucket
            await eventStorage.db.deleteAnalyticsBucket(job.data.catalogId)
          } catch (e) {
            // if the bucket was already removed we can ignore this error
            // this allows orphan resources to be removed (throwing would rollback)
            if (!isStorageError(ErrorCode.NoSuchBucket, e)) {
              throw e
            }
          }
        }
      })
    } finally {
      if (eventStorage) {
        eventStorage.db.destroyConnection()
      }
    }
  }
}
