import { Queue } from '@internal/queue'
import { PurgeCdnCache } from './cdn/purge-cdn-cache'
import { DeleteIcebergResources } from './iceberg/delete-iceberg-resources'
import { ReconcileIcebergCatalog } from './iceberg/reconcile-catalog'
import { JwksCreateSigningSecret } from './jwks/jwks-create-signing-secret'
import { JwksRollUrlSigningKey } from './jwks/jwks-roll-url-signing-key'
import { Webhook } from './lifecycle/webhook'
import { ResetMigrationsOnTenant } from './migrations/reset-migrations'
import { RunMigrationsOnTenants } from './migrations/run-migrations'
import { BackupObjectEvent } from './objects/backup-object'
import { ObjectAdminDelete } from './objects/object-admin-delete'
import { ObjectAdminDeleteAllBefore } from './objects/object-admin-delete-all-before'
import { MoveJobs } from './pgboss/move-jobs'
import { SyncCatalogIds } from './upgrades/sync-catalog-ids'

export function registerWorkers() {
  Queue.register(Webhook)
  Queue.register(PurgeCdnCache)
  Queue.register(ObjectAdminDelete)
  Queue.register(ObjectAdminDeleteAllBefore)
  Queue.register(RunMigrationsOnTenants)
  Queue.register(BackupObjectEvent)
  Queue.register(ResetMigrationsOnTenant)
  Queue.register(JwksCreateSigningSecret)
  Queue.register(JwksRollUrlSigningKey)
  Queue.register(MoveJobs)
  Queue.register(ReconcileIcebergCatalog)
  Queue.register(DeleteIcebergResources)
  Queue.register(SyncCatalogIds)
}
