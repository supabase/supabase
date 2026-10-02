import { vi } from 'vitest'

type QueueModule = typeof import('./queue')
type MonitoringModule = typeof import('../monitoring')

async function loadQueueModule() {
  vi.resetModules()

  const configModule = await import('../../config')
  configModule.getConfig({ reload: true })

  const queueModule = (await import('./queue')) as QueueModule
  const monitoringModule = (await import('../monitoring')) as MonitoringModule

  return { queueModule, monitoringModule }
}

const createJob = (id: string, data: Record<string, unknown> = {}) => ({
  id,
  data,
  priority: 1,
  retryCount: 0,
  retryLimit: 1,
})

describe('Queue worker', () => {
  async function startWorker(opts: {
    handle: (job: { id: string; data: Record<string, unknown> }) => Promise<unknown>
    fetch?: ReturnType<typeof vi.fn>
    complete?: ReturnType<typeof vi.fn>
    fail?: ReturnType<typeof vi.fn>
    workerOptions?: Record<string, unknown>
    concurrentTaskCount?: number
    onMessage?: (job: { data: Record<string, unknown> }) => void
  }) {
    const {
      queueModule: { Queue },
      monitoringModule,
    } = await loadQueueModule()
    const abortController = new AbortController()
    const errorSpy = vi.spyOn(monitoringModule.logSchema, 'error')
    const complete = opts.complete ?? vi.fn().mockResolvedValue(undefined)
    const fail = opts.fail ?? vi.fn().mockResolvedValue(undefined)
    const fetch =
      opts.fetch ??
      vi
        .fn()
        .mockResolvedValueOnce([createJob('job-1')])
        .mockResolvedValueOnce([])

    ;(Queue as unknown as { pgBoss: unknown }).pgBoss = { complete, fail, fetch }
    ;(Queue as unknown as { pollQueue: Function }).pollQueue(
      {
        getQueueName: () => 'test-queue',
        getWorkerOptions: () => ({
          pollingIntervalSeconds: 1,
          ...opts.workerOptions,
        }),
        handle: opts.handle,
        name: 'TestEvent',
      },
      {
        concurrentTaskCount: opts.concurrentTaskCount ?? 1,
        onMessage: opts.onMessage,
        signal: abortController.signal,
      }
    )

    return { monitoringModule, abortController, errorSpy, complete, fail, fetch }
  }

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it.each([
    ['top-level sbReqId', { sbReqId: 'sb-req-123', reqId: 'trace-123' }, 'sb-req-123'],
    [
      'nested webhook sbReqId',
      {
        event: {
          payload: {
            sbReqId: 'sb-req-456',
            reqId: 'trace-456',
          },
        },
      },
      'sb-req-456',
    ],
    [
      'missing sbReqId',
      {
        reqId: 'trace-only',
      },
      undefined,
    ],
  ])('propagates %s into queue job handling', async (_label, data, expectedSbReqId) => {
    vi.useFakeTimers()

    let onMessageSbReqId: string | undefined
    const { monitoringModule, abortController, errorSpy } = await startWorker({
      fetch: vi
        .fn()
        .mockResolvedValueOnce([createJob('job-1', data)])
        .mockResolvedValueOnce([]),
      handle: vi.fn(async () => {
        throw new Error('boom')
      }),
      onMessage: (job) => {
        const payload = job.data as {
          sbReqId?: string
          event?: { payload?: { sbReqId?: string } }
        }
        onMessageSbReqId = payload.sbReqId ?? payload.event?.payload?.sbReqId
      },
    })

    await vi.advanceTimersByTimeAsync(1_000)
    abortController.abort()

    expect(onMessageSbReqId).toBe(expectedSbReqId)
    const processingErrorCall = errorSpy.mock.calls.find(
      ([, message]) => message === '[Queue Handler] Error while processing job TestEvent'
    )
    expect(processingErrorCall?.[0]).toBe(monitoringModule.logger)
    expect((processingErrorCall?.[2] as { sbReqId?: string }).sbReqId).toBe(expectedSbReqId)
  })

  it('limits concurrent handlers and fetches remaining capacity while jobs are active', async () => {
    vi.useFakeTimers()

    const releaseJob1 = Promise.withResolvers<void>()
    const releaseJob2 = Promise.withResolvers<void>()
    const releaseJob3 = Promise.withResolvers<void>()
    const releases = new Map([
      ['job-1', releaseJob1],
      ['job-2', releaseJob2],
      ['job-3', releaseJob3],
    ])
    const startedJobs: string[] = []
    let activeHandlers = 0
    let maxActiveHandlers = 0

    const { abortController, complete, fetch } = await startWorker({
      fetch: vi
        .fn()
        .mockResolvedValueOnce([createJob('job-1'), createJob('job-2')])
        .mockResolvedValueOnce([createJob('job-3')])
        .mockResolvedValueOnce([]),
      handle: vi.fn(async (job: { id: string }) => {
        startedJobs.push(job.id)
        activeHandlers++
        maxActiveHandlers = Math.max(maxActiveHandlers, activeHandlers)

        try {
          await releases.get(job.id)?.promise
        } finally {
          activeHandlers--
        }
      }),
      workerOptions: { batchSize: 3 },
      concurrentTaskCount: 2,
    })

    await vi.advanceTimersByTimeAsync(1_000)

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'test-queue',
      expect.objectContaining({ batchSize: 3 })
    )
    expect(startedJobs).toEqual(['job-1', 'job-2'])
    expect(maxActiveHandlers).toBe(2)

    await vi.advanceTimersByTimeAsync(1_000)

    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'test-queue',
      expect.objectContaining({ batchSize: 1 })
    )
    expect(startedJobs).toEqual(['job-1', 'job-2'])

    releaseJob1.resolve()
    await vi.advanceTimersByTimeAsync(0)

    expect(startedJobs).toEqual(['job-1', 'job-2', 'job-3'])
    expect(maxActiveHandlers).toBe(2)

    releaseJob2.resolve()
    releaseJob3.resolve()
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(1_000)

    expect(fetch).toHaveBeenNthCalledWith(
      3,
      'test-queue',
      expect.objectContaining({ batchSize: 3 })
    )
    expect(complete).toHaveBeenCalledTimes(3)

    abortController.abort()
  })

  it('restores the fetch budget after failed jobs', async () => {
    vi.useFakeTimers()

    const { abortController, fail, fetch } = await startWorker({
      fetch: vi
        .fn()
        .mockResolvedValueOnce([createJob('job-1'), createJob('job-2')])
        .mockResolvedValue([]),
      handle: vi.fn().mockRejectedValue(new Error('handler failed')),
    })

    await vi.advanceTimersByTimeAsync(1_000)

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'test-queue',
      expect.objectContaining({ batchSize: 2 })
    )
    expect(fail).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1_000)

    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'test-queue',
      expect.objectContaining({ batchSize: 2 })
    )

    abortController.abort()
  })

  it('does not fail a succeeded job when completion fails', async () => {
    vi.useFakeTimers()

    const completeError = new Error('complete failed')
    const { monitoringModule, abortController, errorSpy, complete, fail } = await startWorker({
      complete: vi.fn().mockRejectedValue(completeError),
      handle: vi.fn().mockResolvedValue(undefined),
    })

    await vi.advanceTimersByTimeAsync(1_000)
    abortController.abort()

    expect(complete).toHaveBeenCalledTimes(1)
    expect(fail).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith(
      monitoringModule.logger,
      '[Queue Handler] Error while completing job TestEvent',
      expect.objectContaining({
        type: 'queue-task',
        error: completeError,
      })
    )
  })

  it('logs the original handler error when marking the job as failed rejects', async () => {
    vi.useFakeTimers()

    const handlerError = new Error('handler failed')
    const failError = new Error('fail failed')
    const { monitoringModule, abortController, errorSpy, complete, fail } = await startWorker({
      fail: vi.fn().mockRejectedValue(failError),
      handle: vi.fn().mockRejectedValue(handlerError),
    })

    await vi.advanceTimersByTimeAsync(1_000)
    abortController.abort()

    expect(fail).toHaveBeenCalledTimes(1)
    expect(complete).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith(
      monitoringModule.logger,
      '[Queue Handler] Error while processing job TestEvent',
      expect.objectContaining({
        type: 'queue-task',
        error: handlerError,
      })
    )
    expect(errorSpy).toHaveBeenCalledWith(
      monitoringModule.logger,
      '[Queue Handler] Error while marking job as failed TestEvent',
      expect.objectContaining({
        type: 'queue-task',
        error: failError,
      })
    )
  })
})

describe('Queue.stop', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('times out a hung pg-boss stop and clears cached queue state', async () => {
    vi.useFakeTimers()

    const {
      queueModule: { Queue },
    } = await loadQueueModule()
    const boss = {
      stop: vi.fn(() => new Promise<void>(() => undefined)),
    }
    const db = {}

    ;(Queue as unknown as { pgBoss: unknown }).pgBoss = boss
    ;(Queue as unknown as { pgBossDb: unknown }).pgBossDb = db

    const stopPromise = Queue.stop()
    const stopErrorPromise = stopPromise.catch((error) => error)

    await vi.advanceTimersByTimeAsync(25_000)

    expect(await stopErrorPromise).toEqual(
      expect.objectContaining({
        message: 'Queue stop timed out after 25000ms',
      })
    )
    expect(boss.stop).toHaveBeenCalledWith({
      timeout: 20 * 1000,
      graceful: false,
      wait: true,
    })
    expect((Queue as unknown as { pgBoss?: unknown }).pgBoss).toBeUndefined()
    expect((Queue as unknown as { pgBossDb?: unknown }).pgBossDb).toBeUndefined()
  })

  it('clears cached queue state when close hooks time out', async () => {
    vi.useFakeTimers()

    const {
      queueModule: { Queue },
    } = await loadQueueModule()
    const boss = {
      stop: vi.fn().mockResolvedValue(undefined),
    }
    const db = {}

    ;(Queue as unknown as { pgBoss: unknown }).pgBoss = boss
    ;(Queue as unknown as { pgBossDb: unknown }).pgBossDb = db
    ;(Queue as unknown as { events: Array<{ onClose: () => Promise<void> }> }).events = [
      {
        onClose: () => new Promise<void>(() => undefined),
      },
    ]

    const stopPromise = Queue.stop()
    const stopErrorPromise = stopPromise.catch((error) => error)

    await vi.advanceTimersByTimeAsync(25_000)

    expect(await stopErrorPromise).toEqual(
      expect.objectContaining({
        message: 'Queue close timed out after 25000ms',
      })
    )
    expect((Queue as unknown as { pgBoss?: unknown }).pgBoss).toBeUndefined()
    expect((Queue as unknown as { pgBossDb?: unknown }).pgBossDb).toBeUndefined()
  })
})
