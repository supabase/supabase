import { getTenantConfig, multitenantPgExecutor } from '@internal/database'
import { BasePayload } from '@internal/queue'
import { PgShardStoreFactory, ShardCatalog, SingleShard } from '@internal/sharding'
import { BucketType } from '@storage/limits'
import { getCatalogAuthStrategy, TenantAwareRestCatalog } from '@storage/protocols/iceberg/catalog'
import { PgMetastore } from '@storage/protocols/iceberg/pg'
import { Job } from 'pg-boss'
import { getConfig } from '../../../config'
import { BaseEvent } from '../base-event'

interface ObjectCreatedEvent extends BasePayload {
  bucketId: string
  bucketName: string
  type: BucketType
}

const { icebergCatalogAuthType, icebergWarehouse, icebergCatalogUrl, isMultitenant } = getConfig()

const catalogAuthType = getCatalogAuthStrategy(icebergCatalogAuthType)

export class BucketCreatedEvent extends BaseEvent<ObjectCreatedEvent> {
  protected static queueName = 'bucket:created'

  static eventName() {
    return `Bucket:Created`
  }

  static async handle(job: Job<ObjectCreatedEvent>) {
    if (!isMultitenant || job.data.type !== 'ANALYTICS') {
      return
    }

    const { features } = await getTenantConfig(job.data.tenant.ref)

    const restCatalog = new TenantAwareRestCatalog({
      tenantId: job.data.tenant.ref,
      limits: {
        maxNamespaceCount: features.icebergCatalog.maxNamespaces,
        maxTableCount: features.icebergCatalog.maxTables,
        maxCatalogsCount: features.icebergCatalog.maxCatalogs,
      },
      restCatalogUrl: icebergCatalogUrl,
      sharding: isMultitenant
        ? new ShardCatalog(new PgShardStoreFactory(multitenantPgExecutor))
        : new SingleShard({
            shardKey: icebergWarehouse,
            capacity: 10000,
          }),
      auth: catalogAuthType,
      metastore: new PgMetastore(multitenantPgExecutor, {
        multiTenant: true,
        schema: 'public',
      }),
    })

    await restCatalog.registerCatalog({
      bucketId: job.data.bucketId,
      bucketName: job.data.bucketName,
      tenantId: job.data.tenant.ref,
    })
  }
}
