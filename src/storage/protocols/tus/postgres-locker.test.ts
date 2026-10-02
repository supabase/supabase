import { ERRORS, ErrorCode } from '@internal/errors'
import { PubSubAdapter } from '@internal/pubsub'
import { Database } from '../../database'
import { LockNotifier, PgLock } from './postgres-locker'

class FakePubSub implements PubSubAdapter {
  readonly startSpy = vi.fn(async () => undefined)
  readonly publishSpy = vi.fn(async (_channel: string, _message: unknown) => undefined)
  readonly subscribeSpy = vi.fn(
    async (_channel: string, _cb: (message: unknown) => void) => undefined
  )
  readonly unsubscribeSpy = vi.fn(
    async (_channel: string, _cb: (message: unknown) => void) => undefined
  )
  readonly closeSpy = vi.fn(async () => undefined)

  start(): Promise<void> {
    return this.startSpy()
  }

  publish(channel: string, message: unknown): Promise<void> {
    return this.publishSpy(channel, message)
  }

  subscribe(channel: string, cb: (message: unknown) => void): Promise<void> {
    return this.subscribeSpy(channel, cb)
  }

  unsubscribe(channel: string, cb: (message: unknown) => void): Promise<void> {
    return this.unsubscribeSpy(channel, cb)
  }

  close(): Promise<void> {
    return this.closeSpy()
  }

  on(): this {
    return this
  }
}

describe('LockNotifier', () => {
  it('ignores malformed pubsub payloads', () => {
    const pubSub = new FakePubSub()
    const notifier = new LockNotifier(pubSub)
    const onRelease = vi.fn()

    notifier.onRelease('upload-id', onRelease)

    expect(() => notifier.handler('upload-id')).not.toThrow()
    expect(() => notifier.handler({ id: 123 })).not.toThrow()
    expect(onRelease).not.toHaveBeenCalled()
  })

  it('emits release events for valid payloads', () => {
    const pubSub = new FakePubSub()
    const notifier = new LockNotifier(pubSub)
    const onRelease = vi.fn()

    notifier.onRelease('upload-id', onRelease)
    notifier.handler({ id: 'upload-id' })

    expect(onRelease).toHaveBeenCalledTimes(1)
  })

  it('subscribes and unsubscribes the shared handler', async () => {
    const pubSub = new FakePubSub()
    const notifier = new LockNotifier(pubSub)

    await notifier.start()
    await notifier.stop()

    expect(pubSub.subscribeSpy).toHaveBeenCalledWith('REQUEST_LOCK_RELEASE', notifier.handler)
    expect(pubSub.unsubscribeSpy).toHaveBeenCalledWith('REQUEST_LOCK_RELEASE', notifier.handler)
  })
})

describe('PgLock', () => {
  function createLock(
    mustLockObject: Database['mustLockObject'] = vi.fn(async () => {
      throw ERRORS.ResourceLocked()
    })
  ) {
    const pubSub = new FakePubSub()
    const notifier = new LockNotifier(pubSub)
    const transactionDb = { mustLockObject } as unknown as Database
    let transactionSettled = false
    const withTransaction = vi.fn<Database['withTransaction']>(
      async <T>(fn: (db: Database) => Promise<T>) => {
        try {
          return await fn(transactionDb)
        } finally {
          transactionSettled = true
        }
      }
    )
    const db = { withTransaction } as unknown as Database

    return {
      lock: new PgLock('tenant/bucket/object/version', db, notifier),
      mustLockObject,
      pubSub,
      withTransaction,
      hasTransactionSettled: () => transactionSettled,
    }
  }

  function outcomeByNextTurn(promise: Promise<void>) {
    return Promise.race([
      promise.then(
        () => ({ status: 'fulfilled' as const }),
        (error: unknown) => ({ status: 'rejected' as const, error })
      ),
      new Promise<{ status: 'pending' }>((resolve) => {
        setImmediate(() => resolve({ status: 'pending' }))
      }),
    ])
  }

  it('stops waiting for a contended lock when acquisition is aborted', async () => {
    const { lock, pubSub, withTransaction, hasTransactionSettled } = createLock()
    const controller = new AbortController()

    const acquisition = lock.lock(controller.signal, vi.fn())

    await vi.waitFor(() => expect(pubSub.publishSpy).toHaveBeenCalledOnce())
    controller.abort()

    const outcome = await outcomeByNextTurn(acquisition)

    expect(outcome).toEqual({
      status: 'rejected',
      error: expect.objectContaining({ code: ErrorCode.LockTimeout }),
    })
    expect(hasTransactionSettled()).toBe(true)
    expect(withTransaction).toHaveBeenCalledOnce()
  })

  it('rejects without opening a transaction when already aborted', async () => {
    const { lock, mustLockObject, pubSub, withTransaction } = createLock()
    const controller = new AbortController()
    controller.abort()

    const outcome = await outcomeByNextTurn(lock.lock(controller.signal, vi.fn()))

    expect(outcome).toEqual({
      status: 'rejected',
      error: expect.objectContaining({ code: ErrorCode.LockTimeout }),
    })
    expect(withTransaction).not.toHaveBeenCalled()
    expect(mustLockObject).not.toHaveBeenCalled()
    expect(pubSub.publishSpy).not.toHaveBeenCalled()
  })

  it('settles an acquired lock transaction when it is released', async () => {
    const { lock, hasTransactionSettled } = createLock(vi.fn(async () => true))
    const controller = new AbortController()

    await lock.lock(controller.signal, vi.fn())
    expect(hasTransactionSettled()).toBe(false)

    await lock.unlock()

    await vi.waitFor(() => expect(hasTransactionSettled()).toBe(true))
  })

  it('keeps an acquired lock transaction open until unlock after the request is aborted', async () => {
    const { lock, hasTransactionSettled } = createLock(vi.fn(async () => true))
    const controller = new AbortController()

    await lock.lock(controller.signal, vi.fn())
    expect(hasTransactionSettled()).toBe(false)

    controller.abort()
    await new Promise((resolve) => setImmediate(resolve))

    expect(hasTransactionSettled()).toBe(false)

    await lock.unlock()

    await vi.waitFor(() => expect(hasTransactionSettled()).toBe(true))
  })

  it('does not acquire a lock when the request aborts as the database call completes', async () => {
    const databaseLock = Promise.withResolvers<boolean>()
    const mustLockObject = vi.fn(() => databaseLock.promise)
    const { lock, hasTransactionSettled } = createLock(mustLockObject)
    const controller = new AbortController()

    const acquisition = lock.lock(controller.signal, vi.fn())
    await vi.waitFor(() => expect(mustLockObject).toHaveBeenCalledOnce())

    // abort in the same turn, queued but not yet accepted
    databaseLock.resolve(true)
    controller.abort()

    const outcome = await outcomeByNextTurn(acquisition)
    expect(outcome).toEqual({
      status: 'rejected',
      error: expect.objectContaining({ code: ErrorCode.LockTimeout }),
    })
    expect(hasTransactionSettled()).toBe(true)
  })
})
