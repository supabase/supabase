import EventEmitter from 'node:events'
import { ERRORS } from '@internal/errors'
import { logger, logSchema } from '@internal/monitoring'
import createSubscriber, { Subscriber } from 'pg-listen'
import { PubSubAdapter } from './adapter'

export class PostgresPubSub extends EventEmitter implements PubSubAdapter {
  isConnected = false
  subscriber: Subscriber

  constructor(connectionString: string) {
    super()
    this.subscriber = createSubscriber(
      { connectionString },
      {
        retryInterval: (attempt) => Math.min(attempt * 100, 1000),
        retryTimeout: 60 * 1000 * 60 * 14, // 24h
      }
    )

    this.subscriber.events.on('error', (e) => {
      this.isConnected = false
      this.emit('error', e)
    })
  }

  async start(opts?: { signal?: AbortSignal }): Promise<void> {
    if (opts?.signal?.aborted) {
      throw ERRORS.Aborted('Postgres pubsub connection aborted')
    }

    await this.subscriber.connect()
    this.isConnected = true

    if (opts?.signal) {
      opts.signal.addEventListener(
        'abort',
        async () => {
          logSchema.info(logger, '[PubSub] Stopping', {
            type: 'pubsub',
          })
          await this.close()
        },
        { once: true }
      )
    }

    await Promise.all(
      this.subscriber.notifications.eventNames().map(async (channel) => {
        return this.subscriber.listenTo(channel as string)
      })
    )
  }

  async close(): Promise<void> {
    this.isConnected = false
    this.subscriber.notifications.eventNames().forEach((event) => {
      this.subscriber.notifications.removeAllListeners(event)
    })
    await this.subscriber.close()
    logSchema.info(logger, '[PubSub] Exited', {
      type: 'pubsub',
    })
  }

  async publish(channel: string, payload: unknown): Promise<void> {
    await this.subscriber.notify(channel, payload)
  }

  async subscribe(channel: string, cb: (payload: unknown) => void): Promise<void> {
    const listenerCount = this.subscriber.notifications.listenerCount(channel)
    this.subscriber.notifications.on(channel, cb)

    if (this.isConnected && listenerCount === 0) {
      await this.subscriber.listenTo(channel)
    }
  }

  async unsubscribe(channel: string, cb: (payload: unknown) => void): Promise<void> {
    this.subscriber.notifications.removeListener(channel, cb)

    const isListening = this.subscriber.notifications.listenerCount(channel) > 0

    if (!isListening && this.isConnected) {
      await this.subscriber.unlisten(channel)
    }
  }
}
