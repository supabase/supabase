import { type DatabaseExecutor, getTenantConfig } from '@internal/database'
import { ERRORS } from '@internal/errors'
import { logger, logSchema } from '@internal/monitoring'
import { queueJobScheduled, queueJobSchedulingTime } from '@internal/monitoring/metrics'
import { PgQueueDB } from '@internal/queue/database'
import PgBoss, { Job, Queue as PgBossQueue, SendOptions, WorkOptions } from 'pg-boss'
import { getConfig } from '../../config'
import { SYNC_JOB_ID, SYSTEM_TENANT_REF } from './constants'
import { PG_BOSS_SCHEMA, Queue } from './queue'

export interface BasePayload {
  $version?: string
  singletonKey?: string
  scheduleAt?: Date
  reqId?: string
  sbReqId?: string
  tenant: {
    ref: string
    host: string
  }
}

const { pgQueueEnable, region, isMultitenant } = getConfig()
type TransactionalQueueDb = DatabaseExecutor

function withPayloadVersion<TPayload extends BasePayload>(
  payload: TPayload,
  version: string
): TPayload {
  return {
    ...payload,
    $version: payload.$version ?? version,
  }
}

export type EventInputPayload = Omit<BasePayload, '$version'>
export type QueueEvent<T extends EventInputPayload = EventInputPayload> = Event<T>
export type StaticThis<TPayload extends BasePayload> = BaseEventConstructor<TPayload>

interface BaseEventConstructor<TPayload extends BasePayload> {
  version: string

  new (payload: TPayload): QueueEvent<Omit<TPayload, '$version'>>
}

/**
 * Base class for all events that are sent to the queue
 */
export class Event<T extends Omit<BasePayload, '$version'>> {
  public static readonly version: string = 'v1'
  protected static queueName = ''
  protected static allowSync = true

  constructor(public readonly payload: T & BasePayload) {}

  static eventName() {
    return this.name
  }

  static deadLetterQueueName() {
    return this.queueName + '-dead-letter'
  }

  static getQueueName() {
    if (!this.queueName) {
      throw new Error(`Queue name not set on ${this.constructor.name}`)
    }

    return this.queueName
  }

  static getQueueOptions(): PgBossQueue | undefined {
    return undefined
  }

  static getSendOptions(payload: BasePayload): SendOptions | undefined {
    return undefined
  }

  static getWorkerOptions(): WorkOptions & { concurrentTaskCount?: number } {
    return {}
  }

  static onClose() {
    // no-op
  }

  static onStart() {
    // no-op
  }

  static batchSend<TPayload extends BasePayload>(
    this: StaticThis<TPayload>,
    messages: Array<{ payload: TPayload; send(): Promise<string | void | null> }>
  ) {
    const eventClass = this as typeof Event

    if (!pgQueueEnable) {
      if (eventClass.allowSync) {
        return Promise.all(messages.map((message) => message.send()))
      } else {
        logger.warn(
          {
            type: 'queue',
            eventType: eventClass.eventName(),
          },
          '[Queue] skipped sending batch messages'
        )
        return
      }
    }

    return Queue.getInstance().insert(
      messages.map((message) => {
        const payloadWithVersion = withPayloadVersion(message.payload, eventClass.version)
        const sendOptions =
          (eventClass.getSendOptions(payloadWithVersion) as PgBoss.JobInsert) || {}

        if (payloadWithVersion.scheduleAt) {
          sendOptions.startAfter = new Date(payloadWithVersion.scheduleAt)
        }

        return {
          ...sendOptions,
          name: eventClass.getQueueName(),
          data: payloadWithVersion,
          deadLetter: eventClass.deadLetterQueueName(),
        }
      })
    )
  }

  static send<TPayload extends BasePayload>(
    this: StaticThis<TPayload>,
    payload: Omit<TPayload, '$version'>,
    opts?: SendOptions & { tnx?: TransactionalQueueDb }
  ) {
    const that = new this(withPayloadVersion(payload as TPayload, this.version))
    return that.send(opts)
  }

  static invoke<TPayload extends BasePayload>(
    this: StaticThis<TPayload>,
    payload: Omit<TPayload, '$version'>
  ) {
    const that = new this(withPayloadVersion(payload as TPayload, this.version))
    return that.invoke()
  }

  static invokeOrSend<TPayload extends BasePayload>(
    this: StaticThis<TPayload>,
    payload: Omit<TPayload, '$version'>,
    options?: SendOptions & { sendWhenError?: (error: unknown) => boolean }
  ) {
    const that = new this(withPayloadVersion(payload as TPayload, this.version))
    return that.invokeOrSend(options)
  }

  static handle(job: Job<BasePayload> | Job<BasePayload>[], opts?: { signal?: AbortSignal }) {
    throw new Error('not implemented')
  }

  static async shouldSend(payload: BasePayload) {
    if (isMultitenant && payload?.tenant?.ref) {
      // Do not send an event if disabled for this specific tenant
      const tenant = await getTenantConfig(payload.tenant.ref)
      const disabledEvents = tenant.disableEvents || []
      if (disabledEvents.includes(this.eventName())) {
        return false
      }
    }
    return true
  }

  /**
   * See issue https://github.com/timgit/pg-boss/issues/535
   * @param queueName
   * @param singletonKey
   * @param jobId
   */
  static async deleteIfActiveExists(queueName: string, singletonKey: string, jobId: string) {
    if (!pgQueueEnable) {
      return Promise.resolve()
    }

    await Queue.getDb().executeSql(
      `DELETE FROM ${PG_BOSS_SCHEMA}.job
       WHERE id = $1
       AND EXISTS(
          SELECT 1 FROM ${PG_BOSS_SCHEMA}.job
             WHERE id != $2
             AND state < 'active'
             AND name = $3
             AND singleton_key = $4
       )
      `,
      [jobId, jobId, queueName, singletonKey]
    )
  }

  async invokeOrSend(
    sendOptions?: SendOptions & { sendWhenError?: (error: unknown) => boolean }
  ): Promise<string | void | null> {
    const eventClass = this.constructor as typeof Event

    if (!eventClass.allowSync) {
      throw ERRORS.InternalError(undefined, 'Cannot send this event synchronously')
    }

    try {
      await this.invoke()
    } catch (e) {
      if (sendOptions?.sendWhenError && !sendOptions.sendWhenError(e)) {
        throw e
      }

      logSchema.error(logger, '[Queue] Error invoking event synchronously, sending to queue', {
        type: 'queue',
        project: this.payload.tenant?.ref || SYSTEM_TENANT_REF,
        error: e,
        metadata: JSON.stringify(this.payload),
        sbReqId: this.payload.sbReqId,
      })

      return this.send(sendOptions)
    }
  }

  async invoke(): Promise<string | void | null> {
    const eventClass = this.constructor as typeof Event

    if (!eventClass.allowSync) {
      throw ERRORS.InternalError(undefined, 'Cannot send this event synchronously')
    }

    await eventClass.handle({
      id: SYNC_JOB_ID,
      expireInSeconds: 0,
      name: eventClass.getQueueName(),
      data: {
        region,
        ...this.payload,
        $version: eventClass.version,
      },
    })
  }

  async send(
    customSendOptions?: SendOptions & { tnx?: TransactionalQueueDb }
  ): Promise<string | void | null> {
    const eventClass = this.constructor as typeof Event

    const shouldSend = await eventClass.shouldSend(this.payload)

    if (!shouldSend) {
      return
    }

    if (!pgQueueEnable) {
      if (eventClass.allowSync) {
        return eventClass.handle({
          id: SYNC_JOB_ID,
          expireInSeconds: 0,
          name: eventClass.getQueueName(),
          data: {
            region,
            ...this.payload,
            $version: eventClass.version,
          },
        })
      } else {
        logger.warn(
          {
            type: 'queue',
            eventType: eventClass.eventName(),
          },
          '[Queue] skipped sending message'
        )
        return
      }
    }

    const startTime = performance.now()
    const sendOptions = eventClass.getSendOptions(this.payload) || {}

    if (this.payload.scheduleAt) {
      sendOptions.startAfter = new Date(this.payload.scheduleAt)
    }

    sendOptions!.deadLetter = eventClass.deadLetterQueueName()

    try {
      const queue = customSendOptions?.tnx
        ? Queue.createPgBoss({
            enableWorkers: false,
            db: createTransactionQueueDB(customSendOptions.tnx),
          })
        : Queue.getInstance()

      const res = await queue.send({
        name: eventClass.getQueueName(),
        data: {
          region,
          ...this.payload,
          $version: eventClass.version,
        },
        options: {
          ...sendOptions,
          ...customSendOptions,
        },
      })

      // pg-boss returns null when the insert was dropped by a queue policy
      // (e.g. an exactly_once job with the same singleton key is still queued or active).
      if (res === null) {
        logSchema.info(logger, `[Queue Sender] Job not queued, dropped by queue policy`, {
          type: 'queue',
          project: this.payload.tenant?.ref || SYSTEM_TENANT_REF,
          metadata: JSON.stringify({ queue: eventClass.getQueueName() }),
          sbReqId: this.payload.sbReqId,
        })

        return res
      }

      queueJobScheduled.add(1, {
        name: eventClass.getQueueName(),
      })

      return res
    } catch (e) {
      // If we can't queue the message for some reason,
      // we run its handler right away.
      // This might create some latency with the benefit of being more fault-tolerant
      logSchema.warning(
        logger,
        `[Queue Sender] Error while sending job to queue, sending synchronously`,
        {
          type: 'queue',
          project: this.payload.tenant?.ref || SYSTEM_TENANT_REF,
          error: e,
          metadata: JSON.stringify(this.payload),
          sbReqId: this.payload.sbReqId,
        }
      )

      if (!eventClass.allowSync) {
        throw e
      }

      return eventClass.handle({
        id: SYNC_JOB_ID,
        expireInSeconds: 0,
        name: eventClass.getQueueName(),
        data: {
          region,
          ...this.payload,
          $version: eventClass.version,
        },
      })
    } finally {
      const duration = (performance.now() - startTime) / 1000
      queueJobSchedulingTime.record(duration, {
        name: eventClass.getQueueName(),
      })
    }
  }
}

function createTransactionQueueDB(tnx: TransactionalQueueDb) {
  return new PgQueueDB(tnx)
}
