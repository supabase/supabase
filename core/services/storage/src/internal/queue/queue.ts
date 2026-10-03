import { createConcurrencyLimiter } from '@internal/concurrency'
import { ERRORS } from '@internal/errors'
import { QueueDB } from '@internal/queue/database'
import PgBoss, { Db, Job, JobWithMetadata } from 'pg-boss'
import { getConfig } from '../../config'
import { getSbReqIdFromPayload, logger, logSchema } from '../monitoring'
import {
  queueJobCompleted,
  queueJobCompleteFailed,
  queueJobError,
  queueJobRetryFailed,
} from '../monitoring/metrics'
import { Event } from './event'

type RegisteredEvent = {
  deadLetterQueueName(): string
  getQueueName(): string
  getQueueOptions(): ReturnType<typeof Event.getQueueOptions>
  getWorkerOptions(): ReturnType<typeof Event.getWorkerOptions>
  handle(job: Job<unknown> | Job<unknown>[], opts?: { signal?: AbortSignal }): unknown
  onClose(): unknown
  onStart(): unknown
  name: string
}

export const PG_BOSS_SCHEMA = 'pgboss_v10'
const queueStopTimeoutMs = 25_000

export abstract class Queue {
  protected static events: RegisteredEvent[] = []
  private static pgBoss?: PgBoss
  private static pgBossDb?: PgBoss.Db

  static createPgBoss(opts: { db: Db; enableWorkers: boolean }) {
    const {
      isMultitenant,
      databaseURL,
      multitenantDatabasePoolUrl,
      multitenantDatabaseUrl,
      pgQueueConnectionURL,
      pgQueueArchiveCompletedAfterSeconds,
      pgQueueDeleteAfterDays,
      pgQueueDeleteAfterHours,
      pgQueueRetentionDays,
    } = getConfig()

    let url = pgQueueConnectionURL ?? databaseURL
    let migrate = true

    if (isMultitenant && !pgQueueConnectionURL) {
      if (!multitenantDatabaseUrl) {
        throw new Error(
          'running storage in multi-tenant but DB_MULTITENANT_DATABASE_URL is not set'
        )
      }
      url = multitenantDatabasePoolUrl || multitenantDatabaseUrl

      if (multitenantDatabasePoolUrl) {
        migrate = false
      }
    }

    return new PgBoss({
      connectionString: url,
      migrate,
      db: opts.db,
      schema: PG_BOSS_SCHEMA,
      ...(pgQueueDeleteAfterHours
        ? { deleteAfterHours: pgQueueDeleteAfterHours }
        : { deleteAfterDays: pgQueueDeleteAfterDays }),
      archiveCompletedAfterSeconds: pgQueueArchiveCompletedAfterSeconds,
      retentionDays: pgQueueRetentionDays,
      retryBackoff: true,
      retryLimit: 20,
      expireInHours: 23,
      maintenanceIntervalSeconds: 60 * 5,
      schedule: opts.enableWorkers,
      supervise: opts.enableWorkers,
    })
  }

  static async start(opts: {
    signal?: AbortSignal
    onMessage?: (job: Job) => void
    registerWorkers?: () => void
  }) {
    if (Queue.pgBoss) {
      return Queue.pgBoss
    }

    if (opts.signal?.aborted) {
      throw ERRORS.Aborted('Cannot start queue with aborted signal')
    }

    const {
      isMultitenant,
      databaseURL,
      multitenantDatabaseUrl,
      multitenantDatabasePoolUrl,
      pgQueueConnectionURL,
      pgQueueEnableWorkers,
      pgQueueReadWriteTimeout,
      pgQueueConcurrentTasksPerQueue,
      pgQueueMaxConnections,
      databaseApplicationName,
    } = getConfig()

    let url = pgQueueConnectionURL || databaseURL

    if (isMultitenant && !pgQueueConnectionURL) {
      if (!multitenantDatabaseUrl && !multitenantDatabasePoolUrl) {
        throw new Error(
          'running storage in multi-tenant but DB_MULTITENANT_DATABASE_URL is not set'
        )
      }
      url = (multitenantDatabasePoolUrl || multitenantDatabaseUrl) as string
    }

    Queue.pgBossDb = new QueueDB({
      min: 0,
      max: pgQueueMaxConnections,
      connectionString: url,
      application_name: databaseApplicationName,
      statement_timeout: pgQueueReadWriteTimeout > 0 ? pgQueueReadWriteTimeout : undefined,
    })

    Queue.pgBoss = this.createPgBoss({
      db: Queue.pgBossDb,
      enableWorkers: pgQueueEnableWorkers !== false,
    })

    Queue.pgBoss.on('error', (error) => {
      logSchema.error(logger, '[Queue] error', {
        type: 'queue',
        error,
      })
    })

    await Queue.pgBoss.start()

    if (opts.registerWorkers && pgQueueEnableWorkers) {
      opts.registerWorkers()
    }

    await Queue.callStart()
    await Queue.startWorkers({
      maxConcurrentTasks: pgQueueConcurrentTasksPerQueue,
      onMessage: opts.onMessage,
      signal: opts.signal,
    })

    if (opts.signal) {
      opts.signal.addEventListener(
        'abort',
        async () => {
          logSchema.info(logger, '[Queue] Stopping', {
            type: 'queue',
          })
          return Queue.stop()
            .then(async () => {
              logSchema.info(logger, '[Queue] Exited', {
                type: 'queue',
              })
            })
            .catch((e) => {
              logSchema.error(logger, '[Queue] Error while stopping queue', {
                error: e,
                type: 'queue',
              })
            })
        },
        { once: true }
      )
    }

    return Queue.pgBoss
  }

  static getInstance() {
    if (!this.pgBoss) {
      throw new Error('pg boss not initialised')
    }

    return this.pgBoss
  }

  static getDb() {
    if (!this.pgBossDb) {
      throw new Error('pg boss not initialised')
    }

    return this.pgBossDb
  }

  static register<T extends RegisteredEvent>(event: T) {
    Queue.events.push(event)
  }

  static async stop() {
    if (!this.pgBoss) {
      return
    }

    const boss = this.pgBoss
    const db = this.pgBossDb
    const { isProduction } = getConfig()

    try {
      await withQueueStopTimeout(
        boss.stop({
          timeout: 20 * 1000,
          graceful: isProduction,
          wait: true,
        }),
        'Queue stop'
      )
    } finally {
      try {
        await withQueueStopTimeout(this.callClose(), 'Queue close')
      } finally {
        if (Queue.pgBoss === boss) {
          Queue.pgBoss = undefined
        }

        if (Queue.pgBossDb === db) {
          Queue.pgBossDb = undefined
        }
      }
    }
  }

  protected static async startWorkers(opts: {
    maxConcurrentTasks: number
    signal?: AbortSignal
    onMessage?: (job: Job) => void
  }) {
    for (const event of Queue.events) {
      await Queue.registerTask(event, opts.maxConcurrentTasks, opts.onMessage, opts.signal)
    }
  }

  protected static callStart() {
    const events = Queue.events.map((event) => {
      return event.onStart()
    })

    return Promise.all(events)
  }

  protected static callClose() {
    const events = Queue.events.map((event) => {
      return event.onClose()
    })

    return Promise.all(events)
  }

  protected static async registerTask(
    event: RegisteredEvent,
    maxConcurrentTasks: number,
    onMessage?: (job: Job) => void,
    signal?: AbortSignal
  ) {
    const queueName = event.getQueueName()
    const deadLetterName = event.deadLetterQueueName()

    const concurrentTaskCount = event.getWorkerOptions().concurrentTaskCount || maxConcurrentTasks
    try {
      // Create dead-letter queue and the normal queue
      const queueOptions = {
        policy: 'standard',
        ...event.getQueueOptions(),
      } as const

      // dead-letter
      await this.pgBoss?.createQueue(deadLetterName, {
        ...queueOptions,
        name: deadLetterName,
        retentionDays: 30,
        retryBackoff: true,
      })

      // // normal queue
      await this.pgBoss?.createQueue(queueName, {
        ...queueOptions,
        name: queueName,
        deadLetter: deadLetterName,
      })
    } catch {
      // no-op
    }

    return this.pollQueue(event, {
      concurrentTaskCount,
      onMessage,
      signal,
    })
  }

  protected static pollQueue(
    event: RegisteredEvent,
    queueOpts: {
      concurrentTaskCount: number
      onMessage?: (job: Job) => void
      signal?: AbortSignal
    }
  ) {
    const limitConcurrency = createConcurrencyLimiter(queueOpts.concurrentTaskCount)
    const pollingInterval = (event.getWorkerOptions().pollingIntervalSeconds || 5) * 1000
    const batchSize =
      event.getWorkerOptions().batchSize ||
      queueOpts.concurrentTaskCount + Math.max(1, Math.floor(queueOpts.concurrentTaskCount * 1.2))

    logSchema.info(logger, `[Queue] Polling queue ${event.getQueueName()}`, {
      type: 'queue',
      metadata: JSON.stringify({
        queueName: event.getQueueName(),
        batchSize,
        pollingInterval,
      }),
    })

    let started = false
    let jobFetched = 0

    const interval = setInterval(async () => {
      if (started) {
        return
      }

      try {
        started = true
        const defaultFetch = {
          includeMetadata: true,
          batchSize,
        }

        const currentBatch = defaultFetch.batchSize - jobFetched

        if (currentBatch <= 0) {
          return
        }

        const jobs = await this.pgBoss?.fetch(event.getQueueName(), {
          ...event.getWorkerOptions(),
          ...defaultFetch,
          batchSize: currentBatch,
        })

        jobFetched += jobs?.length || 0

        if (jobFetched < defaultFetch.batchSize) {
          started = false
        }

        if (queueOpts.signal?.aborted) {
          started = false

          // The fetch above already marked these jobs as active. Fail them so
          // they become retryable right after restart instead of sitting in the
          // active state until pg-boss expires them.
          if (jobs && jobs.length > 0) {
            jobFetched = Math.max(0, jobFetched - jobs.length)

            try {
              await this.pgBoss?.fail(
                event.getQueueName(),
                jobs.map((job) => job.id)
              )
            } catch (e) {
              logSchema.error(
                logger,
                `[Queue] Error failing jobs fetched during shutdown ${event.name}`,
                {
                  type: 'queue',
                  error: e,
                  metadata: JSON.stringify({ queueName: event.getQueueName(), jobs: jobs.length }),
                }
              )
            }
          }

          return
        }

        if (!jobs || (jobs && jobs.length === 0)) {
          started = false
          return
        }

        await Promise.allSettled(
          jobs.map((job) =>
            limitConcurrency(async () => {
              const sbReqId = getSbReqIdFromPayload(job.data)
              const logJobError = (message: string, error: unknown) => {
                logSchema.error(logger, message, {
                  type: 'queue-task',
                  error,
                  metadata: JSON.stringify(job),
                  sbReqId,
                })
              }

              try {
                try {
                  queueOpts.onMessage?.(job as Job)

                  await event.handle(job, { signal: queueOpts.signal })
                } catch (e) {
                  queueJobRetryFailed.add(1, {
                    name: event.getQueueName(),
                  })

                  logJobError(`[Queue Handler] Error while processing job ${event.name}`, e)

                  try {
                    await this.pgBoss?.fail(event.getQueueName(), job.id)

                    try {
                      const dbJob: JobWithMetadata | null =
                        (job as JobWithMetadata).priority !== undefined
                          ? (job as JobWithMetadata)
                          : await Queue.getInstance().getJobById(event.getQueueName(), job.id)

                      if (dbJob && dbJob.retryCount >= dbJob.retryLimit) {
                        queueJobError.add(1, {
                          name: event.getQueueName(),
                        })
                      }
                    } catch (fetchError) {
                      logJobError(`[Queue Handler] fetching job ${event.name}`, fetchError)
                    }
                  } catch (failError) {
                    logJobError(
                      `[Queue Handler] Error while marking job as failed ${event.name}`,
                      failError
                    )
                  }

                  throw e
                }

                try {
                  await this.pgBoss?.complete(event.getQueueName(), job.id)
                  queueJobCompleted.add(1, {
                    name: event.getQueueName(),
                  })
                } catch (e) {
                  queueJobCompleteFailed.add(1, {
                    name: event.getQueueName(),
                  })
                  logJobError(`[Queue Handler] Error while completing job ${event.name}`, e)
                  throw e
                }
              } finally {
                jobFetched = Math.max(0, jobFetched - 1)
              }
            })
          )
        )
      } catch (e) {
        logSchema.error(logger, `[Queue] Error while polling queue ${event.name}`, {
          type: 'queue',
          error: e,
          metadata: JSON.stringify({
            queueName: event.getQueueName(),
            batchSize,
            pollingInterval,
          }),
        })
      } finally {
        started = false
      }
    }, pollingInterval)

    queueOpts.signal?.addEventListener('abort', () => {
      clearInterval(interval)
    })
  }
}

async function withQueueStopTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${queueStopTimeoutMs}ms`))
    }, queueStopTimeoutMs)
    timeout.unref?.()
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}
