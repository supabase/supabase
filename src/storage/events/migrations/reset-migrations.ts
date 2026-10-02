import { getTenantConfig } from '@internal/database'
import { DBMigration, resetMigration } from '@internal/database/migrations'
import { logger, logSchema } from '@internal/monitoring'
import { BasePayload } from '@internal/queue'
import { JobWithMetadata, Queue, SendOptions, WorkOptions } from 'pg-boss'
import { BaseEvent } from '../base-event'
import { RunMigrationsOnTenants } from './run-migrations'

interface ResetMigrationsPayload extends BasePayload {
  tenantId: string
  untilMigration: keyof typeof DBMigration
  markCompletedTillMigration?: keyof typeof DBMigration
}

export class ResetMigrationsOnTenant extends BaseEvent<ResetMigrationsPayload> {
  static queueName = 'tenants-migrations-reset-v2'

  static getQueueOptions(): Queue {
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

  static getSendOptions(payload: ResetMigrationsPayload): SendOptions {
    return {
      expireInHours: 2,
      singletonKey: payload.tenantId,
      retryLimit: 3,
      retryDelay: 5,
      priority: 10,
    }
  }

  static async handle(job: JobWithMetadata<ResetMigrationsPayload>) {
    const tenantId = job.data.tenant.ref
    const { sbReqId } = job.data
    const tenant = await getTenantConfig(tenantId)

    logSchema.info(logger, `[Migrations] resetting migrations for ${tenantId}`, {
      type: 'migrations',
      project: tenantId,
      sbReqId,
    })

    const reset = await resetMigration({
      tenantId,
      markCompletedTillMigration: job.data.markCompletedTillMigration,
      untilMigration: job.data.untilMigration,
      databaseUrl: tenant.databaseUrl,
    })

    if (reset) {
      await RunMigrationsOnTenants.send({
        tenantId,
        tenant: {
          ref: tenantId,
          host: '',
        },
        singletonKey: tenantId,
        sbReqId,
      })
    }

    logSchema.info(logger, `[Migrations] reset successful for ${tenantId}`, {
      type: 'migrations',
      project: tenantId,
      sbReqId,
    })
  }
}
