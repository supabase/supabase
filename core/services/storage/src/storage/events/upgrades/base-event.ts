import { type DatabaseTransaction, multitenantPgExecutor } from '@internal/database'
import { hashStringToInt } from '@internal/hashing'
import { logger, logSchema } from '@internal/monitoring'
import type { BasePayload } from '@internal/queue'
import { BaseEvent } from '@storage/events'
import { Job, Queue as PgBossQueue, SendOptions } from 'pg-boss'
import { getConfig } from '../../../config'

const { isMultitenant } = getConfig()

export type UpgradeBaseEventPayload = BasePayload
export type UpgradeTransaction = DatabaseTransaction

export abstract class UpgradeBaseEvent<T extends UpgradeBaseEventPayload> extends BaseEvent<T> {
  static getQueueOptions(): PgBossQueue {
    return {
      name: this.queueName,
      policy: 'exactly_once',
    } as const
  }

  static getSendOptions(): SendOptions {
    return {
      expireInHours: 2,
      singletonKey: this.getQueueName(),
      singletonHours: 12,
      retryBackoff: false,
      retryLimit: 3,
      retryDelay: 5,
      priority: 10,
    }
  }

  static async handleUpgrade(
    tnx: UpgradeTransaction,
    job: Job<UpgradeBaseEventPayload>
  ): Promise<void> {}

  static async handle(job: Job<UpgradeBaseEventPayload>) {
    if (!isMultitenant) {
      return
    }

    await this.runOnce((t) => {
      return this.handleUpgrade(t, job)
    })
  }

  protected static async runOnce(fn: (t: UpgradeTransaction) => Promise<unknown> | void) {
    logSchema.info(logger, `[Upgrade] Starting upgrade event: ${this.getQueueName()}`, {
      type: 'upgradeEvent',
    })

    const t = await multitenantPgExecutor.beginTransaction()

    try {
      const hash = hashStringToInt('event:upgrade-lock')
      const result = await t.query<{ pg_try_advisory_xact_lock: boolean }>({
        text: `SELECT pg_try_advisory_xact_lock($1);`,
        values: [hash],
      })
      const lockAcquired = result.rows.shift()?.pg_try_advisory_xact_lock || false

      if (!lockAcquired) {
        logSchema.info(logger, `[Upgrade] Lock already acquired for: ${this.getQueueName()}`, {
          type: 'upgradeEvent',
        })
        await t.commit()
        return
      }

      const id = await t.query<{ event_id: string }>({
        text: `SELECT event_id FROM event_upgrades WHERE event_id = $1 LIMIT 1`,
        values: [this.getQueueName()],
      })

      if (id.rows.length > 0) {
        await t.commit()
        return
      }

      await fn(t)

      await t.query({
        text: `
          INSERT INTO event_upgrades (event_id)
          VALUES ($1)
          ON CONFLICT (event_id) DO NOTHING
        `,
        values: [this.getQueueName()],
      })

      logSchema.info(logger, `[Upgrade] Completed upgrade: ${this.getQueueName()}`, {
        type: 'upgradeEvent',
      })

      await t.commit()
    } catch (e) {
      try {
        await t.rollback()
      } catch (rollbackError) {
        logSchema.warning(logger, '[Upgrade] Failed to rollback transaction', {
          type: 'upgradeEvent',
          error: rollbackError,
          metadata: JSON.stringify({
            queueName: this.getQueueName(),
            originalError: String(e),
          }),
        })
      }
      throw e
    }
  }
}
