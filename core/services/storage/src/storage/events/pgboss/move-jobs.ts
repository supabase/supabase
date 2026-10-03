import { type DatabaseTransaction, multitenantPgExecutor } from '@internal/database'
import { logger, logSchema } from '@internal/monitoring'
import { BasePayload, PG_BOSS_SCHEMA, Queue, SYSTEM_TENANT_REF } from '@internal/queue'
import { Job, Queue as PgBossQueue, SendOptions, WorkOptions } from 'pg-boss'
import { BaseEvent } from '../base-event'

interface MoveJobsPayload extends BasePayload {
  fromQueue: string
  toQueue: string
  deleteJobsFromOriginalQueue?: boolean
}

export class MoveJobs extends BaseEvent<MoveJobsPayload> {
  static queueName = 'move-jobs'

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

  static getSendOptions(payload: MoveJobsPayload): SendOptions {
    return {
      expireInHours: 2,
      singletonKey: `move_${payload.fromQueue}_to_${payload.toQueue}`,
      singletonHours: 12,
      retryLimit: 3,
      retryDelay: 5,
      priority: 10,
    }
  }

  static async handle(job: Job<MoveJobsPayload>) {
    return this.handlePg(job)
  }

  private static async handlePg(job: Job<MoveJobsPayload>) {
    const { sbReqId } = job.data

    await withPgTransaction(async (tnx) => {
      const resultLock = await tnx.query<{ locked: boolean }>(
        `SELECT pg_try_advisory_xact_lock(-5525285245963000611) AS locked`
      )
      const lockAcquired = resultLock.rows.shift()?.locked || false

      if (!lockAcquired) {
        return
      }

      const schema = PG_BOSS_SCHEMA
      const fromQueueName = job.data.fromQueue
      const toQueue = await Queue.getInstance().getQueue(job.data.toQueue)

      if (!toQueue) {
        logSchema.error(logger, `[PgBoss] Target queue ${job.data.toQueue} does not exist`, {
          type: 'pgboss',
          project: job.data.tenant?.ref || SYSTEM_TENANT_REF,
          sbReqId,
        })
        return
      }

      try {
        await tnx.query({
          text: `
            INSERT INTO ${schema}.job (
                id,
                name,
                priority,
                data,
                retry_limit,
                retry_count,
                retry_delay,
                retry_backoff,
                start_after,
                singleton_key,
                singleton_on,
                expire_in,
                created_on,
                keep_until,
                output,
                policy,
                state
            )
            SELECT
                id,
                $1 as name,
                priority,
                data,
                retry_limit,
                retry_count,
                retry_delay,
                retry_backoff,
                start_after,
                singleton_key,
                singleton_on,
                expire_in,
                created_on,
                keep_until,
                output,
                $2 as policy,
                'created' as state
            FROM ${schema}.job
            WHERE name = $3
                AND state IN ('created', 'active', 'retry')
            ON CONFLICT DO NOTHING
          `,
          values: [toQueue.name, toQueue.policy, fromQueueName],
        })

        if (job.data.deleteJobsFromOriginalQueue) {
          await tnx.query({
            text: `
              DELETE FROM ${schema}.job
              WHERE name = $1
                AND state IN ('created', 'active', 'retry')
            `,
            values: [fromQueueName],
          })
        }
      } catch (error) {
        logSchema.error(logger, '[PgBoss] Error while copying jobs', {
          type: 'pgboss',
          error,
          project: job.data.tenant?.ref || SYSTEM_TENANT_REF,
          sbReqId,
        })
      }
    })
  }
}

async function withPgTransaction<T>(fn: (tnx: DatabaseTransaction) => Promise<T>): Promise<T> {
  const tnx = await multitenantPgExecutor.beginTransaction()

  try {
    const result = await fn(tnx)
    await tnx.commit()
    return result
  } catch (e) {
    try {
      await tnx.rollback()
    } catch (rollbackError) {
      logSchema.warning(logger, '[MoveJobs] Failed to rollback transaction', {
        type: 'pgboss',
        error: rollbackError,
        metadata: JSON.stringify({ originalError: String(e) }),
      })
    }
    throw e
  }
}
